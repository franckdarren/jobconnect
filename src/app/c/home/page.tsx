import Link from "next/link";
import { Eye, Send, Sparkles, Briefcase, Banknote, GraduationCap, Hammer, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getCandidateProfile, getCandidateProfileViewStats } from "@/features/candidates/queries";
import { getCandidateApplicationStats } from "@/features/applications/queries";
import { recommendJobOffers } from "@/features/jobs/recommendations";
import { HeroCard } from "@/components/shared/HeroCard";
import { PremiumBadge } from "@/components/shared/PremiumBadge";

export default async function CandidateHomePage() {
  const user = await requireRole("candidate");
  const [data, viewStats, appStats, recentJobs] = await Promise.all([
    getCandidateProfile(user.id),
    getCandidateProfileViewStats(user.id),
    getCandidateApplicationStats(user.id),
    recommendJobOffers(user.id, { limit: 4 }),
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
          <ul className="grid gap-3 md:grid-cols-2">
            {recentJobs.map((job) => {
              const TypeIcon =
                job.type === "internship"
                  ? GraduationCap
                  : job.type === "freelance"
                    ? Hammer
                    : Briefcase;
              const typeLabel =
                job.type === "internship"
                  ? "Stage"
                  : job.type === "freelance"
                    ? "Freelance"
                    : "Emploi";
              return (
                <li key={job.id}>
                  <Link
                    href={`/c/jobs/${job.id}`}
                    className="jc-card block p-4 hover:shadow-md active:scale-[0.99] transition-all"
                  >
                    <div className="flex gap-3">
                      <div className="shrink-0 w-12 h-12 rounded-xl bg-jc-background flex items-center justify-center overflow-hidden">
                        {job.companyLogoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={job.companyLogoUrl}
                            alt={job.companyName ?? "Entreprise"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Briefcase className="w-5 h-5 text-jc-text-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-jc-text-primary leading-tight line-clamp-2">
                          {job.title}
                        </h3>
                        <p className="text-xs text-jc-text-secondary mt-1 truncate">
                          {job.companyName ?? "Entreprise"}
                          {job.city ? ` • ${job.city}` : null}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-jc-light-green text-jc-primary-green text-[11px] font-semibold px-2 py-1">
                        <TypeIcon className="w-3 h-3" />
                        {typeLabel}
                      </span>
                      {job.matchedSkills > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-jc-primary-dark text-white text-[11px] font-semibold px-2 py-1">
                          <Target className="w-3 h-3" />
                          {job.matchedSkills} compétence{job.matchedSkills > 1 ? "s" : ""} en commun
                        </span>
                      ) : null}
                      {job.salaryLabel ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-jc-text-primary">
                          <Banknote className="w-3.5 h-3.5 text-jc-primary-green" />
                          {job.salaryLabel}
                        </span>
                      ) : null}
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
