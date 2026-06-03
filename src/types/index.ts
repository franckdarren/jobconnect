export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type Role = "candidate" | "employer" | "admin";

export type SubscriptionPlan =
  | "candidate_free"
  | "candidate_premium"
  | "employer_free"
  | "employer_pro";

export type Operator = "airtel_money" | "moov_money";

export type QuotaCheck = {
  allowed: boolean;
  remaining: number;
  limit: number;
};
