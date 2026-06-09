import "server-only";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, subscriptions } from "@/lib/db/schema";
import { createNotificationFor } from "@/features/notifications/actions";
import { SUBSCRIPTION_DAYS } from "./schemas";

/**
 * Idempotent application of a successful payment. Called from both:
 *   - the PVIT webhook handler when `status=SUCCESS`
 *   - the client polling fallback (`getPaymentStatus`) when the mock provider
 *     reports success after the simulated delay
 *
 * Locks: if the payment row is not in `pending`, we treat the operation as a
 * no-op and return the existing subscription. This is the §1 idempotence
 * requirement of CLAUDE.md applied at the DB layer.
 */
export async function applyPaymentSuccess(input: {
  merchantReference: string;
  transactionId?: string | null;
  raw?: unknown;
}): Promise<
  | { ok: true; alreadyApplied: boolean; subscriptionId: string | null }
  | { ok: false; reason: string }
> {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.pvitMerchantReference, input.merchantReference))
    .limit(1);

  if (!payment) return { ok: false, reason: "PAYMENT_NOT_FOUND" };

  if (payment.status === "success") {
    const [existing] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.paymentId, payment.id))
      .limit(1);
    return {
      ok: true,
      alreadyApplied: true,
      subscriptionId: existing?.id ?? null,
    };
  }

  if (payment.status === "failed") {
    return { ok: false, reason: "PAYMENT_ALREADY_FAILED" };
  }

  // Compute new expiration: extend any currently-active subscription on the
  // same plan, otherwise start from now.
  const now = new Date();
  const [active] = await db
    .select({ id: subscriptions.id, expiresAt: subscriptions.expiresAt })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, payment.userId),
        eq(subscriptions.plan, payment.plan),
        eq(subscriptions.status, "active"),
        gte(subscriptions.expiresAt, now),
      ),
    )
    .limit(1);

  const baseDate =
    active && new Date(active.expiresAt) > now ? new Date(active.expiresAt) : now;
  const expiresAt = new Date(
    baseDate.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000,
  );

  await db
    .update(payments)
    .set({
      status: "success",
      pvitTransactionId: input.transactionId ?? payment.pvitTransactionId,
      rawResponse: (input.raw ?? null) as object | null,
      completedAt: now,
    })
    .where(eq(payments.id, payment.id));

  let subscriptionId: string;
  if (active) {
    await db
      .update(subscriptions)
      .set({ expiresAt, paymentId: payment.id })
      .where(eq(subscriptions.id, active.id));
    subscriptionId = active.id;
  } else {
    const [row] = await db
      .insert(subscriptions)
      .values({
        userId: payment.userId,
        plan: payment.plan,
        status: "active",
        paymentId: payment.id,
        startedAt: now,
        expiresAt,
      })
      .returning({ id: subscriptions.id });
    subscriptionId = row.id;
  }

  await createNotificationFor({
    userId: payment.userId,
    type: "payment_success",
    title: "Paiement confirmé",
    message: `Votre abonnement est actif jusqu'au ${expiresAt.toLocaleDateString("fr-FR")}.`,
    metadata: {
      paymentId: payment.id,
      plan: payment.plan,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return { ok: true, alreadyApplied: false, subscriptionId };
}

/**
 * Mark a pending payment as failed. Idempotent — calling on an already-failed
 * or already-succeeded payment is a no-op.
 */
export async function applyPaymentFailure(input: {
  merchantReference: string;
  reason?: string;
  raw?: unknown;
}): Promise<{ ok: true; alreadyApplied: boolean } | { ok: false; reason: string }> {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.pvitMerchantReference, input.merchantReference))
    .limit(1);

  if (!payment) return { ok: false, reason: "PAYMENT_NOT_FOUND" };
  if (payment.status === "failed") return { ok: true, alreadyApplied: true };
  if (payment.status === "success")
    return { ok: false, reason: "PAYMENT_ALREADY_SUCCESS" };

  await db
    .update(payments)
    .set({
      status: "failed",
      rawResponse: (input.raw ?? null) as object | null,
      completedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  await createNotificationFor({
    userId: payment.userId,
    type: "payment_failed",
    title: "Paiement échoué",
    message: input.reason
      ? `Votre paiement a échoué : ${input.reason}`
      : "Votre paiement a échoué. Réessayez ou contactez le support.",
    metadata: { paymentId: payment.id, plan: payment.plan },
  });

  return { ok: true, alreadyApplied: false };
}
