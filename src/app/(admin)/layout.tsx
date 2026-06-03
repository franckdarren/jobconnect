import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  Receipt,
} from "lucide-react";

const ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/jobs", label: "Offres", icon: Briefcase },
  { href: "/admin/subscriptions", label: "Abonnements", icon: CreditCard },
  { href: "/admin/payments", label: "Paiements", icon: Receipt },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-jc-background flex">
      <aside className="hidden md:flex w-60 flex-col bg-white border-r border-black/[0.04] p-4">
        <Link href="/admin/dashboard" className="font-bold text-lg mb-6">
          JobConnect <span className="text-jc-text-muted">/ admin</span>
        </Link>
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
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
