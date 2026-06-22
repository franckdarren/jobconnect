import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileCompleteness } from "@/features/candidates/completeness";

type ProfileCompletenessCardProps = {
  completeness: ProfileCompleteness;
  /**
   * `full` : carte détaillée (liste des éléments manquants) — page profil & dashboard.
   * `compact` : bandeau resserré (barre + CTA) — home. Ne s'affiche pas si profil complet.
   */
  variant?: "full" | "compact";
  /** Nombre max d'éléments manquants listés en variante `full`. */
  maxItems?: number;
  className?: string;
};

function ProgressBar({ percent }: { percent: number }) {
  const reached = percent >= 100;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-jc-background"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Complétude du profil"
    >
      <div
        className={cn(
          "h-full rounded-full transition-all",
          reached ? "bg-jc-primary-green" : "bg-jc-accent-green",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function ProfileCompletenessCard({
  completeness,
  variant = "full",
  maxItems = 4,
  className,
}: ProfileCompletenessCardProps) {
  const { percent, missing, isComplete } = completeness;

  // En variante compacte (home), un profil complet n'a pas besoin de rappel.
  if (isComplete && variant === "compact") return null;

  if (isComplete) {
    return (
      <section className={cn("jc-card p-4 flex items-center gap-3", className)}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-jc-light-green">
          <UserCheck className="h-5 w-5 text-jc-primary-green" />
        </div>
        <div>
          <p className="text-sm font-bold text-jc-text-primary">
            Profil complet à 100&nbsp;%
          </p>
          <p className="text-xs text-jc-text-secondary">
            Vous mettez toutes les chances de votre côté auprès des recruteurs.
          </p>
        </div>
      </section>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        href="/c/profile"
        className={cn(
          "jc-card flex items-center gap-3 p-4 transition-colors hover:bg-jc-light-green/40",
          className,
        )}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-jc-text-primary">
            Complétez votre profil ({percent}&nbsp;%)
          </p>
          <p className="mb-2 text-xs text-jc-text-secondary">
            Un profil complet attire plus de recruteurs.
          </p>
          <ProgressBar percent={percent} />
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-jc-primary-green" />
      </Link>
    );
  }

  const shown = missing.slice(0, maxItems);
  const remaining = missing.length - shown.length;

  return (
    <section className={cn("jc-card p-4 md:p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-jc-text-primary">
          Complétez votre profil
        </h2>
        <span className="text-sm font-bold text-jc-primary-green">
          {percent}&nbsp;%
        </span>
      </div>

      <div className="mt-2">
        <ProgressBar percent={percent} />
      </div>

      <p className="mt-3 text-xs text-jc-text-secondary">
        Plus votre profil est complet, plus vous augmentez vos chances d&apos;être
        contacté par les recruteurs.
      </p>

      <ul className="mt-3 space-y-1.5">
        {shown.map((item) => (
          <li
            key={item.key}
            className="flex items-center gap-2 text-sm text-jc-text-primary"
          >
            <Circle className="h-4 w-4 shrink-0 text-jc-text-muted" />
            {item.label}
          </li>
        ))}
        {remaining > 0 ? (
          <li className="flex items-center gap-2 text-xs text-jc-text-muted">
            <CheckCircle2 className="h-4 w-4 shrink-0 opacity-0" />+ {remaining}{" "}
            autre{remaining > 1 ? "s" : ""} élément{remaining > 1 ? "s" : ""}
          </li>
        ) : null}
      </ul>

      <Link
        href="/c/profile"
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-jc-primary-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jc-primary-green/90"
      >
        Compléter mon profil
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
