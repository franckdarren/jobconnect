"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "candidate" | "employer";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ITEMS: Record<Role, NavItem[]> = {
  candidate: [
    { href: "/home", label: "Home", icon: Home },
    { href: "/jobs", label: "Recherche", icon: Search },
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/profile", label: "Profil", icon: User },
  ],
  employer: [
    { href: "/home", label: "Home", icon: Home },
    { href: "/search", label: "Recherche", icon: Search },
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/profile", label: "Profil", icon: User },
  ],
};

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = ITEMS[role];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-black/5 pb-[env(safe-area-inset-bottom)]">
      <ul className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-full px-4 py-1.5 transition-colors min-w-[64px]",
                  active
                    ? "bg-jc-primary-green text-white"
                    : "text-jc-text-secondary hover:text-jc-text-primary",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
