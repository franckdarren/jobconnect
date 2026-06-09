import Link from "next/link";
import { Eye, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getCandidateProfile } from "@/features/candidates/queries";
import { HeroCard } from "@/components/shared/HeroCard";
import { PremiumBadge } from "@/components/shared/PremiumBadge";

export default async function CandidateHomePage() {
  const user = await requireRole("candidate");
  const data = await getCandidateProfile(user.id);
  const firstName = data?.profile.firstName ?? "";

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">
          Bonjour, {firstName || "à vous"}&nbsp;!
        </h1>
        <p className="text-sm text-jc-text-secondary mt-1">
          Prêt pour votre prochaine étape professionnelle aujourd&apos;hui ?
        </p>
      </header>

      <HeroCard
        title="Débloquez les contacts directs"
        subtitle="Accédez aux numéros WhatsApp des recruteurs et boostez votre visibilité de 3x."
        badge={<PremiumBadge label="OFFRE PRIVILÈGE" />}
      >
        <Button
          asChild
          className="bg-jc-primary-green hover:bg-jc-primary-green/90 text-white font-semibold rounded-xl px-4 h-10"
        >
          <Link href="/c/upgrade">
            <Sparkles className="w-4 h-4 mr-1.5" />
            Passer en Premium
          </Link>
        </Button>
      </HeroCard>

      <div className="grid grid-cols-2 gap-3">
        <article className="jc-card p-4">
          <div className="flex items-center gap-2 text-sm text-jc-primary-green font-medium">
            <Eye className="w-4 h-4" />
            Vues du profil
          </div>
          <p className="text-3xl font-bold mt-1">0</p>
        </article>
        <article className="jc-card p-4">
          <div className="flex items-center gap-2 text-sm text-jc-orange font-medium">
            <Send className="w-4 h-4" />
            Candidatures
          </div>
          <p className="text-3xl font-bold mt-1">0</p>
        </article>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg font-bold">Recommandés pour vous</h2>
          <Link
            href="/c/jobs"
            className="text-sm font-semibold text-jc-primary-green hover:underline"
          >
            Voir tout
          </Link>
        </div>
        <div className="jc-card p-6 text-center text-sm text-jc-text-muted">
          Les offres recommandées arriveront en Phase 5.
        </div>
      </section>
    </div>
  );
}
