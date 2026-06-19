"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterTab = { value: string; label: string; href: string };

/**
 * Groupe d'onglets de filtre avec :
 * - focus instantané : l'état actif bascule en optimiste dès le clic (useTransition),
 *   sans attendre la réponse serveur ;
 * - loader : spinner sur l'onglet sélectionné pendant la navigation.
 */
export function FilterTabs({
  tabs,
  active,
}: {
  tabs: FilterTab[];
  active: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  // Pendant la transition, on affiche l'onglet cliqué comme actif (optimiste).
  // Une fois la navigation terminée, `active` (issu de l'URL) reprend la main.
  const current = isPending && pendingValue !== null ? pendingValue : active;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => {
        const isActive = current === t.value;
        const isLoading = isPending && pendingValue === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              if (t.value === active) return;
              setPendingValue(t.value);
              startTransition(() => router.push(t.href));
            }}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 h-9 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
              isActive
                ? "bg-jc-primary-dark text-white"
                : "bg-white border border-black/[0.06] text-jc-text-secondary",
            )}
          >
            {t.label}
            {isLoading ? (
              <Loader2
                className="w-3.5 h-3.5 animate-spin shrink-0"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function PendingSpinner({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return pending ? (
    <Loader2 className={cn("animate-spin shrink-0", className)} aria-hidden />
  ) : null;
}

/** Lien de pagination avec spinner pendant la navigation. */
export function PagerLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full bg-jc-primary-dark text-white text-xs font-semibold px-4 py-1.5"
    >
      <PendingSpinner className="w-3 h-3" />
      {children}
    </Link>
  );
}
