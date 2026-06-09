import "server-only";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, subscriptions } from "@/lib/db/schema";

export async function getActiveSubscription(userId: string) {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
        gte(subscriptions.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(subscriptions.expiresAt))
    .limit(1);
  return row ?? null;
}

export async function listOwnPayments(userId: string, limit = 20) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}
