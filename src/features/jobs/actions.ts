"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { checkEmployerActiveJobsQuota } from "@/lib/quotas";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  jobOfferMissions,
  jobOfferSkills,
  jobOffers,
} from "@/lib/db/schema";
import type { ActionResult } from "@/types";
import {
  createJobOfferSchema,
  updateJobOfferSchema,
  type CreateJobOfferInput,
  type UpdateJobOfferInput,
} from "./schemas";

const JOB_IMAGE_BUCKET = "job-images";
const MAX_JOB_IMAGE_BYTES = 2 * 1024 * 1024;
const JOB_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];

function formatZodError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Formulaire invalide";
}

function emptyToNull<T extends string | undefined>(v: T): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t.length ? t : null;
}

function deriveSalaryLabel(input: CreateJobOfferInput): string | null {
  if (input.salaryLabel?.trim()) return input.salaryLabel.trim();
  if (input.salaryMin && input.salaryMax) {
    return `${input.salaryMin / 1000}k - ${input.salaryMax / 1000}k FCFA`;
  }
  if (input.salaryMin) return `À partir de ${input.salaryMin / 1000}k FCFA`;
  return null;
}

// =========================================================================
// CRUD
// =========================================================================

export async function createJobOffer(
  input: CreateJobOfferInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole("employer");

  const quota = await checkEmployerActiveJobsQuota(user.id);
  if (!quota.allowed) {
    return {
      success: false,
      error: `Limite d'offres actives atteinte (${quota.limit}). Passez au plan Pro.`,
      code: "quota_exceeded",
    };
  }

  const parsed = createJobOfferSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const d = parsed.data;

  const expiresAt = emptyToNull(d.expiresAt);
  const [created] = await db
    .insert(jobOffers)
    .values({
      employerId: user.id,
      type: d.type,
      title: d.title,
      city: emptyToNull(d.city),
      salaryMin: d.salaryMin ?? null,
      salaryMax: d.salaryMax ?? null,
      salaryLabel: deriveSalaryLabel(d),
      description: d.description,
      imageUrl: emptyToNull(d.imageUrl),
      status: "active",
      publishedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning({ id: jobOffers.id });

  if (d.skillIds.length > 0) {
    await db.insert(jobOfferSkills).values(
      d.skillIds.map((skillId) => ({
        jobOfferId: created.id,
        skillId,
      })),
    );
  }
  if (d.missions.length > 0) {
    await db.insert(jobOfferMissions).values(
      d.missions.map((text, position) => ({
        jobOfferId: created.id,
        position,
        text,
      })),
    );
  }

  revalidatePath("/e/jobs");
  revalidatePath("/c/jobs");
  revalidatePath("/e/home");
  revalidatePath("/c/home");
  return { success: true, data: { id: created.id } };
}

export async function updateJobOffer(
  input: UpdateJobOfferInput,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireRole("employer");
  const parsed = updateJobOfferSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const d = parsed.data;

  const expiresAt = emptyToNull(d.expiresAt);
  const updated = await db
    .update(jobOffers)
    .set({
      type: d.type,
      title: d.title,
      city: emptyToNull(d.city),
      salaryMin: d.salaryMin ?? null,
      salaryMax: d.salaryMax ?? null,
      salaryLabel: deriveSalaryLabel(d),
      description: d.description,
      imageUrl: emptyToNull(d.imageUrl),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      updatedAt: new Date(),
    })
    .where(and(eq(jobOffers.id, d.id), eq(jobOffers.employerId, user.id)))
    .returning({ id: jobOffers.id });

  if (updated.length === 0) {
    return { success: false, error: "Offre introuvable" };
  }

  // Replace skills and missions in one shot
  await db.delete(jobOfferSkills).where(eq(jobOfferSkills.jobOfferId, d.id));
  if (d.skillIds.length > 0) {
    await db
      .insert(jobOfferSkills)
      .values(d.skillIds.map((skillId) => ({ jobOfferId: d.id, skillId })));
  }
  await db
    .delete(jobOfferMissions)
    .where(eq(jobOfferMissions.jobOfferId, d.id));
  if (d.missions.length > 0) {
    await db.insert(jobOfferMissions).values(
      d.missions.map((text, position) => ({
        jobOfferId: d.id,
        position,
        text,
      })),
    );
  }

  revalidatePath("/e/jobs");
  revalidatePath("/c/jobs");
  revalidatePath(`/e/jobs/${d.id}`);
  revalidatePath(`/c/jobs/${d.id}`);
  return { success: true, data: { ok: true } };
}

export async function closeJobOffer(
  id: string,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireRole("employer");
  const result = await db
    .update(jobOffers)
    .set({ status: "closed", updatedAt: new Date() })
    .where(and(eq(jobOffers.id, id), eq(jobOffers.employerId, user.id)))
    .returning({ id: jobOffers.id });
  if (result.length === 0) {
    return { success: false, error: "Offre introuvable" };
  }
  revalidatePath("/e/jobs");
  revalidatePath("/c/jobs");
  revalidatePath(`/e/jobs/${id}`);
  revalidatePath(`/c/jobs/${id}`);
  return { success: true, data: { ok: true } };
}

export async function reopenJobOffer(
  id: string,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireRole("employer");
  const quota = await checkEmployerActiveJobsQuota(user.id);
  if (!quota.allowed) {
    return {
      success: false,
      error: `Limite d'offres actives atteinte (${quota.limit}).`,
      code: "quota_exceeded",
    };
  }
  const result = await db
    .update(jobOffers)
    .set({ status: "active", updatedAt: new Date(), publishedAt: new Date() })
    .where(and(eq(jobOffers.id, id), eq(jobOffers.employerId, user.id)))
    .returning({ id: jobOffers.id });
  if (result.length === 0) {
    return { success: false, error: "Offre introuvable" };
  }
  revalidatePath("/e/jobs");
  revalidatePath("/c/jobs");
  revalidatePath(`/e/jobs/${id}`);
  revalidatePath(`/c/jobs/${id}`);
  return { success: true, data: { ok: true } };
}

export async function duplicateJobOffer(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole("employer");
  const quota = await checkEmployerActiveJobsQuota(user.id);
  if (!quota.allowed) {
    return {
      success: false,
      error: `Limite d'offres actives atteinte (${quota.limit}). Passez au plan Pro.`,
      code: "quota_exceeded",
    };
  }

  const [src] = await db
    .select()
    .from(jobOffers)
    .where(and(eq(jobOffers.id, id), eq(jobOffers.employerId, user.id)));
  if (!src) return { success: false, error: "Offre introuvable" };

  const [created] = await db
    .insert(jobOffers)
    .values({
      employerId: user.id,
      type: src.type,
      title: `${src.title} (copie)`,
      city: src.city,
      salaryMin: src.salaryMin,
      salaryMax: src.salaryMax,
      salaryLabel: src.salaryLabel,
      description: src.description,
      imageUrl: src.imageUrl,
      status: "active",
      publishedAt: new Date(),
      expiresAt: src.expiresAt,
    })
    .returning({ id: jobOffers.id });

  const srcSkills = await db
    .select()
    .from(jobOfferSkills)
    .where(eq(jobOfferSkills.jobOfferId, id));
  if (srcSkills.length > 0) {
    await db
      .insert(jobOfferSkills)
      .values(
        srcSkills.map((r) => ({ jobOfferId: created.id, skillId: r.skillId })),
      );
  }
  const srcMissions = await db
    .select()
    .from(jobOfferMissions)
    .where(eq(jobOfferMissions.jobOfferId, id))
    .orderBy(jobOfferMissions.position);
  if (srcMissions.length > 0) {
    await db.insert(jobOfferMissions).values(
      srcMissions.map((m) => ({
        jobOfferId: created.id,
        position: m.position,
        text: m.text,
      })),
    );
  }

  revalidatePath("/e/jobs");
  revalidatePath("/c/jobs");
  return { success: true, data: { id: created.id } };
}

// =========================================================================
// UPLOAD : Job cover image
// =========================================================================

export async function uploadJobImage(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const user = await requireRole("employer");
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Aucun fichier" };
  }
  if (file.size > MAX_JOB_IMAGE_BYTES) {
    return { success: false, error: "Fichier trop volumineux (max 2 MB)" };
  }
  if (!JOB_IMAGE_MIME.includes(file.type)) {
    return { success: false, error: "Format invalide (JPG/PNG/WEBP)" };
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `${user.id}/job-${Date.now()}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(JOB_IMAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { success: false, error: error.message };

  const { data } = supabase.storage.from(JOB_IMAGE_BUCKET).getPublicUrl(path);
  return { success: true, data: { url: data.publicUrl } };
}
