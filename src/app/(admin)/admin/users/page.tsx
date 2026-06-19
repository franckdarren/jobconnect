import { Search, Users } from "lucide-react";
import { listAdminUsers } from "@/features/admin/queries";
import { UserActions } from "./user-actions";
import { FilterTabs, PagerLink } from "../filter-link";

const ROLE_LABEL = {
  candidate: "Candidat",
  employer: "Employeur",
  admin: "Admin",
} as const;

const ROLE_TABS: { value: "all" | "candidate" | "employer" | "admin"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "candidate", label: "Candidats" },
  { value: "employer", label: "Employeurs" },
  { value: "admin", label: "Admins" },
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
  current: { q?: string; role?: string; page?: string },
  override: Partial<{ q: string; role: string; page: number }>,
) {
  const params = new URLSearchParams();
  const q = override.q ?? current.q;
  const role = override.role ?? current.role;
  const page = override.page ?? Number(current.page) ?? 1;
  if (q) params.set("q", q);
  if (role && role !== "all") params.set("role", role);
  if (page && page > 1) params.set("page", String(page));
  return `${base}${params.size ? `?${params.toString()}` : ""}`;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const validRole = (
    ["candidate", "employer", "admin"] as const
  ).includes(sp.role as "candidate" | "employer" | "admin")
    ? (sp.role as "candidate" | "employer" | "admin")
    : undefined;

  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, pageSize } = await listAdminUsers({
    q: sp.q,
    role: validRole,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold inline-flex items-center gap-2">
          <Users className="w-5 h-5" />
          Utilisateurs
        </h1>
        <p className="text-sm text-jc-text-secondary mt-1">
          {total} utilisateur{total > 1 ? "s" : ""} au total
        </p>
      </header>

      <form className="jc-card p-3 flex items-center gap-2" action="/admin/users">
        <Search className="w-4 h-4 text-jc-text-muted shrink-0 ml-1" />
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Téléphone, email, nom, entreprise..."
          className="flex-1 min-w-0 bg-transparent outline-none text-sm"
        />
        {sp.role ? (
          <input type="hidden" name="role" value={sp.role} />
        ) : null}
        <button
          type="submit"
          className="rounded-lg bg-jc-primary-dark text-white text-xs font-semibold px-3 py-2"
        >
          Chercher
        </button>
      </form>

      <FilterTabs
        active={validRole ?? "all"}
        tabs={ROLE_TABS.map((t) => ({
          value: t.value,
          label: t.label,
          href: buildPageUrl("/admin/users", sp, { role: t.value, page: 1 }),
        }))}
      />

      {rows.length === 0 ? (
        <div className="jc-card p-8 text-center text-sm text-jc-text-secondary">
          Aucun utilisateur ne correspond à votre recherche.
        </div>
      ) : (
        <div className="jc-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-jc-text-secondary border-b border-black/5">
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Inscrit le</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const displayName =
                  u.role === "candidate"
                    ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—"
                    : u.role === "employer"
                    ? u.companyName ?? "—"
                    : "Administrateur";
                return (
                  <tr
                    key={u.id}
                    className="border-b border-black/5 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-jc-text-primary">
                          {displayName}
                        </span>
                        <span className="text-xs text-jc-text-secondary">
                          {u.phone}
                        </span>
                        <span className="text-[11px] text-jc-text-muted break-all">
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="rounded-full bg-jc-background px-2 py-0.5 font-semibold">
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold w-fit ${
                            u.isActive
                              ? "bg-jc-light-green text-jc-primary-green"
                              : "bg-jc-warning/10 text-jc-warning"
                          }`}
                        >
                          {u.isActive ? "Actif" : "Suspendu"}
                        </span>
                        {u.role === "employer" && u.isVerified ? (
                          <span className="rounded-full bg-jc-primary-green/10 text-jc-primary-green text-[10px] font-semibold px-2 py-0.5 w-fit">
                            ✓ Vérifié
                          </span>
                        ) : null}
                        {u.role === "candidate" && u.isBoosted ? (
                          <span className="rounded-full bg-jc-orange/10 text-jc-orange text-[10px] font-semibold px-2 py-0.5 w-fit">
                            ★ Boosté
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-jc-text-muted">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <UserActions
                        userId={u.id}
                        role={u.role}
                        isActive={u.isActive}
                        isVerified={u.isVerified}
                        isBoosted={u.isBoosted}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-3 pt-2">
          {page > 1 ? (
            <PagerLink href={buildPageUrl("/admin/users", sp, { page: page - 1 })}>
              Précédent
            </PagerLink>
          ) : null}
          <span className="text-xs text-jc-text-secondary">
            Page {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <PagerLink href={buildPageUrl("/admin/users", sp, { page: page + 1 })}>
              Suivant
            </PagerLink>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
