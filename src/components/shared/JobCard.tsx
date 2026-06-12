import Link from "next/link";
import { Briefcase, MapPin, Banknote, Clock, Hammer, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type JobCardJob = {
  id: string;
  title: string;
  company: string;
  city?: string | null;
  type: "job" | "internship" | "freelance";
  contractLabel?: string;
  salaryLabel?: string | null;
  logoUrl?: string | null;
  publishedLabel?: string;
  applicantsLabel?: string;
};

const typeIcon = {
  job: Briefcase,
  internship: GraduationCap,
  freelance: Hammer,
};

const typeLabel = {
  job: "Emploi",
  internship: "Stage",
  freelance: "Freelance",
};

export function JobCard({
  job,
  className,
  variant = "default",
}: {
  job: JobCardJob;
  className?: string;
  variant?: "default" | "premium";
}) {
  const Icon = typeIcon[job.type];
  return (
    <article className={cn("jc-card overflow-hidden", className)}>
      <div className="p-4 flex gap-3">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-jc-background flex items-center justify-center overflow-hidden">
          {job.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={job.logoUrl}
              alt={job.company}
              className="w-full h-full object-cover"
            />
          ) : (
            <Briefcase className="w-5 h-5 text-jc-text-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-jc-text-primary leading-tight truncate">
            {job.title}
          </h3>
          <p className="text-sm text-jc-text-secondary mt-0.5 truncate">
            {job.company}
            {job.city ? ` • ${job.city}` : null}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-jc-text-secondary">
            <span className="inline-flex items-center gap-1">
              <Icon className="w-3.5 h-3.5" />
              {job.contractLabel ?? typeLabel[job.type]}
            </span>
            {job.salaryLabel ? (
              <span className="inline-flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5" />
                {job.salaryLabel}
              </span>
            ) : null}
            {!job.salaryLabel && job.city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.city}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="border-t border-black/[0.04] px-4 py-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs text-jc-text-muted">
          <Clock className="w-3.5 h-3.5" />
          {job.publishedLabel ?? "Récent"}
        </span>
        <Button
          asChild
          size="sm"
          variant={variant === "premium" ? "default" : "outline"}
          className={cn(
            variant === "premium" &&
              "bg-jc-primary-green hover:bg-jc-primary-green/90 text-white border-transparent",
          )}
        >
          <Link href={`/c/jobs/${job.id}`}>Voir détails</Link>
        </Button>
      </div>
    </article>
  );
}
