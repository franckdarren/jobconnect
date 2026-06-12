import Link from "next/link";
import {
  Briefcase,
  Send,
  Eye,
  MessageCircle,
  Plus,
  Lock,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireRole } from "@/lib/auth";
import { getEmployerStats } from "@/features/employers/queries";
import { listApplicationsForEmployer } from "@/features/applications/queries";
import { getActivePlan } from "@/lib/quotas";
import { PremiumBadge } from "@/components/shared/PremiumBadge";

const STATUS_STYLE = {
  pending: "bg-jc-orange/10 text-jc-orange",
  viewed: "bg-jc-light-green text-jc-primary-green",
  rejected: "bg-jc-warning/10 text-jc-warning",
} as const;

const STATUS_LABEL = {
  pending: "Nouvelle",
  viewed: "Vue",
  rejected: "Rejetée",
} as const;

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default async function EmployerDashboardPage() {
  const user = await requireRole("employer");
  const [stats, recentApps, plan] = await Promise.all([
    getEmployerStats(user.id),
    listApplicationsForEmployer(user.id, 5),
    getActivePlan(user.id, "employer_free"),
  ]);
  const isPro = plan === "employer_pro";

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Tableau de bord</h1>
        {isPro ? <PremiumBadge label="PRO" variant="green" /> : null}
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <article className="jc-card p-4 min-w-0">
          <div className="flex items-center gap-2 text-sm text-jc-primary-green font-medium">
            <Briefcase className="w-4 h-4 shrink-0" />
            <span className="truncate">Offres actives</span>
          </div>
          <p className="text-3xl font-bold mt-1">{stats.activeJobs}</p>
          <p className="text-[11px] text-jc-text-muted mt-1 truncate">
            {stats.totalJobs} au total
          </p>
        </article>
        <article className="jc-card p-4 min-w-0">
          <div className="flex items-center gap-2 text-sm text-jc-orange font-medium">
            <Send className="w-4 h-4 shrink-0" />
            <span className="truncate">Candidatures</span>
          </div>
          <p className="text-3xl font-bold mt-1">{stats.applicationsThisMonth}</p>
          <p className="text-[11px] text-jc-text-muted mt-1 truncate">
            ce mois ({stats.applicationsTotal} total)
          </p>
        </article>
        <article className="jc-card p-4 relative overflow-hidden min-w-0">
          <div className="flex items-center gap-2 text-sm text-jc-primary-dark font-medium">
            <Eye className="w-4 h-4 shrink-0" />
            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="leading-snug">Profils</span>
              {!isPro ? <PremiumBadge label="PRO" variant="dark" /> : null}
            </div>
          </div>
          <p className="text-3xl font-bold mt-1">
            {isPro ? stats.profileViewsTotal : "•••"}
          </p>
          <p className="text-[11px] text-jc-text-muted mt-1 truncate">
            {isPro
              ? `${stats.profileViewsToday} aujourd'hui`
              : "Réservé Pro"}
          </p>
        </article>
        <article className="jc-card p-4 min-w-0">
          <div className="flex items-center gap-2 text-sm text-[#25D366] font-medium">
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">Contacts WA</span>
          </div>
          <p className="text-3xl font-bold mt-1">{stats.whatsappThisMonth}</p>
          <p className="text-[11px] text-jc-text-muted mt-1 truncate">
            ce mois ({stats.whatsappTotal} total)
          </p>
        </article>
      </div>

      {!isPro ? (
        <section className="jc-card p-4 bg-jc-primary-dark text-white border-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-wide text-jc-orange inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                ENTREPRISE PRO
              </p>
              <h2 className="text-base font-bold mt-1">
                Recrutez sans limite
              </h2>
              <p className="text-xs text-white/70 mt-1 max-w-xs">
                5 offres actives, profils illimités et contacts WhatsApp sans
                quota à 15 000 FCFA / mois.
              </p>
            </div>
            <Link
              href="/e/upgrade"
              className="shrink-0 rounded-full bg-jc-primary-green text-white text-xs font-semibold px-3 py-2 inline-flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              Passer Pro
            </Link>
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg md:text-xl font-bold">Dernières candidatures</h2>
          {stats.applicationsTotal > 5 ? (
            <Link
              href="/e/jobs"
              className="text-sm font-semibold text-jc-primary-green hover:underline"
            >
              Voir tout
            </Link>
          ) : null}
        </div>

        {recentApps.length === 0 ? (
          <div className="jc-card p-8 md:p-12 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-jc-light-green flex items-center justify-center mb-3">
              <Briefcase className="w-5 h-5 text-jc-primary-green" />
            </div>
            <h3 className="font-bold">Aucune candidature</h3>
            <p className="text-sm text-jc-text-secondary mt-1">
              Publiez votre première offre pour recevoir des candidatures.
            </p>
            <Link
              href="/e/jobs/new"
              className="mt-3 rounded-full bg-jc-primary-dark text-white text-sm font-semibold px-4 py-2 inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Nouvelle offre
            </Link>
          </div>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2 md:gap-3">
            {recentApps.map((a) => {
              const fullName = `${a.firstName} ${a.lastName}`;
              return (
                <li key={a.id}>
                  <Link
                    href={`/e/jobs/${a.jobId}`}
                    className="block jc-card p-3"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage
                          src={a.photoUrl ?? undefined}
                          alt={fullName}
                        />
                        <AvatarFallback>
                          {a.firstName[0]}
                          {a.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold leading-tight text-sm truncate">
                          {fullName}
                        </h3>
                        {a.profession ? (
                          <p className="text-xs text-jc-text-secondary mt-0.5 truncate">
                            {a.profession}
                          </p>
                        ) : null}
                        <p className="text-[11px] text-jc-text-muted mt-1 truncate">
                          {a.jobTitle} • {formatDate(a.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold tracking-wide px-2 py-1 rounded-full shrink-0 ${STATUS_STYLE[a.status]}`}
                      >
                        {STATUS_LABEL[a.status]}
                      </span>
                    </div>
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
