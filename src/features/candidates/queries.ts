import "server-only";
import { eq, inArray, desc, asc, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  candidateProfiles,
  candidateExperiences,
  candidateEducations,
  candidateSkills,
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
