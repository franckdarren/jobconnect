import "server-only";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  employerProfiles,
  jobOfferMissions,
  jobOfferSkills,
  jobOffers,
  skills as skillsTable,
} from "@/lib/db/schema";
import { getActivePlan, PLAN_LIMITS } from "@/lib/quotas";
import type { ListActiveJobsFilters } from "./schemas";

type FilterArgs = Partial<ListActiveJobsFilters>;

export async function listActiveJobOffers(
  candidateUserId: string | null,
  filters: FilterArgs = {},
) {
  const { city, type, q, page = 1, pageSize = 10 } = filters;

  const conds = [eq(jobOffers.status, "active")];
  if (city) conds.push(ilike(jobOffers.city, `%${city}%`));
  if (type) conds.push(eq(jobOffers.type, type));
  if (q) {
    conds.push(
      or(
        ilike(jobOffers.title, `%${q}%`),
        ilike(jobOffers.description, `%${q}%`),
      )!,
    );
  }

  let limit = pageSize;
  if (candidateUserId) {
    const plan = await getActivePlan(candidateUserId, "candidate_free");
    if (plan === "candidate_free") {
      const cap = PLAN_LIMITS.candidate_free.visibleOffers;
      const remaining = Math.max(0, cap - (page - 1) * pageSize);
      limit = Math.min(pageSize, remaining);
      if (limit <= 0) return { rows: [], capped: true };
    }
  }

  const rows = await db
    .select({
      id: jobOffers.id,
      type: jobOffers.type,
      title: jobOffers.title,
      city: jobOffers.city,
      salaryMin: jobOffers.salaryMin,
      salaryMax: jobOffers.salaryMax,
      salaryLabel: jobOffers.salaryLabel,
      imageUrl: jobOffers.imageUrl,
      publishedAt: jobOffers.publishedAt,
      employerId: jobOffers.employerId,
      companyName: employerProfiles.companyName,
      companyLogoUrl: employerProfiles.logoUrl,
    })
    .from(jobOffers)
    .leftJoin(
      employerProfiles,
      eq(jobOffers.employerId, employerProfiles.userId),
    )
    .where(and(...conds))
    .orderBy(desc(jobOffers.publishedAt))
    .limit(limit)
    .offset((page - 1) * pageSize);

  return { rows, capped: false };
}

export async function listOwnJobOffers(employerId: string) {
  return db
    .select({
      id: jobOffers.id,
      type: jobOffers.type,
      title: jobOffers.title,
      city: jobOffers.city,
      salaryLabel: jobOffers.salaryLabel,
      imageUrl: jobOffers.imageUrl,
      status: jobOffers.status,
      publishedAt: jobOffers.publishedAt,
      applicationsCount: sql<number>`(
        select count(*)::int from applications a where a.job_offer_id = ${jobOffers.id}
      )`,
    })
    .from(jobOffers)
    .where(eq(jobOffers.employerId, employerId))
    .orderBy(desc(jobOffers.createdAt));
}

export async function getJobOfferById(id: string) {
  const [row] = await db
    .select({
      job: jobOffers,
      employerName: employerProfiles.companyName,
      employerLogo: employerProfiles.logoUrl,
      employerCity: employerProfiles.city,
      employerDescription: employerProfiles.description,
      employerVerified: employerProfiles.isVerified,
      employerWhatsapp: employerProfiles.whatsappPhone,
      employerId: employerProfiles.userId,
    })
    .from(jobOffers)
    .leftJoin(
      employerProfiles,
      eq(jobOffers.employerId, employerProfiles.userId),
    )
    .where(eq(jobOffers.id, id));
  if (!row) return null;

  const [missionRows, skillRows, applicationsCountRow] = await Promise.all([
    db
      .select()
      .from(jobOfferMissions)
      .where(eq(jobOfferMissions.jobOfferId, id))
      .orderBy(asc(jobOfferMissions.position)),
    db
      .select({ id: skillsTable.id, name: skillsTable.name })
      .from(jobOfferSkills)
      .innerJoin(skillsTable, eq(jobOfferSkills.skillId, skillsTable.id))
      .where(eq(jobOfferSkills.jobOfferId, id))
      .orderBy(asc(skillsTable.name)),
    db.execute(
      sql`select count(*)::int as count from applications where job_offer_id = ${id}`,
    ),
  ]);

  const applicationsCount =
    (applicationsCountRow[0]?.count as number | undefined) ?? 0;

  return {
    ...row,
    missions: missionRows,
    skills: skillRows,
    applicationsCount,
  };
}

export async function getJobOffersByEmployer(employerId: string, limit = 5) {
  return db
    .select({
      id: jobOffers.id,
      title: jobOffers.title,
      type: jobOffers.type,
      publishedAt: jobOffers.publishedAt,
    })
    .from(jobOffers)
    .where(
      and(eq(jobOffers.employerId, employerId), eq(jobOffers.status, "active")),
    )
    .orderBy(desc(jobOffers.publishedAt))
    .limit(limit);
}

export async function jobOfferOwnedBy(jobId: string, employerId: string) {
  const [row] = await db
    .select({ id: jobOffers.id })
    .from(jobOffers)
    .where(
      and(eq(jobOffers.id, jobId), eq(jobOffers.employerId, employerId)),
    );
  return !!row;
}

/**
 * For employer search dropdown — quick skill listing by ID set.
 */
export async function getSkillsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select({ id: skillsTable.id, name: skillsTable.name })
    .from(skillsTable)
    .where(inArray(skillsTable.id, ids));
}
