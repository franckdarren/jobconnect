import type { Operator, SubscriptionPlan } from "@/types";

export type CreatePaymentParams = {
  merchantReferenceId: string;
  amount: number; // FCFA, integer
  operator: Operator;
  phone: string;
  plan: SubscriptionPlan;
  description?: string;
};

export type PaymentInitResult =
  | { status: "PENDING"; transactionId: string | null }
  | { status: "REJECTED"; reason: string };

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type CheckStatusResult = {
  status: PaymentStatus;
  transactionId: string | null;
  raw?: unknown;
};

export type KycResult = {
  ok: boolean;
  name?: string;
};

/**
 * Abstraction over the payment gateway so we can swap PVIT for a mock in dev
 * and in tests. See `src/services/payment/index.ts` for the factory.
 */
export interface PaymentProvider {
  /** Initiate a payment. Returns synchronously with PENDING. */
  createPayment(params: CreatePaymentParams): Promise<PaymentInitResult>;

  /** Poll the gateway for the latest status — used as fallback to the webhook. */
  checkStatus(merchantReferenceId: string): Promise<CheckStatusResult>;

  /** KYC check on the operator side (PVIT exposes this). Mock returns ok=true. */
  verifyKyc(phone: string, operator: Operator): Promise<KycResult>;
}
