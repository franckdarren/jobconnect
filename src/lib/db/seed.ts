import { eq } from "drizzle-orm";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Idempotent admin seed. Creates a Supabase auth user + a `users` row with
 * `role='admin'` from env vars. Re-running is safe — it returns early if the
 * admin already exists.
 *
 * Required env:
 *   ADMIN_PHONE
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 *
 * Run with:  npm run db:seed
 */
async function seedAdmin() {
  const phone = process.env.ADMIN_PHONE;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!phone || !email || !password) {
    throw new Error(
      "ADMIN_PHONE / ADMIN_EMAIL / ADMIN_PASSWORD must be set to seed the admin.",
    );
  }

  // Skip if a user row already exists for this phone or email.
  const [existing] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    if (existing.role !== "admin") {
      await db
        .update(users)
        .set({ role: "admin", isActive: true })
        .where(eq(users.id, existing.id));
      console.log(`[seed] promoted existing user ${email} to admin.`);
    } else {
      console.log(`[seed] admin ${email} already exists, nothing to do.`);
    }
    return;
  }

  const supabase = createAdminClient();
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    phone,
  });

  if (error || !created.user) {
    throw new Error(
      `Failed to create Supabase admin user: ${error?.message ?? "unknown"}`,
    );
  }

  await db.insert(users).values({
    id: created.user.id,
    phone,
    email,
    role: "admin",
    isActive: true,
  });

  console.log(`[seed] admin ${email} created (id=${created.user.id}).`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
