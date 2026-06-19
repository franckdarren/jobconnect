import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { Role } from "@/types";
import type { User } from "@/types/database";

// cache() déduplique les appels dans le même arbre de rendu (layout + page).
// Sans ça, middleware + layout + page appellent chacun getUser() = 3 allers-
// retours réseau vers Supabase Auth par navigation.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const [row] = await db.select().from(users).where(eq(users.id, authUser.id));
  return row ?? null;
});

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.isActive) {
    redirect("/login?suspended=1");
  }
  return user;
}

export async function requireRole(role: Role): Promise<User> {
  const user = await requireAuth();
  if (user.role !== role) {
    redirect("/");
  }
  return user;
}
