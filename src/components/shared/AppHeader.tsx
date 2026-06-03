import Link from "next/link";
import { Menu, UserCircle2 } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-black/[0.04]">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
        <button
          type="button"
          aria-label="Ouvrir le menu"
          className="p-1.5 -ml-1.5 text-jc-text-primary"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link
          href="/home"
          className="font-bold text-lg text-jc-text-primary tracking-tight"
        >
          JobConnect
        </Link>
        <Link
          href="/profile"
          aria-label="Profil"
          className="p-1 -mr-1 text-jc-text-primary"
        >
          <UserCircle2 className="w-6 h-6" />
        </Link>
      </div>
    </header>
  );
}
