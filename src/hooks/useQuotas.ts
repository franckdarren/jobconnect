"use client";

import { useAppData } from "@/components/shared/AppDataProvider";
import type { QuotaCheck, SubscriptionPlan } from "@/types";

export type QuotasResponse =
  | {
      role: "candidate";
      plan: SubscriptionPlan;
      applications: QuotaCheck;
    }
  | {
      role: "employer";
      plan: SubscriptionPlan;
      profileViews: QuotaCheck;
      whatsapp: QuotaCheck;
      activeJobs: QuotaCheck;
    }
  | { role: "admin" };

/**
 * Indicative-only view of the user's quotas. NEVER use for authorization —
 * the Server Actions re-check on every mutation.
 */
export function useQuotas() {
  const { data, loading } = useAppData();

  if (!data || !("authenticated" in data) || !data.authenticated) {
    return { quotas: null, loading };
  }

  if (data.role === "candidate") {
    const quotas: QuotasResponse = {
      role: "candidate",
      plan: data.plan,
      applications: data.quotas.applications,
    };
    return { quotas, loading };
  }

  if (data.role === "employer") {
    const quotas: QuotasResponse = {
      role: "employer",
      plan: data.plan,
      profileViews: data.quotas.profileViews,
      whatsapp: data.quotas.whatsapp,
      activeJobs: data.quotas.activeJobs,
    };
    return { quotas, loading };
  }

  return { quotas: { role: "admin" } as QuotasResponse, loading };
}
