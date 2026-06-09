import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listActiveJobOffers } from "@/features/jobs/queries";
import { JobCard, type JobCardJob } from "@/components/shared/JobCard";
import { JobsFilters } from "./jobs-filters";

const TYPE_LABEL = {
  job: "Emploi",
  internship: "Stage",
  freelance: "Freelance",
} as const;

function publishedLabel(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 36e5);
  if (hours < 1) return "il y a moins d'1h";
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default async function CandidateJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; type?: string; q?: string; page?: string }>;
}) {
  const user = await requireRole("candidate");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const validType = ["job", "internship", "freelance"].includes(sp.type ?? "")
    ? (sp.type as "job" | "internship" | "freelance")
    : undefined;

  const { rows, capped } = await listActiveJobOffers(user.id, {
    city: sp.city,
    type: validType,
    q: sp.q,
    page,
    pageSize: 10,
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Trouvez votre opportunité</h1>
        <p className="text-sm text-jc-text-secondary mt-1">
          Découvrez des milliers d&apos;offres adaptées à votre profil au Gabon.
        </p>
      </header>

      <JobsFilters
        defaultQ={sp.q ?? ""}
        defaultCity={sp.city ?? ""}
        defaultType={validType ?? "all"}
      />

      {rows.length === 0 ? (
        <div className="jc-card p-8 text-center text-sm text-jc-text-secondary">
          Aucune offre ne correspond à votre recherche.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const job: JobCardJob = {
              id: r.id,
              title: r.title,
              company: r.companyName ?? "Entreprise",
              city: r.city,
              type: r.type,
              contractLabel: TYPE_LABEL[r.type],
              salaryLabel: r.salaryLabel,
              logoUrl: r.companyLogoUrl,
              publishedLabel: `Publié ${publishedLabel(new Date(r.publishedAt))}`,
            };
            return (
              <li key={r.id}>
                <JobCard job={job} />
              </li>
            );
          })}
        </ul>
      )}

      {capped ? (
        <div className="jc-card p-5 text-center bg-jc-light-green border border-jc-primary-green/20">
          <p className="text-sm font-semibold text-jc-primary-dark">
            Vous avez atteint la limite de 10 offres visibles.
          </p>
          <p className="text-xs text-jc-text-secondary mt-1">
            Passez en Premium pour voir toutes les opportunités.
          </p>
          <Link
            href="/c/upgrade"
            className="inline-block mt-3 rounded-xl bg-jc-primary-green text-white px-4 py-2 text-sm font-semibold"
          >
            Passer en Premium
          </Link>
        </div>
      ) : null}
    </div>
  );
}
