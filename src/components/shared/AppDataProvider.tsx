"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { QuotaCheck, SubscriptionPlan } from "@/types";

export type AppData =
  | {
      authenticated: true;
      role: "candidate";
      plan: SubscriptionPlan;
      quotas: { applications: QuotaCheck };
      subscription: { plan: SubscriptionPlan; status: string; expiresAt: string } | null;
    }
  | {
      authenticated: true;
      role: "employer";
      plan: SubscriptionPlan;
      quotas: { profileViews: QuotaCheck; whatsapp: QuotaCheck; activeJobs: QuotaCheck };
      subscription: { plan: SubscriptionPlan; status: string; expiresAt: string } | null;
    }
  | { authenticated: true; role: "admin"; plan: null; quotas: null; subscription: null }
  | { authenticated: false }
  | null;

const AppDataContext = createContext<{ data: AppData; loading: boolean }>({
  data: null,
  loading: true,
});

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/app-context", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { authenticated: false }))
      .then((json: AppData) => {
        if (cancelled) return;
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setData({ authenticated: false });
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <AppDataContext.Provider value={{ data, loading }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
