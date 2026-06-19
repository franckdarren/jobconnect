"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  candidateProfiles,
  employerProfiles,
  jobOffers,
  subscriptions,
  users,
} from "@/lib/db/schema";
import type { ActionResult } from "@/types";

const idSchema = z.string().uuid("Identifiant invalide");
const boostSchema = z.object({
  candidateId: z.string().uuid(),
  days: z.number().int().min(1).max(365),
});
const extendSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  days: z.number().int().min(1).max(365),
});

export async function suspendUser(
  userId: string,
): Promise<ActionResult<{ ok: true }>> {
  await requireRole("admin");
  const parsed = idSchema.safeParse(userId);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide" };
  }
  await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, parsed.data));
  revalidatePath("/admin/users");
  return { success: true, data: { ok: true } };
}

export async function activateUser(
  userId: string,
): Promise<ActionResult<{ ok: true }>> {
  await requireRole("admin");
  const parsed = idSchema.safeParse(userId);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide" };
  }
  await db
    .update(users)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(users.id, parsed.data));
  revalidatePath("/admin/users");
  return { success: true, data: { ok: true } };
}

export async function verifyEmployer(
  employerId: string,
): Promise<ActionResult<{ ok: true }>> {
  await requireRole("admin");
  const parsed = idSchema.safeParse(employerId);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide" };
  }
  await db
    .update(employerProfiles)
    .set({ isVerified: true, updatedAt: new Date() })
    .where(eq(employerProfiles.userId, parsed.data));
  revalidatePath("/admin/users");
  return { success: true, data: { ok: true } };
}

export async function unverifyEmployer(
  employerId: string,
): Promise<ActionResult<{ ok: true }>> {
  await requireRole("admin");
  const parsed = idSchema.safeParse(employerId);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide" };
  }
  await db
    .update(employerProfiles)
    .set({ isVerified: false, updatedAt: new Date() })
    .where(eq(employerProfiles.userId, parsed.data));
  revalidatePath("/admin/users");
  return { success: true, data: { ok: true } };
}

export async function deleteJobOffer(
  jobId: string,
): Promise<ActionResult<{ ok: true }>> {
  await requireRole("admin");
  const parsed = idSchema.safeParse(jobId);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide" };
  }
  await db.delete(jobOffers).where(eq(jobOffers.id, parsed.data));
  revalidatePath("/admin/jobs");
  return { success: true, data: { ok: true } };
}

export async function boostCandidate(input: {
  candidateId: string;
  days: number;
}): Promise<ActionResult<{ ok: true; until: Date }>> {
  await requireRole("admin");
  const parsed = boostSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Entrée invalide",
    };
  }
  const until = new Date(Date.now() + parsed.data.days * 24 * 60 * 60 * 1000);
  await db
    .update(candidateProfiles)
    .set({
      isBoosted: true,
      boostedUntil: until,
      updatedAt: new Date(),
    })
    .where(eq(candidateProfiles.userId, parsed.data.candidateId));
  revalidatePath("/admin/users");
  return { success: true, data: { ok: true, until } };
}

export async function unboostCandidate(
  candidateId: string,
): Promise<ActionResult<{ ok: true }>> {
  await requireRole("admin");
  const parsed = idSchema.safeParse(candidateId);
  if (!parsed.success) {
    return { success: false, error: "Identifiant invalide" };
  }
  await db
    .update(candidateProfiles)
    .set({ isBoosted: false, boostedUntil: null, updatedAt: new Date() })
    .where(eq(candidateProfiles.userId, parsed.data));
  revalidatePath("/admin/users");
  return { success: true, data: { ok: true } };
}

export async function extendSubscription(input: {
  subscriptionId: string;
  days: number;
}): Promise<ActionResult<{ ok: true; expiresAt: Date }>> {
  await requireRole("admin");
  const parsed = extendSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Entrée invalide",
    };
  }

  const [current] = await db
    .select({ expiresAt: subscriptions.expiresAt })
    .from(subscriptions)
    .where(eq(subscriptions.id, parsed.data.subscriptionId))
    .limit(1);
  if (!current) {
    return { success: false, error: "Abonnement introuvable" };
  }

  // Repart de la date d'expiration si encore valide, sinon de maintenant.
  const now = new Date();
  const base = current.expiresAt > now ? current.expiresAt : now;
  const expiresAt = new Date(
    base.getTime() + parsed.data.days * 24 * 60 * 60 * 1000,
  );

  await db
    .update(subscriptions)
    .set({ expiresAt, status: "active", cancelledAt: null })
    .where(eq(subscriptions.id, parsed.data.subscriptionId));
  revalidatePath("/admin/subscriptions");
  return { success: true, data: { ok: true, expiresAt } };
}
