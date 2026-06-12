import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getJobOfferById } from "@/features/jobs/queries";
import { hasAppliedToJob } from "@/features/applications/queries";
import { ApplyButton } from "./apply-button";

const TYPE_LABEL = {
  job: "Emploi",
  internship: "Stage",
  freelance: "Freelance",
} as const;

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("candidate");
  const { id } = await params;
  const data = await getJobOfferById(id);
  if (!data || data.job.status !== "active") notFound();

  const { job, missions, skills } = data;
  const alreadyApplied = await hasAppliedToJob(user.id, id);

  const applyAction = alreadyApplied ? (
    <button
      type="button"
      disabled
      className="w-full rounded-xl bg-jc-light-green text-jc-primary-green font-semibold py-3 text-sm border border-jc-primary-green/40"
    >
      ✓ Candidature envoyée
    </button>
  ) : data.employerWhatsapp ? (
    <ApplyButton
      jobId={job.id}
      jobTitle={job.title}
      employerWhatsapp={data.employerWhatsapp}
    />
  ) : (
    <button
      type="button"
      disabled
      className="w-full rounded-xl bg-jc-text-muted/30 text-white font-semibold py-3 text-sm"
    >
      Contact non disponible
    </button>
  );

  return (
    <div className="pb-24 md:pb-0">
      <header className="flex items-center gap-2 mb-3 md:hidden">
        <Link
          href="/c/jobs"
          className="p-1.5 -ml-1.5 text-jc-text-primary"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-bold text-lg">Détails de l'offre</span>
      </header>

      <Link
        href="/c/jobs"
        className="hidden md:inline-flex items-center gap-1 text-sm text-jc-text-secondary hover:text-jc-text-primary mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux offres
      </Link>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-2 space-y-4">
          <article className="jc-card overflow-hidden">
            {job.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={job.imageUrl}
                alt={job.title}
                className="w-full h-40 md:h-56 object-cover"
              />
            ) : (
              <div className="w-full h-40 md:h-56 bg-jc-primary-dark/95 flex items-center justify-center">
                <Briefcase className="w-10 h-10 text-white/30" />
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-jc-background overflow-hidden flex items-center justify-center shrink-0">
                  {data.employerLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.employerLogo}
                      alt={data.employerName ?? ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-jc-text-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold leading-tight">
                    {job.title}
                  </h1>
                  <p className="text-sm text-jc-text-secondary mt-0.5">
                    {data.employerName ?? "Entreprise"}
                    {data.employerVerified ? (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-jc-primary-green">
                        <ShieldCheck className="w-3 h-3" />
                        Vérifiée
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-jc-text-secondary">
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {TYPE_LABEL[job.type]}
                </span>
                {job.city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {job.city}
                  </span>
                ) : null}
                {job.salaryLabel ? (
                  <span className="inline-flex items-center gap-1 text-jc-primary-green font-semibold">
                    {job.salaryLabel}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(job.publishedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {data.applicationsCount} postulant
                  {data.applicationsCount > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </article>

          <section className="mt-4">
            <h2 className="text-lg md:text-xl font-bold mb-2">Description du poste</h2>
            <p className="text-sm text-jc-text-secondary whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </section>

          {skills.length > 0 ? (
            <section className="mt-4">
              <h2 className="text-lg md:text-xl font-bold mb-2">Compétences requises</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full bg-jc-light-green text-jc-primary-green text-xs font-medium px-3 py-1.5"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {missions.length > 0 ? (
            <section className="mt-4">
              <h2 className="text-lg md:text-xl font-bold mb-2">Missions</h2>
              <ul className="space-y-2">
                {missions.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-start gap-2 text-sm text-jc-text-secondary"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-jc-primary-green shrink-0" />
                    {m.text}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.employerDescription ? (
            <section className="mt-4 jc-card p-4">
              <h2 className="text-base font-bold mb-1">À propos de l&apos;entreprise</h2>
              <p className="text-sm text-jc-text-secondary leading-relaxed">
                {data.employerDescription}
              </p>
            </section>
          ) : null}
        </div>

        {/* Sidebar apply — desktop only */}
        <aside className="hidden md:block md:col-span-1">
          <div className="sticky top-6 jc-card p-5 space-y-3">
            <h3 className="font-bold text-base">Postuler à cette offre</h3>
            <p className="text-xs text-jc-text-secondary">
              Votre candidature sera transmise directement à l&apos;employeur.
            </p>
            {applyAction}
          </div>
        </aside>
      </div>

      {/* Postuler — bouton ancré en bas (mobile only) */}
      <div className="md:hidden fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0))] inset-x-0 z-30 max-w-md mx-auto px-4">
        {applyAction}
      </div>
    </div>
  );
}
