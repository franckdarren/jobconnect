import Link from "next/link";
import { Sparkles, Send, Eye, Plus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getEmployerProfile, getEmployerStats } from "@/features/employers/queries";
import { getJobOffersByEmployer } from "@/features/jobs/queries";
import { HeroCard } from "@/components/shared/HeroCard";
import { PremiumBadge } from "@/components/shared/PremiumBadge";

export default async function EmployerHomePage() {
  const user = await requireRole("employer");
  const [data, stats, recentJobs] = await Promise.all([
    getEmployerProfile(user.id),
    getEmployerStats(user.id),
    getJobOffersByEmployer(user.id, 3),
  ]);
  const companyName = data?.profile.companyName ?? "";

  return (
    <div className="space-y-4 md:space-y-6">
      <HeroCard
        title={`Bonjour, ${companyName || "à vous"} !`}
        subtitle="Découvrer des talents qualifiés pour faire avancer votre entreprise."
        badge={<PremiumBadge label="COMPTE PREMIUM" variant="green" />}
      >
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-2xl font-bold leading-none">∞</p>
            <p className="text-[11px] text-white/70 mt-1">Candidatures illimitées</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-2xl font-bold leading-none">{stats.profileViewsToday}</p>
            <p className="text-[11px] text-white/70 mt-1">Vues profil (24h)</p>
          </div>
        </div>
      </HeroCard>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Link
          href="/e/jobs"
          className="jc-card p-4 hover:shadow-md active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2 text-sm text-jc-primary-green font-medium">
            <Eye className="w-4 h-4" />
            Offres actives
          </div>
          <p className="text-3xl font-bold mt-1">{stats.activeJobs}</p>
        </Link>
        <Link
          href="/e/dashboard"
          className="jc-card p-4 hover:shadow-md active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2 text-sm text-jc-orange font-medium">
            <Send className="w-4 h-4" />
            Candidatures reçues
          </div>
          <p className="text-3xl font-bold mt-1">{stats.applicationsTotal}</p>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg md:text-xl font-bold">Mes offres actives</h2>
            <Link
              href="/e/jobs"
              className="text-sm font-semibold text-jc-primary-green hover:underline"
            >
              Voir tout
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="jc-card p-6 text-center space-y-3">
              <Sparkles className="w-5 h-5 mx-auto text-jc-text-muted" />
              <p className="text-sm text-jc-text-muted">Aucune offre publiée pour l&apos;instant.</p>
              <Button
                asChild
                size="sm"
                className="rounded-full bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white"
              >
                <Link href="/e/jobs/new">
                  <Plus className="w-3 h-3 mr-1" />
                  Publier une offre
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/e/jobs/${job.id}`}
                  className="jc-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="w-8 h-8 rounded-lg bg-jc-light-green flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-jc-primary-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{job.title}</p>
                    <p className="text-xs text-jc-text-muted capitalize">{job.type}</p>
                  </div>
                </Link>
              ))}
              <Button
                asChild
                size="sm"
                variant="outline"
                className="w-full rounded-xl mt-1"
              >
                <Link href="/e/jobs/new">
                  <Plus className="w-3 h-3 mr-1" />
                  Nouvelle offre
                </Link>
              </Button>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg md:text-xl font-bold">Dernières candidatures</h2>
            <Link
              href="/e/dashboard"
              className="text-sm font-semibold text-jc-primary-green hover:underline"
            >
              Voir tout
            </Link>
          </div>
          <div className="jc-card p-6 text-center text-sm text-jc-text-muted">
            <Sparkles className="w-5 h-5 mx-auto mb-2 text-jc-text-muted" />
            Aucunes candidatures pour l&apos;instant.
          </div>
        </section>
      </div>
    </div>
  );
}
