"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, Search, LayoutGrid, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "candidate" | "employer";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ITEMS: Record<Role, NavItem[]> = {
  candidate: [
    { href: "/c/home", label: "Home", icon: Home },
    { href: "/c/jobs", label: "Recherche", icon: Search },
    { href: "/c/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/c/profile", label: "Profil", icon: User },
  ],
  employer: [
    { href: "/e/home", label: "Home", icon: Home },
    { href: "/e/search", label: "Recherche", icon: Search },
    { href: "/e/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/e/profile", label: "Profil", icon: User },
  ],
};

export function BottomNav({ role }: { role: Role }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  const items = ITEMS[role];

  const navigate = (href: string) => {
    if (pathname === href || pathname.startsWith(`${href}/`)) return;
    setLoadingHref(href);
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-black/5 pb-[env(safe-area-inset-bottom)]">
      <ul className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const loading = loadingHref === href && isPending;
          return (
            <li key={href}>
              <button
                type="button"
                aria-label={label}
                aria-current={active ? "page" : undefined}
                onClick={() => navigate(href)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-full px-4 py-1.5 transition-colors min-w-[64px]",
                  active
                    ? "bg-jc-primary-green text-white"
                    : "text-jc-text-secondary hover:text-jc-text-primary",
                )}
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <Icon className="w-5 h-5" />
                }
                <span className="text-[11px] font-medium">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
