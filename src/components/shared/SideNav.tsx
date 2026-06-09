"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Search,
  LayoutGrid,
  User,
  Star,
  Bell,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/features/auth/actions";

type Role = "candidate" | "employer";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ITEMS: Record<Role, NavItem[]> = {
  candidate: [
    { href: "/c/home", label: "Accueil", icon: Home },
    { href: "/c/jobs", label: "Offres d'emploi", icon: Search },
    { href: "/c/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/c/notifications", label: "Notifications", icon: Bell },
    { href: "/c/profile", label: "Mon profil", icon: User },
    { href: "/c/upgrade", label: "Passer Premium", icon: Star },
  ],
  employer: [
    { href: "/e/home", label: "Accueil", icon: Home },
    { href: "/e/search", label: "Rechercher", icon: Search },
    { href: "/e/jobs", label: "Mes offres", icon: LayoutGrid },
    { href: "/e/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/e/notifications", label: "Notifications", icon: Bell },
    { href: "/e/profile", label: "Mon profil", icon: User },
    { href: "/e/upgrade", label: "Passer Pro", icon: Star },
  ],
};

export function SideNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isNavPending, startNavTransition] = useTransition();
  const [isLogoutPending, startLogoutTransition] = useTransition();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  const items = ITEMS[role];
  const homeHref = role === "candidate" ? "/c/home" : "/e/home";

  const navigate = (href: string) => {
    if (pathname === href || pathname.startsWith(`${href}/`)) return;
    setLoadingHref(href);
    startNavTransition(() => {
      router.push(href);
    });
  };

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logout();
    });
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="hidden md:flex sticky top-0 h-dvh w-56 lg:w-64 shrink-0 flex-col bg-white border-r border-black/5">
      <div className="px-5 lg:px-6 pt-6 pb-4">
        <Link
          href={homeHref}
          className="font-bold text-xl text-jc-text-primary tracking-tight"
        >
          JobConnect
        </Link>
        <p className="text-[11px] text-jc-text-muted mt-0.5">
          {role === "candidate" ? "Espace candidat" : "Espace employeur"}
        </p>
      </div>

      <nav className="flex-1 px-3 lg:px-4 py-2 overflow-y-auto">
        <ul className="space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const loading = loadingHref === href && isNavPending;
            return (
              <li key={href}>
                <button
                  type="button"
                  onClick={() => navigate(href)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left",
                    active
                      ? "bg-jc-primary-green text-white"
                      : "text-jc-text-secondary hover:bg-jc-light-green hover:text-jc-primary-green",
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 shrink-0 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 shrink-0" />
                  )}
                  <span className="truncate">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-black/5 px-3 lg:px-4 py-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLogoutPending}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-jc-warning hover:bg-jc-warning/5 transition-colors disabled:opacity-50"
        >
          {isLogoutPending ? (
            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          ) : (
            <LogOut className="w-5 h-5 shrink-0" />
          )}
          <span className="truncate">
            {isLogoutPending ? "Déconnexion..." : "Se déconnecter"}
          </span>
        </button>
      </div>
    </aside>
  );
}
