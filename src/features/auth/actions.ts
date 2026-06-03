"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { candidateProfiles, employerProfiles, users } from "@/lib/db/schema";
import type { ActionResult, Role } from "@/types";
import {
  loginSchema,
  registerCandidateSchema,
  registerEmployerSchema,
  type LoginInput,
  type RegisterCandidateInput,
  type RegisterEmployerInput,
} from "./schemas";

function formatZodError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Formulaire invalide";
}

async function ensureUniquePhone(phone: string): Promise<boolean> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, phone));
  return !row;
}

export async function registerCandidate(
  input: RegisterCandidateInput,
): Promise<ActionResult<{ userId: string }>> {
  const parsed = registerCandidateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const data = parsed.data;

  if (!(await ensureUniquePhone(data.phone))) {
    return {
      success: false,
      error: "Ce numéro est déjà utilisé",
      code: "phone_taken",
    };
  }

  const supabase = await createClient();
  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { role: "candidate", phone: data.phone },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/home`,
    },
  });

  if (signUpError || !signUp.user) {
    return {
      success: false,
      error: signUpError?.message ?? "Inscription impossible",
    };
  }

  try {
    await db.insert(users).values({
      id: signUp.user.id,
      phone: data.phone,
      email: data.email,
      role: "candidate",
    });
    await db.insert(candidateProfiles).values({
      userId: signUp.user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      city: data.city,
      whatsappPhone: data.phone,
      profession: data.profession || null,
    });
  } catch (err) {
    // Roll back the auth user if profile creation fails so user can retry.
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(signUp.user.id);
    } catch {
      // best-effort cleanup
    }
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du profil",
    };
  }

  return { success: true, data: { userId: signUp.user.id } };
}

export async function registerEmployer(
  input: RegisterEmployerInput,
): Promise<ActionResult<{ userId: string }>> {
  const parsed = registerEmployerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const data = parsed.data;

  if (!(await ensureUniquePhone(data.phone))) {
    return {
      success: false,
      error: "Ce numéro est déjà utilisé",
      code: "phone_taken",
    };
  }

  const supabase = await createClient();
  const { data: signUp, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { role: "employer", phone: data.phone },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/home`,
    },
  });

  if (signUpError || !signUp.user) {
    return {
      success: false,
      error: signUpError?.message ?? "Inscription impossible",
    };
  }

  try {
    await db.insert(users).values({
      id: signUp.user.id,
      phone: data.phone,
      email: data.email,
      role: "employer",
    });
    await db.insert(employerProfiles).values({
      userId: signUp.user.id,
      companyName: data.companyName,
      city: data.city,
      whatsappPhone: data.phone,
    });
  } catch (err) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(signUp.user.id);
    } catch {
      // best-effort cleanup
    }
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du profil",
    };
  }

  return { success: true, data: { userId: signUp.user.id } };
}

export async function login(
  input: LoginInput,
): Promise<ActionResult<{ role: Role }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const { phone, password } = parsed.data;

  const [row] = await db
    .select({ email: users.email, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.phone, phone));

  if (!row) {
    return {
      success: false,
      error: "Aucun compte avec ce numéro",
      code: "phone_not_found",
    };
  }
  if (!row.isActive) {
    return {
      success: false,
      error: "Compte suspendu, contactez le support",
      code: "suspended",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: row.email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: "Mot de passe incorrect",
      code: "invalid_credentials",
    };
  }

  return { success: true, data: { role: row.role } };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
