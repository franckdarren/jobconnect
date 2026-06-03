import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  candidateProfiles,
  employerProfiles,
  jobOffers,
  users,
} from "@/lib/db/schema";

/**
 * Applications for a given candidate — used in candidate dashboard.
 */
export async function listOwnApplications(candidateId: string) {
  return db
    .select({
      id: applications.id,
      status: applications.status,
      createdAt: applications.createdAt,
      viewedAt: applications.viewedAt,
      jobId: jobOffers.id,
      jobTitle: jobOffers.title,
      jobType: jobOffers.type,
      jobCity: jobOffers.city,
      jobStatus: jobOffers.status,
      companyName: employerProfiles.companyName,
      companyLogo: employerProfiles.logoUrl,
    })
    .from(applications)
    .innerJoin(jobOffers, eq(applications.jobOfferId, jobOffers.id))
    .leftJoin(
      employerProfiles,
      eq(jobOffers.employerId, employerProfiles.userId),
    )
    .where(eq(applications.candidateId, candidateId))
    .orderBy(desc(applications.createdAt));
}

/**
 * Applications for a single job offer — used in the employer's job detail
 * "Candidatures" tab.
 */
export async function listApplicationsForJob(jobOfferId: string) {
  return db
    .select({
      id: applications.id,
      status: applications.status,
      createdAt: applications.createdAt,
      viewedAt: applications.viewedAt,
      candidateId: candidateProfiles.userId,
      firstName: candidateProfiles.firstName,
      lastName: candidateProfiles.lastName,
      profession: candidateProfiles.profession,
      city: candidateProfiles.city,
      photoUrl: candidateProfiles.photoUrl,
      whatsappPhone: candidateProfiles.whatsappPhone,
      candidatePhone: users.phone,
    })
    .from(applications)
    .innerJoin(
      candidateProfiles,
      eq(applications.candidateId, candidateProfiles.userId),
    )
    .innerJoin(users, eq(candidateProfiles.userId, users.id))
    .where(eq(applications.jobOfferId, jobOfferId))
    .orderBy(desc(applications.createdAt));
}

/**
 * Aggregated list across all offers of an employer — used in employer dashboard.
 */
export async function listApplicationsForEmployer(
  employerId: string,
  limit = 20,
) {
  return db
    .select({
      id: applications.id,
      status: applications.status,
      createdAt: applications.createdAt,
      jobId: jobOffers.id,
      jobTitle: jobOffers.title,
      candidateId: candidateProfiles.userId,
      firstName: candidateProfiles.firstName,
      lastName: candidateProfiles.lastName,
      profession: candidateProfiles.profession,
      photoUrl: candidateProfiles.photoUrl,
    })
    .from(applications)
    .innerJoin(jobOffers, eq(applications.jobOfferId, jobOffers.id))
    .innerJoin(
      candidateProfiles,
      eq(applications.candidateId, candidateProfiles.userId),
    )
    .where(eq(jobOffers.employerId, employerId))
    .orderBy(desc(applications.createdAt))
    .limit(limit);
}

export async function hasAppliedToJob(
  candidateId: string,
  jobOfferId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.candidateId, candidateId),
        eq(applications.jobOfferId, jobOfferId),
      ),
    )
    .limit(1);
  return !!row;
}

export async function getCandidateApplicationStats(candidateId: string) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      thisMonth: sql<number>`count(*) filter (where created_at >= date_trunc('month', now()))::int`,
    })
    .from(applications)
    .where(eq(applications.candidateId, candidateId));
  return row ?? { total: 0, thisMonth: 0 };
}
