import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function SplashPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const [u] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, authUser.id));

      if (u?.role === "admin") redirect("/admin/dashboard");
      if (u?.role === "employer") redirect("/e/home");
      if (u) redirect("/c/home");
    }
  } catch {
    // ENV not ready yet — fall through to the static splash.
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white flex flex-col items-center justify-between p-8">
      <div className="flex-1" />

      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center">
            <Briefcase className="w-10 h-10 text-white/80" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#2E8B57] flex items-center justify-center">
            <span className="text-white text-xs font-bold">J</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold tracking-wide">JobConnect</span>
          <span className="w-12 h-0.5 bg-[#2E8B57] rounded-full" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-end gap-6 pb-12 w-full max-w-xs">
        <p className="text-white/60 text-sm font-medium text-center">
          L&apos;emploi direct au Gabon
        </p>

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/login"
            className="w-full py-3.5 rounded-xl bg-[#1E6B3C] text-white text-sm font-semibold text-center active:scale-95 transition-transform"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="w-full py-3.5 rounded-xl border border-white/20 text-white text-sm font-semibold text-center active:scale-95 transition-transform"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
