"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { candidateProfiles, employerProfiles, users } from "@/lib/db/schema";
import type { ActionResult, Role } from "@/types";
import {
  changePasswordSchema,
  loginSchema,
  registerCandidateSchema,
  registerEmployerSchema,
  type ChangePasswordInput,
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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
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

function homeForRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "employer":
      return "/e/home";
    default:
      return "/c/home";
  }
}

/**
 * Connexion. En cas de succès, redirige **côté serveur** : la réponse de
 * redirection embarque les cookies de session fraîchement posés, donc la
 * requête de navigation suivante porte déjà la session (pas de course
 * client/serveur, pas besoin de recharger la page).
 *
 * `redirectTo` : destination explicite (param `?redirect=`), validée pour
 * n'accepter qu'un chemin interne.
 */
export async function login(
  input: LoginInput,
  redirectTo?: string,
): Promise<ActionResult<never>> {
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

  // Only honour internal paths to avoid open-redirect.
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : null;

  redirect(safeRedirect ?? homeForRole(row.role));
}

/**
 * Changement de mot de passe de l'utilisateur connecté.
 *
 * 1. Vérifie le mot de passe actuel via `signInWithPassword` (Supabase ne
 *    propose pas de check direct) — protège contre un changement par une
 *    session laissée ouverte.
 * 2. Met à jour le mot de passe via `auth.updateUser`.
 *
 * Réutilisable par n'importe quel rôle (admin, candidat, employeur) : l'id et
 * l'email viennent toujours de la session courante, jamais du client.
 */
export async function changePassword(
  input: ChangePasswordInput,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireAuth();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }
  const { currentPassword, newPassword } = parsed.data;

  const supabase = await createClient();

  // Re-vérifie le mot de passe actuel (réinitialise la session du même user).
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) {
    return {
      success: false,
      error: "Mot de passe actuel incorrect",
      code: "invalid_current_password",
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    return {
      success: false,
      error: updateError.message ?? "Impossible de modifier le mot de passe",
    };
  }

  return { success: true, data: { ok: true } };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Buckets where uploaded files are keyed by `${userId}/...`. Cleaned up
// best-effort when an account is deleted so no orphaned files remain.
const USER_STORAGE_BUCKETS = [
  "avatars",
  "cvs",
  "company-logos",
  "job-images",
] as const;

async function removeUserStorage(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<void> {
  for (const bucket of USER_STORAGE_BUCKETS) {
    try {
      const { data: files } = await admin.storage.from(bucket).list(userId);
      if (files && files.length > 0) {
        await admin.storage
          .from(bucket)
          .remove(files.map((f) => `${userId}/${f.name}`));
      }
    } catch {
      // best-effort cleanup — never block account deletion on storage
    }
  }
}

/**
 * Suppression définitive du compte de l'utilisateur connecté.
 *
 * Ordre des opérations :
 * 1. Nettoyage best-effort des fichiers Storage (avatars, CV, logos, images).
 * 2. Suppression de la ligne `users` → cascade sur tous les profils, offres,
 *    candidatures, abonnements, paiements, notifications (FK onDelete cascade).
 * 3. Suppression de l'utilisateur Supabase Auth (service role).
 * 4. Déconnexion de la session courante.
 *
 * L'utilisateur ne peut supprimer que SON propre compte (id pris de la session).
 */
export async function deleteAccount(): Promise<ActionResult<{ ok: true }>> {
  const user = await requireAuth();

  const admin = createAdminClient();

  await removeUserStorage(admin, user.id);

  try {
    await db.delete(users).where(eq(users.id, user.id));
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression des données",
    };
  }

  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) {
    return { success: false, error: authError.message };
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  return { success: true, data: { ok: true } };
}
