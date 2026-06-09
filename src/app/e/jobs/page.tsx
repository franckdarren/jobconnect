import Link from "next/link";
import { Briefcase, Plus, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { listOwnJobOffers } from "@/features/jobs/queries";

const TYPE_LABEL = {
  job: "Emploi",
  internship: "Stage",
  freelance: "Freelance",
} as const;

const STATUS_STYLE = {
  active: "bg-jc-light-green text-jc-primary-green",
  closed: "bg-jc-text-secondary/10 text-jc-text-secondary",
  expired: "bg-jc-orange/10 text-jc-orange",
} as const;

const STATUS_LABEL = {
  active: "Active",
  closed: "Clôturée",
  expired: "Expirée",
} as const;

export default async function EmployerJobsPage() {
  const user = await requireRole("employer");
  const offers = await listOwnJobOffers(user.id);

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mes offres</h1>
          <p className="text-sm text-jc-text-secondary mt-0.5">
            {offers.length} offre{offers.length > 1 ? "s" : ""} publiée
            {offers.length > 1 ? "s" : ""}.
          </p>
        </div>
        <Button
          asChild
          className="rounded-full bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white"
        >
          <Link href="/e/jobs/new">
            <Plus className="w-4 h-4 mr-1" />
            Nouvelle offre
          </Link>
        </Button>
      </header>

      {offers.length === 0 ? (
        <div className="jc-card p-8 md:p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-jc-light-green flex items-center justify-center mb-3">
            <Briefcase className="w-5 h-5 text-jc-primary-green" />
          </div>
          <h2 className="font-bold">Aucune offre pour l&apos;instant</h2>
          <p className="text-sm text-jc-text-secondary mt-1 max-w-xs">
            Publiez votre première offre pour commencer à recevoir des candidatures.
          </p>
          <Button
            asChild
            className="mt-4 rounded-full bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white"
          >
            <Link href="/e/jobs/new">
              <Plus className="w-4 h-4 mr-1" />
              Publier une offre
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <li key={o.id}>
              <Link
                href={`/e/jobs/${o.id}`}
                className="block jc-card p-4 hover:border-jc-primary-green/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold leading-tight">{o.title}</h2>
                    <p className="text-xs text-jc-text-secondary mt-1">
                      {TYPE_LABEL[o.type]}
                      {o.city ? ` • ${o.city}` : null}
                      {o.salaryLabel ? ` • ${o.salaryLabel}` : null}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-bold tracking-wide px-2 py-1 rounded-full ${STATUS_STYLE[o.status]}`}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs text-jc-text-secondary">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {o.applicationsCount} candidat
                    {o.applicationsCount > 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(o.publishedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
