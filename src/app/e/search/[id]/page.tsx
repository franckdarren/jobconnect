import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireRole } from "@/lib/auth";
import {
  getCandidateProfile,
  hasUnlockedCandidateToday,
} from "@/features/candidates/queries";
import { checkEmployerProfileViewQuota } from "@/lib/quotas";
import { PremiumBadge } from "@/components/shared/PremiumBadge";
import { TrackedWhatsAppButton } from "@/components/shared/TrackedWhatsAppButton";
import { UnlockButton } from "./unlock-button";

const EXPERIENCE_LABEL = {
  beginner: "Débutant",
  "1_3": "1 à 3 ans",
  "3_5": "3 à 5 ans",
  "5_plus": "5 ans et +",
} as const;

const AVAILABILITY_LABEL = {
  immediate: "Disponible immédiatement",
  "15_days": "Disponible sous 15 jours",
  "30_days": "Disponible sous 30 jours",
} as const;

function maskLastName(lastName: string): string {
  const t = lastName.trim();
  return t ? `${t[0]}.` : "";
}

function formatRange(
  startDate: string | Date,
  endDate: string | Date | null,
  current: boolean,
): string {
  const f = (d: string | Date) =>
    new Date(d).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
  return `${f(startDate)} → ${current ? "Aujourd'hui" : endDate ? f(endDate) : "?"}`;
}

export default async function EmployerCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("employer");
  const { id } = await params;

  const data = await getCandidateProfile(id);
  if (!data) notFound();

  const [unlocked, viewQuota] = await Promise.all([
    hasUnlockedCandidateToday(user.id, id),
    checkEmployerProfileViewQuota(user.id),
  ]);

  const fullName = `${data.profile.firstName} ${data.profile.lastName}`;
  const maskedName = `${data.profile.firstName} ${maskLastName(data.profile.lastName)}`;
  const displayName = unlocked ? fullName : maskedName;

  return (
    <div className="space-y-4 md:space-y-6">
      <Link
        href="/e/search"
        className="inline-flex items-center gap-1 text-sm text-jc-text-secondary hover:text-jc-text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la recherche
      </Link>

      {/* Header card */}
      <article className="jc-card overflow-hidden">
        <div className="bg-jc-primary-dark text-white p-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <Avatar className="w-20 h-20 ring-4 ring-white/20">
                <AvatarImage
                  src={data.profile.photoUrl ?? undefined}
                  alt={displayName}
                />
                <AvatarFallback className="bg-jc-primary-green text-white text-xl">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {data.profile.isBoosted ? (
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-jc-orange text-white flex items-center justify-center">
                  <Star className="w-3 h-3" />
                </span>
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold leading-tight">{displayName}</h1>
                {data.isPremium && unlocked ? (
                  <PremiumBadge label="PREMIUM" variant="green" />
                ) : null}
              </div>
              {data.profile.profession ? (
                <p className="text-sm text-white/80 mt-1">
                  {data.profile.profession}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/70">
                {data.profile.city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {data.profile.city}
                  </span>
                ) : null}
                {data.profile.experienceLevel ? (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {EXPERIENCE_LABEL[data.profile.experienceLevel]}
                  </span>
                ) : null}
                {data.profile.availability ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {AVAILABILITY_LABEL[data.profile.availability]}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {!unlocked ? (
            <>
              <div className="rounded-xl bg-jc-background p-4 text-center">
                <p className="text-sm font-semibold text-jc-text-primary">
                  Détails verrouillés
                </p>
                <p className="text-xs text-jc-text-secondary mt-1">
                  Débloquez ce profil pour accéder aux coordonnées, à l&apos;historique
                  complet et au CV.
                </p>
              </div>
              {viewQuota.allowed ? (
                <UnlockButton
                  candidateId={id}
                  remaining={
                    viewQuota.limit === Infinity ? "unlimited" : viewQuota.remaining
                  }
                />
              ) : (
                <div className="rounded-xl bg-jc-warning/10 border border-jc-warning/20 p-4 text-center">
                  <p className="text-sm font-semibold text-jc-warning">
                    Quota atteint
                  </p>
                  <p className="text-xs text-jc-text-secondary mt-1">
                    Vous avez débloqué votre maximum de profils pour aujourd&apos;hui.
                    Passez à l&apos;offre Pro pour un accès illimité.
                  </p>
                  <Link
                    href="/e/upgrade"
                    className="inline-block mt-3 rounded-xl bg-jc-primary-green text-white px-4 py-2 text-sm font-semibold"
                  >
                    Passer en Pro
                  </Link>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {data.user?.phone ? (
                  <div className="flex items-center gap-2 rounded-xl bg-jc-background p-3">
                    <Phone className="w-4 h-4 text-jc-text-secondary shrink-0" />
                    <span className="font-medium">{data.user.phone}</span>
                  </div>
                ) : null}
                {data.user?.email ? (
                  <div className="flex items-center gap-2 rounded-xl bg-jc-background p-3">
                    <Mail className="w-4 h-4 text-jc-text-secondary shrink-0" />
                    <span className="font-medium break-all">
                      {data.user.email}
                    </span>
                  </div>
                ) : null}
              </div>

              {data.profile.whatsappPhone ? (
                <TrackedWhatsAppButton candidateId={id} />
              ) : null}
            </>
          )}
        </div>
      </article>

      {/* Summary */}
      {unlocked && data.profile.summary ? (
        <section className="jc-card p-4">
          <h2 className="text-sm font-bold text-jc-text-primary mb-2">
            À propos
          </h2>
          <p className="text-sm text-jc-text-secondary whitespace-pre-line">
            {data.profile.summary}
          </p>
        </section>
      ) : null}

      {/* Skills */}
      {data.skills.length > 0 ? (
        <section className="jc-card p-4">
          <h2 className="text-sm font-bold text-jc-text-primary mb-2 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-jc-primary-green" />
            Compétences
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-jc-light-green text-jc-primary-green text-xs font-semibold px-3 py-1"
              >
                {s.name}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* Experiences */}
      {unlocked && data.experiences.length > 0 ? (
        <section className="jc-card p-4">
          <h2 className="text-sm font-bold text-jc-text-primary mb-3 inline-flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-jc-primary-green" />
            Expériences
          </h2>
          <ul className="space-y-3">
            {data.experiences.map((e) => (
              <li
                key={e.id}
                className="border-l-2 border-jc-primary-green/30 pl-3"
              >
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="text-xs text-jc-text-secondary">
                  {e.company}
                  {e.city ? ` — ${e.city}` : ""}
                </p>
                <p className="text-[11px] text-jc-text-muted mt-0.5">
                  {formatRange(e.startDate, e.endDate, e.current)}
                </p>
                {e.description ? (
                  <p className="text-xs text-jc-text-secondary mt-1 whitespace-pre-line">
                    {e.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Educations */}
      {unlocked && data.educations.length > 0 ? (
        <section className="jc-card p-4">
          <h2 className="text-sm font-bold text-jc-text-primary mb-3 inline-flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-jc-primary-green" />
            Formations
          </h2>
          <ul className="space-y-3">
            {data.educations.map((e) => (
              <li
                key={e.id}
                className="border-l-2 border-jc-primary-green/30 pl-3"
              >
                <p className="text-sm font-semibold">{e.degree}</p>
                <p className="text-xs text-jc-text-secondary">{e.school}</p>
                {e.startYear || e.endYear ? (
                  <p className="text-[11px] text-jc-text-muted mt-0.5">
                    {e.startYear ?? "?"} → {e.endYear ?? "?"}
                  </p>
                ) : null}
                {e.description ? (
                  <p className="text-xs text-jc-text-secondary mt-1 whitespace-pre-line">
                    {e.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
