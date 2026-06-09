"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  candidateProfiles,
  employerProfiles,
  whatsappContacts,
} from "@/lib/db/schema";
import { checkEmployerWhatsappQuota } from "@/lib/quotas";
import { buildWhatsAppUrl, employerContactMessage } from "@/lib/whatsapp";
import { createNotificationFor } from "@/features/notifications/actions";
import type { ActionResult } from "@/types";
import {
  updateEmployerProfileSchema,
  type UpdateEmployerProfileInput,
} from "./schemas";

const LOGO_BUCKET = "company-logos";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_MIME = ["image/jpeg", "image/png", "image/webp"];

function formatZodError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Formulaire invalide";
}

function emptyToNull<T extends string | undefined>(v: T): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function updateProfile(
  input: UpdateEmployerProfileInput,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireRole("employer");
  const parsed = updateEmployerProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const d = parsed.data;

  await db
    .update(employerProfiles)
    .set({
      companyName: d.companyName,
      city: emptyToNull(d.city),
      whatsappPhone: emptyToNull(d.whatsappPhone),
      description: emptyToNull(d.description),
      updatedAt: new Date(),
    })
    .where(eq(employerProfiles.userId, user.id));

  revalidatePath("/e/profile");
  return { success: true, data: { ok: true } };
}

export async function uploadLogo(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const user = await requireRole("employer");
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Aucun fichier" };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { success: false, error: "Fichier trop volumineux (max 2 MB)" };
  }
  if (!LOGO_MIME.includes(file.type)) {
    return { success: false, error: "Format invalide (JPG/PNG/WEBP)" };
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `${user.id}/logo-${Date.now()}.${ext}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;

  await db
    .update(employerProfiles)
    .set({ logoUrl: url, updatedAt: new Date() })
    .where(eq(employerProfiles.userId, user.id));

  revalidatePath("/e/profile");
  return { success: true, data: { url } };
}

// =========================================================================
// WhatsApp contact tracking (Phase 7)
// =========================================================================

const contactCandidateSchema = z.object({
  candidateId: z.string().uuid("Identifiant invalide"),
});

export type ContactCandidateResult = {
  whatsappUrl: string;
  remaining: number | "unlimited";
};

/**
 * Track an employer-initiated WhatsApp contact toward a candidate. Decrements
 * the employer's monthly WhatsApp quota, records the interaction for analytics,
 * and notifies the candidate. Returns the WhatsApp deep-link the client should
 * open after the action succeeds. Quota & role checks happen here — the client
 * value from `useQuotas` is indicative only (§1 of CLAUDE.md).
 */
export async function contactCandidateOnWhatsApp(
  candidateId: string,
): Promise<ActionResult<ContactCandidateResult>> {
  const user = await requireRole("employer");

  const parsed = contactCandidateSchema.safeParse({ candidateId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const quota = await checkEmployerWhatsappQuota(user.id);
  if (!quota.allowed) {
    return {
      success: false,
      error:
        "Quota mensuel de contacts WhatsApp atteint. Passez à l'offre Pro pour des contacts illimités.",
      code: "QUOTA_REACHED",
    };
  }

  const [candidate] = await db
    .select({
      userId: candidateProfiles.userId,
      firstName: candidateProfiles.firstName,
      lastName: candidateProfiles.lastName,
      whatsappPhone: candidateProfiles.whatsappPhone,
    })
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, parsed.data.candidateId))
    .limit(1);

  if (!candidate) {
    return { success: false, error: "Candidat introuvable", code: "NOT_FOUND" };
  }
  if (!candidate.whatsappPhone) {
    return {
      success: false,
      error: "Ce candidat n'a pas renseigné de numéro WhatsApp",
      code: "NO_PHONE",
    };
  }

  const [employer] = await db
    .select({ companyName: employerProfiles.companyName })
    .from(employerProfiles)
    .where(eq(employerProfiles.userId, user.id))
    .limit(1);

  await db.insert(whatsappContacts).values({
    employerId: user.id,
    candidateId: candidate.userId,
  });

  await createNotificationFor({
    userId: candidate.userId,
    type: "profile_viewed",
    title: "Une entreprise vous contacte",
    message: `${employer?.companyName ?? "Une entreprise"} souhaite vous contacter sur WhatsApp.`,
    metadata: {
      contactMethod: "whatsapp",
      employerId: user.id,
      employerName: employer?.companyName ?? null,
    },
  });

  const whatsappUrl = buildWhatsAppUrl(
    candidate.whatsappPhone,
    employerContactMessage(candidate.firstName),
  );

  return {
    success: true,
    data: {
      whatsappUrl,
      remaining:
        quota.limit === Infinity ? "unlimited" : Math.max(0, quota.remaining - 1),
    },
  };
}
