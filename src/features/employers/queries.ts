import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { employerProfiles, users } from "@/lib/db/schema";

export async function getEmployerProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(employerProfiles)
    .where(eq(employerProfiles.userId, userId));
  if (!profile) return null;

  const [u] = await db
    .select({ phone: users.phone, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return { profile, user: u ?? null };
}
