"use server";

import { and, eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import type { ActionResult, Role } from "@/types";

export type NotificationType =
  | "profile_viewed"
  | "application_sent"
  | "subscription_expired"
  | "quota_reached"
  | "payment_success"
  | "payment_failed";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

/**
 * Server-only utility — called from other features. Bypasses `requireAuth`
 * so it can fire on behalf of any user during background actions (e.g. when a
 * candidate applies, the employer gets a notification).
 */
export async function createNotificationFor(
  input: CreateNotificationInput,
): Promise<void> {
  await db.insert(notifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    metadata: input.metadata ?? {},
  });
}

export async function markAsRead(
  id: string,
): Promise<ActionResult<{ ok: true }>> {
  const user = await requireAuth();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.id, id), eq(notifications.userId, user.id)),
    );
  return { success: true, data: { ok: true } };
}

export async function markAllAsRead(): Promise<ActionResult<{ ok: true }>> {
  const user = await requireAuth();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, user.id));
  return { success: true, data: { ok: true } };
}

export async function getUnreadCount(): Promise<number> {
  const user = await requireAuth();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, user.id),
        eq(notifications.isRead, false),
      ),
    );
  return row?.count ?? 0;
}

// Type-checked helper to avoid stringly-typed roles at call sites
export type _RoleSanity = Role;
