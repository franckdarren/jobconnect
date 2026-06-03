"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  candidateProfiles,
  candidateExperiences,
  candidateEducations,
  candidateSkills,
  skills,
} from "@/lib/db/schema";
import type { ActionResult } from "@/types";
import {
  addEducationSchema,
  addExperienceSchema,
  getOrCreateSkillSchema,
  setSkillsSchema,
  updateCandidateProfileSchema,
  updateEducationSchema,
  updateExperienceSchema,
  type AddEducationInput,
  type AddExperienceInput,
  type SetSkillsInput,
  type UpdateCandidateProfileInput,
  type UpdateEducationInput,
  type UpdateExperienceInput,
} from "./schemas";

const AVATAR_BUCKET = "avatars";
const CV_BUCKET = "cvs";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_CV_BYTES = 5 * 1024 * 1024;
const AVATAR_MIME = ["image/jpeg", "image/png", "image/webp"];

function formatZodError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Formulaire invalide";
}

function emptyToNull<T extends string | undefined>(v: T): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t.length ? t : null;
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// =========================================================================
// PROFILE
// =========================================================================

export async function updateProfile(
  input: UpdateCandidateProfileInput,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireRole("candidate");
  const parsed = updateCandidateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const d = parsed.data;

  await db
    .update(candidateProfiles)
    .set({
      firstName: d.firstName,
      lastName: d.lastName,
      city: emptyToNull(d.city),
      whatsappPhone: emptyToNull(d.whatsappPhone),
      profession: emptyToNull(d.profession),
      summary: emptyToNull(d.summary),
      experienceLevel: (d.experienceLevel || null) as
        | "beginner"
        | "1_3"
        | "3_5"
        | "5_plus"
        | null,
      availability: (d.availability || null) as
        | "immediate"
        | "15_days"
        | "30_days"
        | null,
      updatedAt: new Date(),
    })
    .where(eq(candidateProfiles.userId, user.id));

  revalidatePath("/c/profile");
  return { success: true, data: { ok: true } };
}

// =========================================================================
// UPLOADS — Avatar + CV
// =========================================================================

export async function uploadAvatar(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const user = await requireRole("candidate");
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Aucun fichier" };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { success: false, error: "Fichier trop volumineux (max 2 MB)" };
  }
  if (!AVATAR_MIME.includes(file.type)) {
    return { success: false, error: "Format invalide (JPG/PNG/WEBP)" };
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;

  await db
    .update(candidateProfiles)
    .set({ photoUrl: url, updatedAt: new Date() })
    .where(eq(candidateProfiles.userId, user.id));

  revalidatePath("/c/profile");
  return { success: true, data: { url } };
}

export async function uploadCv(
  formData: FormData,
): Promise<ActionResult<{ path: string }>> {
  const user = await requireRole("candidate");
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Aucun fichier" };
  }
  if (file.size > MAX_CV_BYTES) {
    return { success: false, error: "Fichier trop volumineux (max 5 MB)" };
  }
  if (file.type !== "application/pdf") {
    return { success: false, error: "Format invalide (PDF uniquement)" };
  }

  const path = `${user.id}/cv-${Date.now()}.pdf`;
  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(CV_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: "application/pdf",
    });
  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  // We store the storage path (not a public URL) because the cvs bucket is private.
  await db
    .update(candidateProfiles)
    .set({ cvUrl: path, updatedAt: new Date() })
    .where(eq(candidateProfiles.userId, user.id));

  revalidatePath("/c/profile");
  return { success: true, data: { path } };
}

export async function getCvSignedUrl(
  expiresInSeconds = 60,
): Promise<ActionResult<{ url: string }>> {
  const user = await requireRole("candidate");
  const [row] = await db
    .select({ cvUrl: candidateProfiles.cvUrl })
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, user.id));
  if (!row?.cvUrl) {
    return { success: false, error: "Aucun CV téléversé" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(CV_BUCKET)
    .createSignedUrl(row.cvUrl, expiresInSeconds);
  if (error || !data?.signedUrl) {
    return { success: false, error: error?.message ?? "Erreur signature" };
  }
  return { success: true, data: { url: data.signedUrl } };
}

// =========================================================================
// EXPERIENCES
// =========================================================================

export async function addExperience(
  input: AddExperienceInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole("candidate");
  const parsed = addExperienceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const d = parsed.data;

  const [row] = await db
    .insert(candidateExperiences)
    .values({
      candidateId: user.id,
      title: d.title,
      company: d.company,
      city: emptyToNull(d.city),
      startDate: d.startDate,
      endDate: d.current ? null : emptyToNull(d.endDate),
      current: d.current,
      description: emptyToNull(d.description),
    })
    .returning({ id: candidateExperiences.id });

  revalidatePath("/c/profile");
  return { success: true, data: { id: row.id } };
}

export async function updateExperience(
  input: UpdateExperienceInput,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireRole("candidate");
  const parsed = updateExperienceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const d = parsed.data;

  const result = await db
    .update(candidateExperiences)
    .set({
      title: d.title,
      company: d.company,
      city: emptyToNull(d.city),
      startDate: d.startDate,
      endDate: d.current ? null : emptyToNull(d.endDate),
      current: d.current,
      description: emptyToNull(d.description),
    })
    .where(
      and(
        eq(candidateExperiences.id, d.id),
        eq(candidateExperiences.candidateId, user.id),
      ),
    )
    .returning({ id: candidateExperiences.id });

  if (result.length === 0) {
    return { success: false, error: "Expérience introuvable" };
  }
  revalidatePath("/c/profile");
  return { success: true, data: { ok: true } };
}

export async function deleteExperience(
  id: string,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireRole("candidate");
  await db
    .delete(candidateExperiences)
    .where(
      and(
        eq(candidateExperiences.id, id),
        eq(candidateExperiences.candidateId, user.id),
      ),
    );
  revalidatePath("/c/profile");
  return { success: true, data: { ok: true } };
}

// =========================================================================
// EDUCATIONS
// =========================================================================

export async function addEducation(
  input: AddEducationInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole("candidate");
  const parsed = addEducationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const d = parsed.data;

  const [row] = await db
    .insert(candidateEducations)
    .values({
      candidateId: user.id,
      degree: d.degree,
      school: d.school,
      startYear: d.startYear ?? null,
      endYear: d.endYear ?? null,
      description: emptyToNull(d.description),
    })
    .returning({ id: candidateEducations.id });
  revalidatePath("/c/profile");
  return { success: true, data: { id: row.id } };
}

export async function updateEducation(
  input: UpdateEducationInput,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireRole("candidate");
  const parsed = updateEducationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const d = parsed.data;

  const result = await db
    .update(candidateEducations)
    .set({
      degree: d.degree,
      school: d.school,
      startYear: d.startYear ?? null,
      endYear: d.endYear ?? null,
      description: emptyToNull(d.description),
    })
    .where(
      and(
        eq(candidateEducations.id, d.id),
        eq(candidateEducations.candidateId, user.id),
      ),
    )
    .returning({ id: candidateEducations.id });
  if (result.length === 0) {
    return { success: false, error: "Formation introuvable" };
  }
  revalidatePath("/c/profile");
  return { success: true, data: { ok: true } };
}

export async function deleteEducation(
  id: string,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireRole("candidate");
  await db
    .delete(candidateEducations)
    .where(
      and(
        eq(candidateEducations.id, id),
        eq(candidateEducations.candidateId, user.id),
      ),
    );
  revalidatePath("/c/profile");
  return { success: true, data: { ok: true } };
}

// =========================================================================
// SKILLS
// =========================================================================

export async function getOrCreateSkill(
  name: string,
): Promise<ActionResult<{ id: string; name: string }>> {
  await requireRole("candidate");
  const parsed = getOrCreateSkillSchema.safeParse({ name });
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const cleanName = parsed.data.name;
  const slug = slugify(cleanName);

  const [existing] = await db
    .select({ id: skills.id, name: skills.name })
    .from(skills)
    .where(eq(skills.slug, slug));
  if (existing) return { success: true, data: existing };

  const [created] = await db
    .insert(skills)
    .values({ name: cleanName, slug })
    .returning({ id: skills.id, name: skills.name });
  return { success: true, data: created };
}

export async function setSkills(
  input: SetSkillsInput,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireRole("candidate");
  const parsed = setSkillsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  const next = new Set(parsed.data.skillIds);
  const current = await db
    .select({ skillId: candidateSkills.skillId })
    .from(candidateSkills)
    .where(eq(candidateSkills.candidateId, user.id));
  const currentSet = new Set(current.map((r) => r.skillId));

  const toAdd = [...next].filter((id) => !currentSet.has(id));
  const toRemove = [...currentSet].filter((id) => !next.has(id));

  if (toRemove.length > 0) {
    await db
      .delete(candidateSkills)
      .where(
        and(
          eq(candidateSkills.candidateId, user.id),
          inArray(candidateSkills.skillId, toRemove),
        ),
      );
  }
  if (toAdd.length > 0) {
    await db
      .insert(candidateSkills)
      .values(toAdd.map((skillId) => ({ candidateId: user.id, skillId })));
  }

  revalidatePath("/c/profile");
  return { success: true, data: { ok: true } };
}
