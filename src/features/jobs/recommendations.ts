import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  candidateProfiles,
  candidateSkills,
  employerProfiles,
  jobOfferSkills,
  jobOffers,
} from "@/lib/db/schema";

/**
 * Pondérations du moteur de recommandation d'offres.
 *
 * Source de vérité unique — tout ajustement se fait ici, jamais en SQL en
 * dur. Les valeurs sont choisies pour que **les compétences en commun
 * dominent** : un seul skill matché (15 pts) compte presque autant qu'une
 * ville identique (20 pts), et plus que la fraîcheur seule (5 pts max).
 *
 * Pour rééquilibrer, garder en tête le scénario typique :
 * - candidat avec 3 skills sur 5 demandés + même ville → 45 + 20 = 65
 * - candidat sans skill mais profession dans le titre → 10
 * - offre fraîche sans aucun match → 5
 */
export const RECOMMENDATION_WEIGHTS = {
  /** Points par compétence partagée entre le candidat et l'offre. */
  perMatchedSkill: 15,
  /** Bonus quand la ville de l'offre = ville du candidat (insensible casse). */
  sameCity: 20,
  /** Bonus quand `candidate.profession` apparaît dans `job.title`. */
  professionInTitle: 10,
  /** Bonus quand elle apparaît seulement dans `job.description`. */
  professionInDescription: 5,
  /** Bonus offre publiée il y a < 7 jours. */
  freshLastWeek: 5,
  /** Bonus offre publiée entre 7 et 30 jours. */
  freshLastMonth: 2,
  /** Bonus employeur vérifié — sert surtout à départager les égalités. */
  verifiedEmployer: 3,
} as const;

export type RecommendedJobRow = {
  id: string;
  type: "job" | "internship" | "freelance";
  title: string;
  city: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryLabel: string | null;
  imageUrl: string | null;
  publishedAt: Date;
  employerId: string;
  companyName: string | null;
  companyLogoUrl: string | null;
  /** Nombre de compétences candidat ↔ offre en commun. Sert à afficher un badge "X compétences en commun". */
  matchedSkills: number;
  /** Score brut (cf. RECOMMENDATION_WEIGHTS). Exposé pour debug / tests. */
  score: number;
};

/**
 * Calcule la liste des offres recommandées pour un candidat donné.
 *
 * # Algorithme
 *
 * Un **scoring SQL pondéré** (pas de ML). Chaque offre `active` reçoit un
 * score = somme des signaux pondérés (cf. `RECOMMENDATION_WEIGHTS`) :
 *
 * | Signal                          | Source                                                  | Poids                    |
 * |---------------------------------|---------------------------------------------------------|--------------------------|
 * | Compétences en commun           | `candidate_skills ∩ job_offer_skills`                   | × `perMatchedSkill`      |
 * | Ville identique                 | `lower(job.city) = lower(candidate.city)`               | `sameCity`               |
 * | Profession dans le titre        | `job.title ILIKE %candidate.profession%`                | `professionInTitle`      |
 * | Profession dans la description  | `job.description ILIKE %candidate.profession%` (sinon)  | `professionInDescription`|
 * | Fraîcheur < 7 j                 | `published_at > now() - 7d`                             | `freshLastWeek`          |
 * | Fraîcheur 7–30 j                | `published_at > now() - 30d`                            | `freshLastMonth`         |
 * | Employeur vérifié               | `employer.is_verified = true`                           | `verifiedEmployer`       |
 *
 * Tri final : `score DESC, published_at DESC` (la fraîcheur départage les
 * égalités). Si le candidat n'a ni skill, ni ville, ni profession renseignés,
 * tous les scores tombent autour de 0–5 → on **dégrade gracieusement vers
 * un tri chronologique**, ce qui est le comportement de `listActiveJobOffers`.
 *
 * # Exclusions
 *
 * - Offres dont `status != 'active'`.
 * - Offres auxquelles le candidat a **déjà postulé** (sous-requête `NOT EXISTS`).
 *
 * # Quota / paywall
 *
 * Cette fonction n'applique **pas** le plafond `candidate_free` (10 offres
 * visibles). C'est `listActiveJobOffers` qui gère la pagination plafonnée
 * sur `/c/jobs`. Le widget "Recommandés pour vous" sur la home est un
 * teaser limité à ~4 cartes, hors quota — cohérent avec un produit qui
 * pousse à l'inscription Premium plutôt qu'à brider la découverte.
 *
 * # Performance
 *
 * Une seule requête. Coût ~O(jobs actives) — les sous-requêtes corrélées
 * s'appuient sur des index existants :
 * - `job_offer_skills` (PK composite `(job_offer_id, skill_id)`)
 * - `applications_unique_pair` (sur `(candidate_id, job_offer_id)`)
 * - `job_offers_status_idx`, `job_offers_city_idx`
 *
 * Si le volume dépasse ~10 000 offres actives, envisager :
 * - une matérialisée nocturne `recommendations_<candidate_id>` (peu probable
 *   au vu du marché gabonais visé) ;
 * - ou un pré-filtre par skill (réduire la sortie au sous-ensemble qui a au
 *   moins une compétence en commun) avant scoring.
 *
 * @param candidateUserId  ID du candidat (= `users.id` = `candidate_profiles.user_id`).
 * @param opts.limit       Nombre max de résultats. Borné à [1, 50], défaut 10.
 */
export async function recommendJobOffers(
  candidateUserId: string,
  opts: { limit?: number } = {},
): Promise<RecommendedJobRow[]> {
  const limit = Math.max(1, Math.min(50, opts.limit ?? 10));
  const W = RECOMMENDATION_WEIGHTS;

  // Sous-requête : nombre de skills partagés entre l'offre et le candidat.
  // Réutilisée dans `matchedSkills` (affichage) et dans `score` (pondération).
  const matchedSkillsExpr = sql<number>`(
    select count(*)::int
    from ${jobOfferSkills} jos
    where jos.job_offer_id = ${jobOffers.id}
      and jos.skill_id in (
        select cs.skill_id from ${candidateSkills} cs
        where cs.candidate_id = ${candidateUserId}
      )
  )`;

  // Expression de score complète. On jointe `candidate_profiles` côté FROM
  // (1 seule ligne par construction), donc on peut référencer ses colonnes
  // directement au lieu de répéter des sous-requêtes.
  const scoreExpr = sql<number>`(
    ${W.perMatchedSkill} * ${matchedSkillsExpr}
    + case
        when ${candidateProfiles.city} is not null
         and ${jobOffers.city} is not null
         and lower(${jobOffers.city}) = lower(${candidateProfiles.city})
        then ${W.sameCity}
        else 0
      end
    + case
        when ${candidateProfiles.profession} is not null
         and ${jobOffers.title} ilike '%' || ${candidateProfiles.profession} || '%'
        then ${W.professionInTitle}
        when ${candidateProfiles.profession} is not null
         and ${jobOffers.description} ilike '%' || ${candidateProfiles.profession} || '%'
        then ${W.professionInDescription}
        else 0
      end
    + case
        when ${jobOffers.publishedAt} > now() - interval '7 days' then ${W.freshLastWeek}
        when ${jobOffers.publishedAt} > now() - interval '30 days' then ${W.freshLastMonth}
        else 0
      end
    + case when ${employerProfiles.isVerified} then ${W.verifiedEmployer} else 0 end
  )::int`;

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
      matchedSkills: matchedSkillsExpr,
      score: scoreExpr,
    })
    .from(jobOffers)
    .leftJoin(
      employerProfiles,
      eq(jobOffers.employerId, employerProfiles.userId),
    )
    // Jointure "scalaire" sur le profil candidat : filtre constant → 0 ou 1 ligne,
    // pas d'explosion cartésienne. Permet d'utiliser city/profession dans le score.
    .leftJoin(
      candidateProfiles,
      eq(candidateProfiles.userId, candidateUserId),
    )
    .where(
      and(
        eq(jobOffers.status, "active"),
        sql`not exists (
          select 1 from ${applications} a
          where a.job_offer_id = ${jobOffers.id}
            and a.candidate_id = ${candidateUserId}
        )`,
      ),
    )
    .orderBy(sql`${scoreExpr} desc`, desc(jobOffers.publishedAt))
    .limit(limit);

  return rows as RecommendedJobRow[];
}
