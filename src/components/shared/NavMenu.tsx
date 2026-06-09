"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Home,
  Search,
  LayoutGrid,
  User,
  LogOut,
  Star,
  Loader2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    { href: "/c/profile", label: "Mon profil", icon: User },
    { href: "/c/upgrade", label: "Passer à Premium", icon: Star },
  ],
  employer: [
    { href: "/e/home", label: "Accueil", icon: Home },
    { href: "/e/search", label: "Rechercher des candidats", icon: Search },
    { href: "/e/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/e/profile", label: "Mon profil", icon: User },
  ],
};

export function NavMenu({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const items = ITEMS[role];

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
        className="p-1.5 -ml-1.5 text-jc-text-primary"
      >
        <Menu className="w-5 h-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-72 p-0">
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-black/5">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-bold text-jc-text-primary">
                JobConnect
              </SheetTitle>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="p-1 text-jc-text-secondary hover:text-jc-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </SheetHeader>

          <nav className="flex-1 py-3">
            {items.map(({ href, label, icon: Icon }) => (
              <button
                key={href}
                type="button"
                onClick={() => navigate(href)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-jc-text-primary hover:bg-jc-light-green hover:text-jc-primary-green transition-colors text-left"
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div className="border-t border-black/5 p-4">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-2 py-3 text-sm font-medium text-jc-warning hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
              {isPending ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
