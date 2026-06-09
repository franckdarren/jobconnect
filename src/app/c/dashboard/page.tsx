import Link from "next/link";
import { Briefcase, Send, Clock, Eye, Check, X } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  getCandidateApplicationStats,
  listOwnApplications,
} from "@/features/applications/queries";
import {
  checkCandidateApplicationQuota,
  getActivePlan,
} from "@/lib/quotas";
import { PremiumBadge } from "@/components/shared/PremiumBadge";

const STATUS_STYLE = {
  pending: "bg-jc-orange/10 text-jc-orange",
  viewed: "bg-jc-light-green text-jc-primary-green",
  rejected: "bg-jc-warning/10 text-jc-warning",
} as const;

const STATUS_LABEL = {
  pending: "En attente",
  viewed: "Vue",
  rejected: "Rejetée",
} as const;

const STATUS_ICON = {
  pending: Clock,
  viewed: Eye,
  rejected: X,
} as const;

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default async function CandidateDashboardPage() {
  const user = await requireRole("candidate");
  const [stats, applications, quota, plan] = await Promise.all([
    getCandidateApplicationStats(user.id),
    listOwnApplications(user.id),
    checkCandidateApplicationQuota(user.id),
    getActivePlan(user.id, "candidate_free"),
  ]);
  const isPremium = plan === "candidate_premium";

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes candidatures</h1>
        {isPremium ? <PremiumBadge label="PREMIUM" variant="green" /> : null}
      </header>

      <div className="grid grid-cols-2 gap-3">
        <article className="jc-card p-4">
          <div className="flex items-center gap-2 text-sm text-jc-primary-green font-medium">
            <Send className="w-4 h-4" />
            Ce mois
          </div>
          <p className="text-3xl font-bold mt-1">{stats.thisMonth}</p>
          {!isPremium ? (
            <p className="text-[11px] text-jc-text-muted mt-1">
              {quota.remaining === Infinity ? "∞" : quota.remaining} restantes
              ({quota.limit})
            </p>
          ) : (
            <p className="text-[11px] text-jc-primary-green mt-1">Illimitées</p>
          )}
        </article>
        <article className="jc-card p-4">
          <div className="flex items-center gap-2 text-sm text-jc-text-secondary font-medium">
            <Check className="w-4 h-4" />
            Total
          </div>
          <p className="text-3xl font-bold mt-1">{stats.total}</p>
          <p className="text-[11px] text-jc-text-muted mt-1">
            depuis l&apos;inscription
          </p>
        </article>
      </div>

      {!isPremium ? (
        <section className="jc-card p-4 bg-jc-primary-dark text-white border-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-wide text-jc-orange">
                OFFRE PRIVILÈGE
              </p>
              <h2 className="text-base font-bold mt-1">
                Candidatures illimitées
              </h2>
              <p className="text-xs text-white/70 mt-1 max-w-xs">
                Postulez sans limite et boostez votre profil à 2 000 FCFA / mois.
              </p>
            </div>
            <Link
              href="/c/upgrade"
              className="shrink-0 rounded-full bg-jc-primary-green text-white text-xs font-semibold px-3 py-2"
            >
              Passer Premium
            </Link>
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-bold mb-3">Historique</h2>
        {applications.length === 0 ? (
          <div className="jc-card p-8 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-jc-light-green flex items-center justify-center mb-3">
              <Briefcase className="w-5 h-5 text-jc-primary-green" />
            </div>
            <h3 className="font-bold">Aucune candidature</h3>
            <p className="text-sm text-jc-text-secondary mt-1">
              Découvrez les offres et postulez en un clic.
            </p>
            <Link
              href="/c/jobs"
              className="mt-3 rounded-full bg-jc-primary-dark text-white text-sm font-semibold px-4 py-2"
            >
              Voir les offres
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {applications.map((a) => {
              const Icon = STATUS_ICON[a.status];
              return (
                <li key={a.id}>
                  <Link
                    href={`/c/jobs/${a.jobId}`}
                    className="block jc-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-jc-background overflow-hidden flex items-center justify-center shrink-0">
                        {a.companyLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.companyLogo}
                            alt={a.companyName ?? ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Briefcase className="w-4 h-4 text-jc-text-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold leading-tight">
                          {a.jobTitle}
                        </h3>
                        <p className="text-xs text-jc-text-secondary mt-0.5">
                          {a.companyName ?? "Entreprise"}
                          {a.jobCity ? ` • ${a.jobCity}` : null}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-bold tracking-wide px-2 py-1 rounded-full flex items-center gap-1 shrink-0 ${STATUS_STYLE[a.status]}`}
                      >
                        <Icon className="w-3 h-3" />
                        {STATUS_LABEL[a.status]}
                      </span>
                    </div>
                    <p className="text-[11px] text-jc-text-muted mt-2">
                      Envoyée le {formatDate(a.createdAt)}
                      {a.viewedAt
                        ? ` • Vue le ${formatDate(a.viewedAt)}`
                        : null}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
