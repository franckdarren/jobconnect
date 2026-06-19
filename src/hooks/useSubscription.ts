"use client";

import { useAppData } from "@/components/shared/AppDataProvider";
import type { SubscriptionPlan } from "@/types";

export type ActiveSubscription = {
  plan: SubscriptionPlan;
  status: string;
  expiresAt: string;
} | null;

/**
 * Client-side view of the user's current active subscription. Indicative —
 * server actions re-validate on every mutation (see CLAUDE.md §1).
 */
export function useSubscription() {
  const { data, loading } = useAppData();

  if (!data || !("authenticated" in data) || !data.authenticated) {
    return { subscription: null, loading };
  }

  return { subscription: data.subscription as ActiveSubscription, loading };
}
