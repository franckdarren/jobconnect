import { z } from "zod";

const phoneRegex = /^(\+241|0)\d{7,9}$/;

export const PAID_PLANS = [
  "candidate_premium",
  "employer_pro",
] as const;

export const operatorEnum = z.enum(["airtel_money", "moov_money"]);

export const initiatePaymentSchema = z.object({
  plan: z.enum(PAID_PLANS),
  operator: operatorEnum,
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(z.string().regex(phoneRegex, "Format invalide")),
});
export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

export const PLAN_AMOUNTS: Record<(typeof PAID_PLANS)[number], number> = {
  candidate_premium: 2_000,
  employer_pro: 15_000,
};

export const PLAN_LABELS: Record<(typeof PAID_PLANS)[number], string> = {
  candidate_premium: "Candidat Premium",
  employer_pro: "Employeur Pro",
};

export const SUBSCRIPTION_DAYS = 30;
