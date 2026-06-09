"use client";

import { useEffect, useState } from "react";
import type { SubscriptionPlan } from "@/types";

export type ActiveSubscription = {
  plan: SubscriptionPlan;
  status: "active" | "expired" | "cancelled";
  startedAt: string;
  expiresAt: string;
} | null;

type Response = { subscription: ActiveSubscription };

/**
 * Client-side view of the user's current active subscription. Indicative —
 * server actions re-validate on every mutation (see CLAUDE.md §1).
 */
export function useSubscription() {
  const [data, setData] = useState<ActiveSubscription>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { subscription: null }))
      .then((json: Response) => {
        if (cancelled) return;
        setData(json.subscription);
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

  return { subscription: data, loading };
}
