import Link from "next/link";
import { CreditCard } from "lucide-react";
import { listAdminSubscriptions } from "@/features/admin/queries";

const PLAN_LABEL = {
  candidate_free: "Candidat Gratuit",
  candidate_premium: "Candidat Premium",
  employer_free: "Employeur Gratuit",
  employer_pro: "Employeur Pro",
} as const;

const STATUS_STYLE = {
  active: "bg-jc-light-green text-jc-primary-green",
  expired: "bg-jc-warning/10 text-jc-warning",
  cancelled: "bg-jc-background text-jc-text-secondary",
} as const;

const STATUS_LABEL = {
  active: "Active",
  expired: "Expirée",
  cancelled: "Annulée",
} as const;

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, pageSize } = await listAdminSubscriptions({ page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold inline-flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Abonnements
        </h1>
        <p className="text-sm text-jc-text-secondary mt-1">
          {total} abonnement{total > 1 ? "s" : ""} au total
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="jc-card p-8 text-center text-sm text-jc-text-secondary">
          Aucun abonnement.
        </div>
      ) : (
        <div className="jc-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-jc-text-secondary border-b border-black/5">
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Début</th>
                <th className="px-4 py-3">Expire</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-jc-text-primary">
                        {s.phone}
                      </span>
                      <span className="text-[11px] text-jc-text-muted break-all">
                        {s.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="rounded-full bg-jc-background px-2 py-0.5 font-semibold">
                      {PLAN_LABEL[s.plan]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_STYLE[s.status]}`}
                    >
                      {STATUS_LABEL[s.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-jc-text-muted">
                    {formatDate(s.startedAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-jc-text-muted">
                    {formatDate(s.expiresAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-3 pt-2">
          {page > 1 ? (
            <Link
              href={`/admin/subscriptions?page=${page - 1}`}
              className="rounded-full bg-jc-primary-dark text-white text-xs font-semibold px-4 py-1.5"
            >
              Précédent
            </Link>
          ) : null}
          <span className="text-xs text-jc-text-secondary">
            Page {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/admin/subscriptions?page=${page + 1}`}
              className="rounded-full bg-jc-primary-dark text-white text-xs font-semibold px-4 py-1.5"
            >
              Suivant
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
