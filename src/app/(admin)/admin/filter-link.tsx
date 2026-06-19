"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function PendingSpinner({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return pending ? (
    <Loader2 className={cn("animate-spin shrink-0", className)} aria-hidden />
  ) : null;
}

/** Pill de filtre (onglet) avec spinner pendant la navigation. */
export function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-full px-4 h-9 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
        active
          ? "bg-jc-primary-dark text-white"
          : "bg-white border border-black/[0.06] text-jc-text-secondary",
      )}
    >
      {children}
      <PendingSpinner className="w-3.5 h-3.5" />
    </Link>
  );
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
