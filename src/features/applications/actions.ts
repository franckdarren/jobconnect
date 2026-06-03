"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { checkCandidateApplicationQuota } from "@/lib/quotas";
import { db } from "@/lib/db";
import {
  applications,
  candidateProfiles,
  employerProfiles,
  jobOffers,
} from "@/lib/db/schema";
import type { ActionResult } from "@/types";
import { createNotificationFor } from "@/features/notifications/actions";

export async function applyToJob(
  jobId: string,
): Promise<ActionResult<{ id: string; whatsappPhone: string | null }>> {
  const user = await requireRole("candidate");

  // 1. Quota
  const quota = await checkCandidateApplicationQuota(user.id);
  if (!quota.allowed) {
    return {
      success: false,
      error: `Limite mensuelle atteinte (${quota.limit} candidatures). Passez en Premium pour un accès illimité.`,
      code: "quota_exceeded",
    };
  }

  // 2. Job must exist and be active
  const [job] = await db
    .select({
      id: jobOffers.id,
      title: jobOffers.title,
      status: jobOffers.status,
      employerId: jobOffers.employerId,
    })
    .from(jobOffers)
    .where(eq(jobOffers.id, jobId));
  if (!job || job.status !== "active") {
    return { success: false, error: "Offre introuvable ou clôturée" };
  }

  // 3. Idempotent — UNIQUE (candidate_id, job_offer_id) prevents duplicates.
  const [existing] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.candidateId, user.id),
        eq(applications.jobOfferId, jobId),
      ),
    );

  let applicationId: string;
  let isNew = false;
  if (existing) {
    applicationId = existing.id;
  } else {
    const [created] = await db
      .insert(applications)
      .values({
        candidateId: user.id,
        jobOfferId: jobId,
        status: "pending",
      })
      .returning({ id: applications.id });
    applicationId = created.id;
    isNew = true;
  }

  // 4. Look up employer WhatsApp + candidate name for the notification.
  const [meta] = await db
    .select({
      employerWhatsapp: employerProfiles.whatsappPhone,
      candidateFirst: candidateProfiles.firstName,
      candidateLast: candidateProfiles.lastName,
    })
    .from(candidateProfiles)
    .innerJoin(employerProfiles, eq(employerProfiles.userId, job.employerId))
    .where(eq(candidateProfiles.userId, user.id));

  if (isNew && meta) {
    await createNotificationFor({
      userId: job.employerId,
      type: "application_sent",
      title: "Nouvelle candidature",
      message: `${meta.candidateFirst} ${meta.candidateLast} a postulé à votre offre "${job.title}".`,
      metadata: {
        applicationId,
        jobId: job.id,
        candidateId: user.id,
      },
    });
  }

  revalidatePath("/c/dashboard");
  revalidatePath(`/e/jobs/${job.id}`);

  return {
    success: true,
    data: {
      id: applicationId,
      whatsappPhone: meta?.employerWhatsapp ?? null,
    },
  };
}

/**
 * Resolve the applications owned by an employer (joined through job_offers).
 */
async function findApplicationByOwner(
  applicationId: string,
  employerId: string,
) {
  const [row] = await db
    .select({ id: applications.id, status: applications.status })
    .from(applications)
    .innerJoin(jobOffers, eq(applications.jobOfferId, jobOffers.id))
    .where(
      and(
        eq(applications.id, applicationId),
        eq(jobOffers.employerId, employerId),
      ),
    );
  return row ?? null;
}

export async function markApplicationViewed(
  applicationId: string,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireRole("employer");
  const row = await findApplicationByOwner(applicationId, user.id);
  if (!row) {
    return { success: false, error: "Candidature introuvable" };
  }
  if (row.status === "pending") {
    await db
      .update(applications)
      .set({ status: "viewed", viewedAt: new Date() })
      .where(eq(applications.id, applicationId));
  }
  revalidatePath("/e/jobs");
  return { success: true, data: { ok: true } };
}

export async function rejectApplication(
  applicationId: string,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireRole("employer");
  const row = await findApplicationByOwner(applicationId, user.id);
  if (!row) {
    return { success: false, error: "Candidature introuvable" };
  }
  await db
    .update(applications)
    .set({ status: "rejected" })
    .where(eq(applications.id, applicationId));
  revalidatePath("/e/jobs");
  return { success: true, data: { ok: true } };
}

/**
 * Bulk helper used when the employer opens the Candidatures tab — marks all
 * still-pending applications for this offer as viewed in one shot.
 */
export async function markAllApplicationsViewed(
  jobOfferId: string,
): Promise<void> {
  const user = await requireRole("employer");

  // Verify ownership of the offer.
  const [job] = await db
    .select({ id: jobOffers.id })
    .from(jobOffers)
    .where(and(eq(jobOffers.id, jobOfferId), eq(jobOffers.employerId, user.id)));
  if (!job) return;

  const pendingRows = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.jobOfferId, jobOfferId),
        eq(applications.status, "pending"),
      ),
    );
  if (pendingRows.length === 0) return;

  await db
    .update(applications)
    .set({ status: "viewed", viewedAt: new Date() })
    .where(
      and(
        inArray(
          applications.id,
          pendingRows.map((r) => r.id),
        ),
        eq(applications.status, "pending"),
      ),
    );
}
