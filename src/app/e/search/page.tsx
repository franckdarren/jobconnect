import Link from "next/link";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  getEmployerUnlockedToday,
  searchCandidates,
} from "@/features/candidates/queries";
import { checkEmployerProfileViewQuota } from "@/lib/quotas";
import {
  CandidateCard,
  type CandidateCardCandidate,
} from "@/components/shared/CandidateCard";
import { SearchFilters } from "./search-filters";

type ExperienceLevel = "beginner" | "1_3" | "3_5" | "5_plus";
type Availability = "immediate" | "15_days" | "30_days";

const EXPERIENCE_SET = new Set<ExperienceLevel>([
  "beginner",
  "1_3",
  "3_5",
  "5_plus",
]);
const AVAILABILITY_SET = new Set<Availability>([
  "immediate",
  "15_days",
  "30_days",
]);

function maskLastName(lastName: string): string {
  const trimmed = lastName.trim();
  if (!trimmed) return "";
  return `${trimmed[0]}.`;
}

export default async function EmployerSearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    city?: string;
    exp?: string;
    av?: string;
    page?: string;
  }>;
}) {
  const user = await requireRole("employer");
  const sp = await searchParams;

  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 12;
  const exp = EXPERIENCE_SET.has(sp.exp as ExperienceLevel)
    ? (sp.exp as ExperienceLevel)
    : undefined;
  const av = AVAILABILITY_SET.has(sp.av as Availability)
    ? (sp.av as Availability)
    : undefined;

  const [{ rows, total }, unlockedSet, viewQuota] = await Promise.all([
    searchCandidates({
      q: sp.q,
      city: sp.city,
      experienceLevel: exp,
      availability: av,
      page,
      pageSize,
    }),
    getEmployerUnlockedToday(user.id),
    checkEmployerProfileViewQuota(user.id),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const quotaUnlimited = viewQuota.limit === Infinity;
  const noQuotaLeft = !quotaUnlimited && !viewQuota.allowed;

  return (
    <div className="space-y-4 md:space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Recherche de candidats</h1>
        <p className="text-sm md:text-base text-jc-text-secondary mt-1">
          Trouvez des talents qualifiés pour vos postes au Gabon.
        </p>
      </header>

      <SearchFilters
        defaultQ={sp.q ?? ""}
        defaultCity={sp.city ?? ""}
        defaultExperience={exp ?? "all"}
        defaultAvailability={av ?? "all"}
      />

      <div className="jc-card p-3 flex items-center justify-between text-xs">
        <span className="text-jc-text-secondary inline-flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {total} candidat{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}
        </span>
        <span className="font-semibold text-jc-text-primary">
          {quotaUnlimited
            ? "Profils illimités"
            : `${viewQuota.remaining}/${viewQuota.limit} profils restants aujourd'hui`}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="jc-card p-8 md:p-12 text-center text-sm text-jc-text-secondary">
          Aucun candidat ne correspond à votre recherche.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const unlocked = unlockedSet.has(r.id);
            const locked = !unlocked && noQuotaLeft;
            const candidate: CandidateCardCandidate = {
              id: r.id,
              displayName: `${r.firstName} ${r.lastName}`,
              maskedName: `${r.firstName} ${maskLastName(r.lastName)}`,
              profession: r.profession,
              city: r.city,
              photoUrl: r.photoUrl,
              whatsappPhone: null,
              isBoosted: r.isBoosted,
            };
            return (
              <li key={r.id}>
                <Link
                  href={`/e/search/${r.id}`}
                  className="block hover:opacity-90 transition-opacity"
                >
                  <CandidateCard candidate={candidate} locked={locked} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {noQuotaLeft ? (
        <div className="jc-card p-5 text-center bg-jc-light-green border border-jc-primary-green/20">
          <p className="text-sm font-semibold text-jc-primary-dark">
            Vous avez atteint votre quota de profils débloqués aujourd&apos;hui.
          </p>
          <p className="text-xs text-jc-text-secondary mt-1">
            Passez à l&apos;offre Pro pour un accès illimité aux candidats.
          </p>
          <Link
            href="/e/upgrade"
            className="inline-block mt-3 rounded-xl bg-jc-primary-green text-white px-4 py-2 text-sm font-semibold"
          >
            Passer en Pro
          </Link>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-2 pt-2">
          {page > 1 ? (
            <PageLink page={page - 1} sp={sp} label="Précédent" />
          ) : null}
          <span className="text-xs text-jc-text-secondary">
            Page {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <PageLink page={page + 1} sp={sp} label="Suivant" />
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

function PageLink({
  page,
  sp,
  label,
}: {
  page: number;
  sp: { q?: string; city?: string; exp?: string; av?: string };
  label: string;
}) {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.city) params.set("city", sp.city);
  if (sp.exp) params.set("exp", sp.exp);
  if (sp.av) params.set("av", sp.av);
  params.set("page", String(page));
  return (
    <Link
      href={`/e/search?${params.toString()}`}
      className="rounded-full bg-jc-primary-dark text-white text-xs font-semibold px-4 py-1.5"
    >
      {label}
    </Link>
  );
}
