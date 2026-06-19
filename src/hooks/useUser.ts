"use client";

import { useAppData } from "@/components/shared/AppDataProvider";
import type { SubscriptionPlan } from "@/types";

export type ClientUser = {
  role: "candidate" | "employer" | "admin";
  plan: SubscriptionPlan | null;
} | null;

export function useUser() {
  const { data, loading } = useAppData();

  if (!data || !("authenticated" in data) || !data.authenticated) {
    return { user: null, loading };
  }

  const user: ClientUser = {
    role: data.role as "candidate" | "employer" | "admin",
    plan: "plan" in data ? data.plan : null,
  };

  return { user, loading };
}
