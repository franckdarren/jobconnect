"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/features/auth/actions";

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/jobs", label: "Offres", icon: Briefcase },
  { href: "/admin/subscriptions", label: "Abonnements", icon: CreditCard },
  { href: "/admin/payments", label: "Paiements", icon: Receipt },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

function LinkSpinner() {
  const { pending } = useLinkStatus();
  return pending ? (
    <Loader2 className="w-4 h-4 animate-spin ml-auto shrink-0" aria-hidden />
  ) : null;
}

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-jc-light-green text-jc-primary-green"
                : "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-jc-text-secondary hover:bg-jc-background hover:text-jc-text-primary"
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
            <LinkSpinner />
          </Link>
        );
      })}
    </nav>
  );
}

export function LogoutButton() {
  const [isLoggingOut, startLogout] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startLogout(() => logout())}
      disabled={isLoggingOut}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-jc-warning hover:bg-jc-warning/5 transition-colors disabled:opacity-50"
    >
      {isLoggingOut ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <LogOut className="w-4 h-4 shrink-0" aria-hidden />
      )}
      {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}
