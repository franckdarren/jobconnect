import Link from "next/link";
import { Eye, Send, Sparkles, Briefcase, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getCandidateProfile, getCandidateProfileViewStats } from "@/features/candidates/queries";
import { getCandidateApplicationStats } from "@/features/applications/queries";
import { listActiveJobOffers } from "@/features/jobs/queries";
import { HeroCard } from "@/components/shared/HeroCard";
import { PremiumBadge } from "@/components/shared/PremiumBadge";

export default async function CandidateHomePage() {
  const user = await requireRole("candidate");
  const [data, viewStats, appStats, { rows: recentJobs }] = await Promise.all([
    getCandidateProfile(user.id),
    getCandidateProfileViewStats(user.id),
    getCandidateApplicationStats(user.id),
    listActiveJobOffers(user.id, { pageSize: 4 }),
  ]);
  const firstName = data?.profile.firstName ?? "";

  return (
    <div className="space-y-4 md:space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">
          Bonjour, {firstName || "à vous"}&nbsp;!
        </h1>
        <p className="text-sm md:text-base text-jc-text-secondary mt-1">
          Prêt pour votre prochaine étape professionnelle aujourd&apos;hui ?
        </p>
      </header>

      <HeroCard
        title="Débloquez les contacts directs"
        subtitle="Accédez aux numéros WhatsApp des recruteurs et boostez votre visibilité de 3x."
        badge={<PremiumBadge label="OFFRE PRIVILÈGE" />}
      >
        <Button
          asChild
          className="bg-jc-primary-green hover:bg-jc-primary-green/90 text-white font-semibold rounded-xl px-4 h-10"
        >
          <Link href="/c/upgrade">
            <Sparkles className="w-4 h-4 mr-1.5" />
            Passer en Premium
          </Link>
        </Button>
      </HeroCard>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <article className="jc-card p-4">
          <div className="flex items-center gap-2 text-sm text-jc-primary-green font-medium">
            <Eye className="w-4 h-4" />
            Vues du profil
          </div>
          <p className="text-3xl font-bold mt-1">{viewStats.total}</p>
        </article>
        <article className="jc-card p-4">
          <div className="flex items-center gap-2 text-sm text-jc-orange font-medium">
            <Send className="w-4 h-4" />
            Candidatures
          </div>
          <p className="text-3xl font-bold mt-1">{appStats.total}</p>
        </article>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg md:text-xl font-bold">Recommandés pour vous</h2>
          <Link
            href="/c/jobs"
            className="text-sm font-semibold text-jc-primary-green hover:underline"
          >
            Voir tout
          </Link>
        </div>
        {recentJobs.length === 0 ? (
          <div className="jc-card p-6 md:p-10 text-center text-sm text-jc-text-muted">
            Aucune offre disponible pour l&apos;instant.
          </div>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                href={`/c/jobs/${job.id}`}
                className="jc-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-jc-light-green flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-jc-primary-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{job.title}</p>
                  <div className="flex items-center gap-1 text-xs text-jc-text-muted mt-0.5">
                    {job.city ? (
                      <>
                        <MapPin className="w-3 h-3" />
                        <span>{job.city}</span>
                        <span className="mx-1">·</span>
                      </>
                    ) : null}
                    <span>{job.companyName ?? "Entreprise"}</span>
                  </div>
                </div>
                {job.salaryLabel ? (
                  <span className="text-xs font-semibold text-jc-primary-green shrink-0">
                    {job.salaryLabel}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
