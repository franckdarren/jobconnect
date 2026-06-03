import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
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
    // ENV not ready yet — fall through to the static splash so the dev
    // server still renders something useful before Supabase is configured.
  }

  return (
    <div className="min-h-screen bg-jc-primary-dark text-white flex flex-col items-center justify-between p-8">
      <div className="flex-1" />
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
          <Briefcase className="w-9 h-9 text-white/70" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-bold">J</span>
          <span className="w-10 h-0.5 bg-jc-accent-green rounded-full" />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-end gap-3 pb-8">
        <p className="text-white/70 font-semibold">L&apos;emploi direct au Gabon</p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-jc-accent-green" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
        </div>
        <a
          href="/login"
          className="mt-6 text-xs font-medium text-white/60 underline-offset-4 hover:underline"
        >
          Continuer
        </a>
      </div>
    </div>
  );
}
