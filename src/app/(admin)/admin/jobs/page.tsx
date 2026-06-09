import Link from "next/link";
import { Briefcase, Search } from "lucide-react";
import { listAdminJobs } from "@/features/admin/queries";
import { DeleteJobButton } from "./delete-button";

const STATUS_LABEL = {
  active: "Active",
  closed: "Fermée",
  expired: "Expirée",
} as const;

const STATUS_STYLE = {
  active: "bg-jc-light-green text-jc-primary-green",
  closed: "bg-jc-background text-jc-text-secondary",
  expired: "bg-jc-warning/10 text-jc-warning",
} as const;

const TYPE_LABEL = {
  job: "Emploi",
  internship: "Stage",
  freelance: "Freelance",
} as const;

const STATUS_TABS: {
  value: "all" | "active" | "closed" | "expired";
  label: string;
}[] = [
  { value: "all", label: "Toutes" },
  { value: "active", label: "Actives" },
  { value: "closed", label: "Fermées" },
  { value: "expired", label: "Expirées" },
];

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildPageUrl(
  base: string,
  current: { q?: string; status?: string; page?: string },
  override: Partial<{ q: string; status: string; page: number }>,
) {
  const params = new URLSearchParams();
  const q = override.q ?? current.q;
  const status = override.status ?? current.status;
  const page = override.page ?? Number(current.page) ?? 1;
  if (q) params.set("q", q);
  if (status && status !== "all") params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  return `${base}${params.size ? `?${params.toString()}` : ""}`;
}

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const validStatus = (["active", "closed", "expired"] as const).includes(
    sp.status as "active" | "closed" | "expired",
  )
    ? (sp.status as "active" | "closed" | "expired")
    : undefined;

  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, pageSize } = await listAdminJobs({
    q: sp.q,
    status: validStatus,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold inline-flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Offres d&apos;emploi
        </h1>
        <p className="text-sm text-jc-text-secondary mt-1">
          {total} offre{total > 1 ? "s" : ""} au total
        </p>
      </header>

      <form className="jc-card p-3 flex items-center gap-2" action="/admin/jobs">
        <Search className="w-4 h-4 text-jc-text-muted shrink-0 ml-1" />
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Titre, ville, entreprise..."
          className="flex-1 min-w-0 bg-transparent outline-none text-sm"
        />
        {sp.status ? (
          <input type="hidden" name="status" value={sp.status} />
        ) : null}
        <button
          type="submit"
          className="rounded-lg bg-jc-primary-dark text-white text-xs font-semibold px-3 py-2"
        >
          Chercher
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => {
          const active = (validStatus ?? "all") === t.value;
          return (
            <Link
              key={t.value}
              href={buildPageUrl("/admin/jobs", sp, {
                status: t.value,
                page: 1,
              })}
              className={`shrink-0 rounded-full px-4 h-9 inline-flex items-center text-sm font-semibold transition-colors ${
                active
                  ? "bg-jc-primary-dark text-white"
                  : "bg-white border border-black/[0.06] text-jc-text-secondary"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="jc-card p-8 text-center text-sm text-jc-text-secondary">
          Aucune offre ne correspond à votre recherche.
        </div>
      ) : (
        <div className="jc-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-jc-text-secondary border-b border-black/5">
                <th className="px-4 py-3">Offre</th>
                <th className="px-4 py-3">Entreprise</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Publiée</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-jc-text-primary">
                        {j.title}
                      </span>
                      <span className="text-xs text-jc-text-muted">
                        {j.city ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex flex-col">
                      <span className="text-jc-text-primary font-medium">
                        {j.companyName ?? "—"}
                      </span>
                      {j.isVerified ? (
                        <span className="text-[10px] text-jc-primary-green font-semibold">
                          ✓ Vérifié
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="rounded-full bg-jc-background px-2 py-0.5 font-semibold">
                      {TYPE_LABEL[j.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_STYLE[j.status]}`}
                    >
                      {STATUS_LABEL[j.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-jc-text-muted">
                    {formatDate(j.publishedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteJobButton jobId={j.id} />
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
              href={buildPageUrl("/admin/jobs", sp, { page: page - 1 })}
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
              href={buildPageUrl("/admin/jobs", sp, { page: page + 1 })}
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
