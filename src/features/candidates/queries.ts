import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  candidateProfiles,
  candidateExperiences,
  candidateEducations,
  candidateSkills,
  profileViews,
  skills,
  users,
} from "@/lib/db/schema";

export type FullCandidateProfile = Awaited<
  ReturnType<typeof getCandidateProfile>
>;

export async function getCandidateProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, userId));
  if (!profile) return null;

  const [experiences, educations, candidateSkillRows, user] = await Promise.all([
    db
      .select()
      .from(candidateExperiences)
      .where(eq(candidateExperiences.candidateId, userId))
      .orderBy(desc(candidateExperiences.startDate)),
    db
      .select()
      .from(candidateEducations)
      .where(eq(candidateEducations.candidateId, userId))
      .orderBy(desc(candidateEducations.endYear)),
    db
      .select({ skillId: candidateSkills.skillId })
      .from(candidateSkills)
      .where(eq(candidateSkills.candidateId, userId)),
    db
      .select({ phone: users.phone, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);

  const skillIds = candidateSkillRows.map((r) => r.skillId);
  const candidateSkillsList = skillIds.length
    ? await db
        .select()
        .from(skills)
        .where(inArray(skills.id, skillIds))
        .orderBy(asc(skills.name))
    : [];

  return {
    profile,
    user: user[0] ?? null,
    experiences,
    educations,
    skills: candidateSkillsList,
  };
}

export async function getCandidateById(candidateId: string) {
  return getCandidateProfile(candidateId);
}

export async function searchSkills(query: string, limit = 8) {
  const trimmed = query.trim();
  if (!trimmed) {
    return db
      .select()
      .from(skills)
      .orderBy(asc(skills.name))
      .limit(limit);
  }
  return db
    .select()
    .from(skills)
    .where(ilike(skills.name, `%${trimmed}%`))
    .orderBy(asc(skills.name))
    .limit(limit);
}

// =========================================================================
// Search candidates (employer-side, Phase 7)
// =========================================================================

export type SearchCandidatesFilters = {
  q?: string;
  city?: string;
  experienceLevel?: "beginner" | "1_3" | "3_5" | "5_plus";
  availability?: "immediate" | "15_days" | "30_days";
  skillIds?: string[];
  page?: number;
  pageSize?: number;
};

export type CandidateSearchRow = {
  id: string;
  firstName: string;
  lastName: string;
  city: string | null;
  profession: string | null;
  photoUrl: string | null;
  isBoosted: boolean;
  experienceLevel: "beginner" | "1_3" | "3_5" | "5_plus" | null;
  availability: "immediate" | "15_days" | "30_days" | null;
};

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Server-side candidate search for employers. Skill filtering is done by
 * sub-query (IN) on `candidate_skills` so the WHERE stays composable.
 * The result is intentionally narrow — sensitive fields (phone, CV, summary)
 * are NOT returned by this query; they live behind `getCandidateById` after
 * a `viewCandidateProfile` unlock.
 */
export async function searchCandidates(
  filters: SearchCandidatesFilters,
): Promise<{ rows: CandidateSearchRow[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, filters.pageSize ?? 12));

  const conditions = [];
  if (filters.q?.trim()) {
    const pat = `%${filters.q.trim()}%`;
    const orExpr = or(
      ilike(candidateProfiles.firstName, pat),
      ilike(candidateProfiles.lastName, pat),
      ilike(candidateProfiles.profession, pat),
      ilike(candidateProfiles.summary, pat),
    );
    if (orExpr) conditions.push(orExpr);
  }
  if (filters.city?.trim()) {
    conditions.push(ilike(candidateProfiles.city, `%${filters.city.trim()}%`));
  }
  if (filters.experienceLevel) {
    conditions.push(eq(candidateProfiles.experienceLevel, filters.experienceLevel));
  }
  if (filters.availability) {
    conditions.push(eq(candidateProfiles.availability, filters.availability));
  }
  if (filters.skillIds && filters.skillIds.length > 0) {
    const sub = db
      .select({ id: candidateSkills.candidateId })
      .from(candidateSkills)
      .where(inArray(candidateSkills.skillId, filters.skillIds));
    conditions.push(inArray(candidateProfiles.userId, sub));
  }

  const whereExpr = conditions.length ? and(...conditions) : undefined;

  const [rowsRaw, [{ count }]] = await Promise.all([
    db
      .select({
        id: candidateProfiles.userId,
        firstName: candidateProfiles.firstName,
        lastName: candidateProfiles.lastName,
        city: candidateProfiles.city,
        profession: candidateProfiles.profession,
        photoUrl: candidateProfiles.photoUrl,
        isBoosted: candidateProfiles.isBoosted,
        experienceLevel: candidateProfiles.experienceLevel,
        availability: candidateProfiles.availability,
      })
      .from(candidateProfiles)
      .where(whereExpr)
      .orderBy(desc(candidateProfiles.isBoosted), desc(candidateProfiles.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(candidateProfiles)
      .where(whereExpr),
  ]);

  return { rows: rowsRaw, total: count ?? 0 };
}

/**
 * Returns the set of candidate IDs the given employer has already unlocked
 * today (one `profile_views` row counts as an unlock for the rest of the day).
 * Used to show LockOverlay only on still-locked rows.
 */
export async function getEmployerUnlockedToday(
  employerId: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ candidateId: profileViews.candidateId })
    .from(profileViews)
    .where(
      and(
        eq(profileViews.employerId, employerId),
        gte(profileViews.createdAt, startOfDay()),
      ),
    );
  return new Set(rows.map((r) => r.candidateId));
}

export async function hasUnlockedCandidateToday(
  employerId: string,
  candidateId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: profileViews.id })
    .from(profileViews)
    .where(
      and(
        eq(profileViews.employerId, employerId),
        eq(profileViews.candidateId, candidateId),
        gte(profileViews.createdAt, startOfDay()),
      ),
    )
    .limit(1);
  return !!row;
}

/**
 * Aggregated stats for the candidate dashboard. `total` is all-time, `thisMonth`
 * resets the 1st of each month. Profile views are gated behind the Premium plan
 * in the UI — this query returns the raw counts regardless.
 */
export async function getCandidateProfileViewStats(
  candidateId: string,
): Promise<{ total: number; thisMonth: number }> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      thisMonth: sql<number>`count(*) filter (where created_at >= date_trunc('month', now()))::int`,
    })
    .from(profileViews)
    .where(eq(profileViews.candidateId, candidateId));
  return row ?? { total: 0, thisMonth: 0 };
}
