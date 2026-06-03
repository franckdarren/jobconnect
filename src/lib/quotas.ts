import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  jobOffers,
  profileViews,
  subscriptions,
  whatsappContacts,
} from "@/lib/db/schema";
import type { QuotaCheck, SubscriptionPlan } from "@/types";

// =========================================================================
// Plan limits — single source of truth
// =========================================================================

export const PLAN_LIMITS = {
  candidate_free: {
    applicationsPerMonth: 3,
    visibleOffers: 10,
  },
  candidate_premium: {
    applicationsPerMonth: Infinity,
    visibleOffers: Infinity,
  },
  employer_free: {
    profileViewsPerDay: 3,
    whatsappContactsPerMonth: 1,
    activeJobs: 1,
  },
  employer_pro: {
    profileViewsPerDay: Infinity,
    whatsappContactsPerMonth: Infinity,
    activeJobs: 5,
  },
} as const;

// =========================================================================
// Helpers
// =========================================================================

function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toQuota(used: number, limit: number): QuotaCheck {
  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }
  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, remaining, limit };
}

/**
 * Resolve the user's active plan. Falls back to `candidate_free` / `employer_free`
 * if no active subscription exists.
 */
export async function getActivePlan(
  userId: string,
  fallback: SubscriptionPlan,
): Promise<SubscriptionPlan> {
  const [row] = await db
    .select({ plan: subscriptions.plan })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
        gte(subscriptions.expiresAt, new Date()),
      ),
    )
    .orderBy(sql`${subscriptions.expiresAt} desc`)
    .limit(1);

  return row?.plan ?? fallback;
}

// =========================================================================
// Candidate quotas
// =========================================================================

export async function checkCandidateApplicationQuota(
  userId: string,
): Promise<QuotaCheck> {
  const plan = await getActivePlan(userId, "candidate_free");
  const limit = PLAN_LIMITS[plan === "candidate_premium" ? plan : "candidate_free"]
    .applicationsPerMonth;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(applications)
    .where(
      and(
        eq(applications.candidateId, userId),
        gte(applications.createdAt, startOfMonth()),
      ),
    );

  return toQuota(count, limit);
}

// =========================================================================
// Employer quotas
// =========================================================================

export async function checkEmployerProfileViewQuota(
  userId: string,
): Promise<QuotaCheck> {
  const plan = await getActivePlan(userId, "employer_free");
  const limit = PLAN_LIMITS[plan === "employer_pro" ? plan : "employer_free"]
    .profileViewsPerDay;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profileViews)
    .where(
      and(
        eq(profileViews.employerId, userId),
        gte(profileViews.createdAt, startOfDay()),
      ),
    );

  return toQuota(count, limit);
}

export async function checkEmployerWhatsappQuota(
  userId: string,
): Promise<QuotaCheck> {
  const plan = await getActivePlan(userId, "employer_free");
  const limit = PLAN_LIMITS[plan === "employer_pro" ? plan : "employer_free"]
    .whatsappContactsPerMonth;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(whatsappContacts)
    .where(
      and(
        eq(whatsappContacts.employerId, userId),
        gte(whatsappContacts.createdAt, startOfMonth()),
      ),
    );

  return toQuota(count, limit);
}

export async function checkEmployerActiveJobsQuota(
  userId: string,
): Promise<QuotaCheck> {
  const plan = await getActivePlan(userId, "employer_free");
  const limit = PLAN_LIMITS[plan === "employer_pro" ? plan : "employer_free"]
    .activeJobs;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobOffers)
    .where(
      and(eq(jobOffers.employerId, userId), eq(jobOffers.status, "active")),
    );

  return toQuota(count, limit);
}
