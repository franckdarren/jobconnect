"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments, subscriptions } from "@/lib/db/schema";
import { getPaymentProvider } from "@/services/payment";
import type { ActionResult } from "@/types";
import { applyPaymentFailure, applyPaymentSuccess } from "./apply";
import {
  initiatePaymentSchema,
  PLAN_AMOUNTS,
  PLAN_LABELS,
  type InitiatePaymentInput,
} from "./schemas";

export type InitiatePaymentResult = {
  merchantReference: string;
  amount: number;
  status: "PENDING" | "REJECTED";
};

/**
 * Kick off a payment. Persists the `payments` row with a generated
 * `pvit_merchant_reference` (idempotence key) BEFORE calling the provider —
 * this guarantees a webhook arriving even before this function returns can
 * find the row.
 */
export async function initiatePayment(
  input: InitiatePaymentInput,
): Promise<ActionResult<InitiatePaymentResult>> {
  const user = await requireAuth();

  const parsed = initiatePaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Entrée invalide",
    };
  }
  const { plan, operator, phone } = parsed.data;

  // Plan/role consistency: candidates can only buy candidate plans, etc.
  if (plan === "candidate_premium" && user.role !== "candidate") {
    return { success: false, error: "Plan réservé aux candidats" };
  }
  if (plan === "employer_pro" && user.role !== "employer") {
    return { success: false, error: "Plan réservé aux employeurs" };
  }

  const amount = PLAN_AMOUNTS[plan];
  const merchantReference = `jc_${nanoid(20)}`;

  const [row] = await db
    .insert(payments)
    .values({
      userId: user.id,
      plan,
      amount,
      provider: "pvit",
      operator,
      phone,
      status: "pending",
      pvitMerchantReference: merchantReference,
    })
    .returning({ id: payments.id });

  const provider = getPaymentProvider();
  const init = await provider.createPayment({
    merchantReferenceId: merchantReference,
    amount,
    operator,
    phone,
    plan,
    description: `241Job — ${PLAN_LABELS[plan]}`,
  });

  if (init.status === "REJECTED") {
    await db
      .update(payments)
      .set({ status: "failed", completedAt: new Date() })
      .where(eq(payments.id, row.id));
    return {
      success: false,
      error: init.reason || "Paiement refusé par l'opérateur",
      code: "REJECTED",
    };
  }

  if (init.transactionId) {
    await db
      .update(payments)
      .set({ pvitTransactionId: init.transactionId })
      .where(eq(payments.id, row.id));
  }

  return {
    success: true,
    data: { merchantReference, amount, status: "PENDING" },
  };
}

export type GetPaymentStatusResult = {
  status: "pending" | "success" | "failed";
  plan: "candidate_premium" | "employer_pro";
  amount: number;
  expiresAt: string | null;
};

/**
 * Polled by the client during the payment modal. Lazily applies the success
 * branch if the provider reports SUCCESS (mock simulates this after 5 s, real
 * PVIT is normally handled by the webhook — this is the fallback path).
 */
export async function getPaymentStatus(
  merchantReference: string,
): Promise<ActionResult<GetPaymentStatusResult>> {
  const user = await requireAuth();

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.pvitMerchantReference, merchantReference))
    .limit(1);

  if (!payment) return { success: false, error: "Paiement introuvable" };
  if (payment.userId !== user.id) {
    return { success: false, error: "Accès refusé", code: "FORBIDDEN" };
  }

  if (payment.status === "pending") {
    const provider = getPaymentProvider();
    const check = await provider.checkStatus(merchantReference);
    if (check.status === "SUCCESS") {
      await applyPaymentSuccess({
        merchantReference,
        transactionId: check.transactionId,
        raw: check.raw ?? null,
      });
    } else if (check.status === "FAILED") {
      await applyPaymentFailure({
        merchantReference,
        raw: check.raw ?? null,
      });
    }
  }

  // Re-read after the lazy apply.
  const [latest] = await db
    .select()
    .from(payments)
    .where(eq(payments.pvitMerchantReference, merchantReference))
    .limit(1);

  let expiresAt: string | null = null;
  if (latest.status === "success") {
    const [sub] = await db
      .select({ expiresAt: subscriptions.expiresAt })
      .from(subscriptions)
      .where(eq(subscriptions.paymentId, latest.id))
      .limit(1);
    expiresAt = sub?.expiresAt ? new Date(sub.expiresAt).toISOString() : null;
  }

  return {
    success: true,
    data: {
      status: latest.status,
      plan: latest.plan as "candidate_premium" | "employer_pro",
      amount: latest.amount,
      expiresAt,
    },
  };
}
