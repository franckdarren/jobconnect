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
  subscriptions,
  users,
} from "@/lib/db/schema";
import {
  computeProfileCompleteness,
  type ProfileCompleteness,
} from "./completeness";

export type FullCandidateProfile = Awaited<
  ReturnType<typeof getCandidateProfile>
>;

/**
 * Expression SQL `EXISTS(...)` qui vaut `true` ssi le candidat a une
 * souscription `candidate_premium` active et non expirée.
 *
 * Centralisée ici parce qu'elle est utilisée à la fois dans le SELECT et
 * dans le ORDER BY de `searchCandidates`. Garder une seule définition
 * évite les divergences silencieuses entre tri et affichage.
 */
function isPremiumCandidateExpr(candidateIdCol: typeof candidateProfiles.userId) {
  return sql<boolean>`exists (
    select 1 from ${subscriptions} s
    where s.user_id = ${candidateIdCol}
      and s.plan = 'candidate_premium'
      and s.status = 'active'
      and s.expires_at >= now()
  )`;
}

export async function getCandidateProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, userId));
  if (!profile) return null;

  const [experiences, educations, candidateSkillRows, user, premiumRow] =
    await Promise.all([
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
      db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.plan, "candidate_premium"),
            eq(subscriptions.status, "active"),
            gte(subscriptions.expiresAt, new Date()),
          ),
        )
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
    /** `true` ssi souscription `candidate_premium` active. Sert au badge ✦ employeur. */
    isPremium: premiumRow.length > 0,
  };
}

export async function getCandidateById(candidateId: string) {
  return getCandidateProfile(candidateId);
}

/**
 * Complétude du profil candidat, calculée en une seule requête (sous-requêtes
 * corrélées de comptage). Retourne `null` si le profil n'existe pas encore.
 *
 * Le calcul lui-même vit dans `completeness.ts` (pur, partagé client/serveur) —
 * cette fonction ne fait que rassembler les données.
 */
export async function getCandidateCompleteness(
  userId: string,
): Promise<ProfileCompleteness | null> {
  const [row] = await db
    .select({
      photoUrl: candidateProfiles.photoUrl,
      profession: candidateProfiles.profession,
      summary: candidateProfiles.summary,
      city: candidateProfiles.city,
      experienceLevel: candidateProfiles.experienceLevel,
      availability: candidateProfiles.availability,
      cvUrl: candidateProfiles.cvUrl,
      skillsCount: sql<number>`(select count(*) from ${candidateSkills} where ${candidateSkills.candidateId} = ${candidateProfiles.userId})::int`,
      experiencesCount: sql<number>`(select count(*) from ${candidateExperiences} where ${candidateExperiences.candidateId} = ${candidateProfiles.userId})::int`,
      educationsCount: sql<number>`(select count(*) from ${candidateEducations} where ${candidateEducations.candidateId} = ${candidateProfiles.userId})::int`,
    })
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, userId));
  if (!row) return null;
  return computeProfileCompleteness(row);
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
  /**
   * Candidat avec abonnement `candidate_premium` actif. Dérivé d'une
   * sous-requête `EXISTS` sur `subscriptions` — pas une colonne de
   * `candidate_profiles`. Sert à la fois au tri (premium remonte) et à
   * l'affichage du badge ✦ côté employeur.
   */
  isPremium: boolean;
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

  // Calculé une fois, réutilisé en SELECT et en ORDER BY pour qu'il n'y ait
  // qu'une seule définition de "qu'est-ce qu'un candidat premium ?".
  const isPremiumExpr = isPremiumCandidateExpr(candidateProfiles.userId);

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
        isPremium: isPremiumExpr,
        experienceLevel: candidateProfiles.experienceLevel,
        availability: candidateProfiles.availability,
      })
      .from(candidateProfiles)
      .where(whereExpr)
      // Hiérarchie de visibilité :
      //  1. Boost admin (éditorial / promo manuelle)
      //  2. Premium payant (abonnement actif)
      //  3. Récent (créé en dernier)
      // Ainsi un boost admin reste prioritaire sur un premium, et un premium
      // remonte au-dessus des comptes free récents.
      .orderBy(
        desc(candidateProfiles.isBoosted),
        desc(isPremiumExpr),
        desc(candidateProfiles.createdAt),
      )
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
