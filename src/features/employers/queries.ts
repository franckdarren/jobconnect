import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  employerProfiles,
  jobOffers,
  profileViews,
  users,
  whatsappContacts,
} from "@/lib/db/schema";

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

export type EmployerStats = {
  activeJobs: number;
  totalJobs: number;
  applicationsTotal: number;
  applicationsThisMonth: number;
  profileViewsTotal: number;
  profileViewsToday: number;
  whatsappTotal: number;
  whatsappThisMonth: number;
};

/**
 * Aggregated dashboard stats for an employer. All queries run in parallel.
 * Counts are computed in Postgres (`count(*) filter (...)`) to avoid extra trips.
 */
export async function getEmployerStats(
  employerId: string,
): Promise<EmployerStats> {
  const [jobsRow, appsRow, viewsRow, waRow] = await Promise.all([
    db
      .select({
        active: sql<number>`count(*) filter (where status = 'active')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(jobOffers)
      .where(eq(jobOffers.employerId, employerId)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        thisMonth: sql<number>`count(*) filter (where ${applications.createdAt} >= date_trunc('month', now()))::int`,
      })
      .from(applications)
      .innerJoin(jobOffers, eq(applications.jobOfferId, jobOffers.id))
      .where(eq(jobOffers.employerId, employerId)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        today: sql<number>`count(*) filter (where created_at >= date_trunc('day', now()))::int`,
      })
      .from(profileViews)
      .where(eq(profileViews.employerId, employerId)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        thisMonth: sql<number>`count(*) filter (where created_at >= date_trunc('month', now()))::int`,
      })
      .from(whatsappContacts)
      .where(eq(whatsappContacts.employerId, employerId)),
  ]);

  return {
    activeJobs: jobsRow[0]?.active ?? 0,
    totalJobs: jobsRow[0]?.total ?? 0,
    applicationsTotal: appsRow[0]?.total ?? 0,
    applicationsThisMonth: appsRow[0]?.thisMonth ?? 0,
    profileViewsTotal: viewsRow[0]?.total ?? 0,
    profileViewsToday: viewsRow[0]?.today ?? 0,
    whatsappTotal: waRow[0]?.total ?? 0,
    whatsappThisMonth: waRow[0]?.thisMonth ?? 0,
  };
}
