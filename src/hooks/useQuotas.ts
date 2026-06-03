"use client";

import { useEffect, useState } from "react";
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
  const [data, setData] = useState<QuotasResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/quotas", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: QuotasResponse | null) => {
        if (cancelled) return;
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { quotas: data, loading };
}
