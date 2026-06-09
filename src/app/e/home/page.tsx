import Link from "next/link";
import { Sparkles, Send, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getEmployerProfile } from "@/features/employers/queries";
import { HeroCard } from "@/components/shared/HeroCard";
import { PremiumBadge } from "@/components/shared/PremiumBadge";

export default async function EmployerHomePage() {
  const user = await requireRole("employer");
  const data = await getEmployerProfile(user.id);
  const companyName = data?.profile.companyName ?? "";

  return (
    <div className="space-y-4">
      <HeroCard
        title={`Bonjour, ${companyName || "à vous"} !`}
        subtitle="Découvrer des talents qualifiés pour faire avancer votre entreprise."
        badge={<PremiumBadge label="COMPTE PREMIUM" variant="green" />}
      >
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-2xl font-bold leading-none">∞</p>
            <p className="text-[11px] text-white/70 mt-1">Candidatures illimitées</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-2xl font-bold leading-none">0</p>
            <p className="text-[11px] text-white/70 mt-1">Vues profil (24h)</p>
          </div>
        </div>
      </HeroCard>

      <div className="grid grid-cols-2 gap-3">
        <article className="jc-card p-4">
          <div className="flex items-center gap-2 text-sm text-jc-primary-green font-medium">
            <Eye className="w-4 h-4" />
            Offres actives
          </div>
          <p className="text-3xl font-bold mt-1">0</p>
        </article>
        <article className="jc-card p-4">
          <div className="flex items-center gap-2 text-sm text-jc-orange font-medium">
            <Send className="w-4 h-4" />
            Candidatures reçues
          </div>
          <p className="text-3xl font-bold mt-1">0</p>
        </article>
      </div>

      <section className="jc-card p-5 space-y-3">
        <div>
          <h2 className="text-base font-bold">Publier votre 1ʳᵉ offre</h2>
          <p className="text-xs text-jc-text-secondary mt-0.5">
            Touchez des candidats vérifiés en quelques minutes.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="w-full rounded-full bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white"
        >
          <Link href="/e/jobs/new">
            <Plus className="w-3 h-3 mr-1" />
            Nouvelle offre
          </Link>
        </Button>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-bold">Dernières candidatures</h2>
          <Link
            href="/e/dashboard"
            className="text-sm font-semibold text-jc-primary-green hover:underline"
          >
            Voir tout
          </Link>
        </div>
        <div className="jc-card p-6 text-center text-sm text-jc-text-muted">
          <Sparkles className="w-5 h-5 mx-auto mb-2 text-jc-text-muted" />
          Aucunes candidatures pour l'instant.
        </div>
      </section>
    </div>
  );
}
