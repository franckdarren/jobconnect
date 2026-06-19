import { Receipt } from "lucide-react";
import { listAdminPayments } from "@/features/admin/queries";
import { FilterTabs, PagerLink } from "../filter-link";

const PLAN_LABEL = {
  candidate_free: "Candidat Gratuit",
  candidate_premium: "Candidat Premium",
  employer_free: "Employeur Gratuit",
  employer_pro: "Employeur Pro",
} as const;

const PLAN_STYLE = {
  candidate_premium: "bg-jc-light-green text-jc-primary-green",
  employer_pro: "bg-jc-light-green text-jc-primary-green",
  candidate_free:
    "bg-jc-card text-jc-text-secondary border border-jc-text-muted/30",
  employer_free:
    "bg-jc-card text-jc-text-secondary border border-jc-text-muted/30",
} as const;

const STATUS_STYLE = {
  pending: "bg-jc-orange/10 text-jc-orange",
  success: "bg-jc-light-green text-jc-primary-green",
  failed: "bg-jc-warning/10 text-jc-warning",
} as const;

const STATUS_LABEL = {
  pending: "En attente",
  success: "Succès",
  failed: "Échec",
} as const;

const OPERATOR_LABEL = {
  airtel_money: "Airtel",
  moov_money: "Moov",
} as const;

const STATUS_TABS: {
  value: "all" | "pending" | "success" | "failed";
  label: string;
}[] = [
  { value: "all", label: "Tous" },
  { value: "success", label: "Succès" },
  { value: "pending", label: "En attente" },
  { value: "failed", label: "Échecs" },
];

function formatDateTime(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildPageUrl(
  current: { status?: string; page?: string },
  override: Partial<{ status: string; page: number }>,
) {
  const params = new URLSearchParams();
  const status = override.status ?? current.status;
  const page = override.page ?? Number(current.page) ?? 1;
  if (status && status !== "all") params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  return `/admin/payments${params.size ? `?${params.toString()}` : ""}`;
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const validStatus = (["pending", "success", "failed"] as const).includes(
    sp.status as "pending" | "success" | "failed",
  )
    ? (sp.status as "pending" | "success" | "failed")
    : undefined;

  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, pageSize } = await listAdminPayments({
    status: validStatus,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold inline-flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Paiements
        </h1>
        <p className="text-sm text-jc-text-secondary mt-1">
          {total} transaction{total > 1 ? "s" : ""} au total
        </p>
      </header>

      <FilterTabs
        active={validStatus ?? "all"}
        tabs={STATUS_TABS.map((t) => ({
          value: t.value,
          label: t.label,
          href: buildPageUrl(sp, { status: t.value, page: 1 }),
        }))}
      />

      {rows.length === 0 ? (
        <div className="jc-card p-8 text-center text-sm text-jc-text-secondary">
          Aucune transaction.
        </div>
      ) : (
        <div className="jc-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-jc-text-secondary border-b border-black/5">
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Opérateur</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Initié</th>
                <th className="px-4 py-3">Confirmé</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <span
                      className="block max-w-[160px] truncate font-mono text-[11px] text-jc-text-secondary"
                      title={p.merchantRef ?? undefined}
                    >
                      {p.merchantRef ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-jc-text-primary font-medium text-xs">
                        {p.userPhone}
                      </span>
                      <span className="text-[11px] text-jc-text-muted break-all">
                        {p.userEmail}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 font-semibold ${PLAN_STYLE[p.plan]}`}
                    >
                      {PLAN_LABEL[p.plan]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {p.operator ? OPERATOR_LABEL[p.operator] : "—"}
                    {p.phone ? (
                      <p className="text-[10px] text-jc-text-muted">{p.phone}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-jc-text-primary">
                    {p.amount.toLocaleString("fr-FR")} F
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_STYLE[p.status]}`}
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-jc-text-muted whitespace-nowrap">
                    {formatDateTime(p.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-jc-text-muted whitespace-nowrap">
                    {formatDateTime(p.completedAt)}
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
            <PagerLink href={buildPageUrl(sp, { page: page - 1 })}>
              Précédent
            </PagerLink>
          ) : null}
          <span className="text-xs text-jc-text-secondary">
            Page {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <PagerLink href={buildPageUrl(sp, { page: page + 1 })}>
              Suivant
            </PagerLink>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
