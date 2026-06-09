import {
  Users,
  Briefcase,
  Send,
  CreditCard,
  Banknote,
  TrendingUp,
} from "lucide-react";
import { getAdminGlobalStats } from "@/features/admin/queries";

function formatFcfa(n: number): string {
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

export default async function AdminDashboardPage() {
  const stats = await getAdminGlobalStats();

  const cards = [
    {
      label: "Utilisateurs",
      value: stats.users.total.toString(),
      hint: `${stats.users.candidates} candidats · ${stats.users.employers} employeurs · ${stats.users.suspended} suspendus`,
      icon: Users,
      color: "text-jc-primary-green",
    },
    {
      label: "Offres",
      value: stats.jobs.active.toString(),
      hint: `${stats.jobs.total} au total`,
      icon: Briefcase,
      color: "text-jc-orange",
    },
    {
      label: "Candidatures",
      value: stats.applications.thisMonth.toString(),
      hint: `ce mois (${stats.applications.total} total)`,
      icon: Send,
      color: "text-jc-primary-dark",
    },
    {
      label: "Abonnements actifs",
      value: stats.subscriptions.active.toString(),
      hint: "comptes payants en cours",
      icon: CreditCard,
      color: "text-jc-primary-green",
    },
    {
      label: "Revenu",
      value: formatFcfa(stats.revenue.thisMonthFcfa),
      hint: "ce mois",
      icon: TrendingUp,
      color: "text-jc-primary-green",
    },
    {
      label: "Revenu total",
      value: formatFcfa(stats.revenue.totalFcfa),
      hint: "depuis le démarrage",
      icon: Banknote,
      color: "text-jc-text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Vue d&apos;ensemble</h1>
        <p className="text-sm text-jc-text-secondary mt-1">
          KPIs globaux de la plateforme.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map(({ label, value, hint, icon: Icon, color }) => (
          <article key={label} className="jc-card p-5">
            <div className={`flex items-center gap-2 text-sm font-medium ${color}`}>
              <Icon className="w-4 h-4" />
              {label}
            </div>
            <p className="text-3xl font-bold mt-2 text-jc-text-primary">
              {value}
            </p>
            <p className="text-xs text-jc-text-muted mt-1">{hint}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
