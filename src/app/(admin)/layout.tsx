import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  Receipt,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { requireRole } from "@/lib/auth";

const ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/jobs", label: "Offres", icon: Briefcase },
  { href: "/admin/subscriptions", label: "Abonnements", icon: CreditCard },
  { href: "/admin/payments", label: "Paiements", icon: Receipt },
];

function NavLinks() {
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-jc-text-secondary hover:bg-jc-background hover:text-jc-text-primary"
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");
  return (
    <div className="min-h-dvh bg-jc-background md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-black/4 p-4">
        <Link href="/admin/dashboard" className="font-bold text-lg mb-6">
          241Job <span className="text-jc-text-muted">/ admin</span>
        </Link>
        <NavLinks />
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-black/4">
        <div className="flex items-center justify-between px-4 h-14">
          <Sheet>
            <SheetTrigger
              aria-label="Ouvrir le menu"
              className="p-1.5 -ml-1.5 text-jc-text-primary"
            >
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <SheetHeader className="px-0 pt-0">
                <SheetTitle className="text-left text-lg font-bold">
                  241Job{" "}
                  <span className="text-jc-text-muted font-normal">/ admin</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/admin/dashboard" className="font-bold text-base">
            241Job <span className="text-jc-text-muted">/ admin</span>
          </Link>
          <span className="w-7" />
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  );
}
