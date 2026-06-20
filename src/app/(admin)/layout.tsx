import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { requireRole } from "@/lib/auth";
import { NavLinks, LogoutButton } from "./nav-links";
import { AdminThemeProvider, ThemeToggle } from "./theme";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");
  return (
    <AdminThemeProvider>
      <div className="admin-shell min-h-dvh bg-jc-background md:flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex sticky top-0 h-dvh w-60 shrink-0 flex-col bg-white border-r border-black/4 p-4">
          <div className="flex items-start justify-between mb-6">
            <Link href="/admin/dashboard" className="font-bold text-lg">
              241Job <span className="text-jc-text-muted">/ admin</span>
            </Link>
            <ThemeToggle />
          </div>
          <NavLinks />
          <div className="mt-auto pt-4 border-t border-black/4">
            <LogoutButton />
          </div>
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
              <SheetContent
                side="left"
                className="admin-shell w-64 p-4 flex flex-col"
              >
                <SheetHeader className="px-0 pt-0">
                  <SheetTitle className="text-left text-lg font-bold">
                    241Job{" "}
                    <span className="text-jc-text-muted font-normal">
                      / admin
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <NavLinks />
                </div>
                <div className="mt-auto pt-4 border-t border-black/4">
                  <LogoutButton />
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/admin/dashboard" className="font-bold text-base">
              241Job <span className="text-jc-text-muted">/ admin</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </AdminThemeProvider>
  );
}
