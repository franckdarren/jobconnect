"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { employerProfiles } from "@/lib/db/schema";
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

  revalidatePath("/profile");
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

  revalidatePath("/profile");
  return { success: true, data: { url } };
}
