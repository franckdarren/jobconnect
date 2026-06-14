import Link from "next/link";
import { ArrowLeft, Check, Sparkles, Star } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getActiveSubscription } from "@/features/payments/queries";
import { PLAN_AMOUNTS } from "@/features/payments/schemas";
import { UpgradeCta } from "@/components/shared/UpgradeCta";
import { PremiumBadge } from "@/components/shared/PremiumBadge";

const FREE_FEATURES = [
  "10 offres visibles maximum",
  "3 candidatures par mois",
  "Profil de base",
  "Notifications limitées",
];

const PREMIUM_FEATURES = [
  "Offres illimitées",
  "Candidatures illimitées",
  "Badge Premium ✦ sur votre profil",
  "Apparition prioritaire pour les employeurs",
  "Notifications détaillées",
  "Statistiques de vues de profil",
];

export default async function CandidateUpgradePage() {
  const user = await requireRole("candidate");
  const subscription = await getActiveSubscription(user.id);
  const isPremium = subscription?.plan === "candidate_premium";

  return (
    <div className="space-y-4 md:space-y-6 md:max-w-4xl md:mx-auto md:w-full">
      <Link
        href="/c/profile"
        className="inline-flex items-center gap-1 text-sm text-jc-text-secondary hover:text-jc-text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Link>

      <header className="text-center space-y-1">
        <h1 className="text-2xl md:text-4xl font-bold">Boostez votre carrière</h1>
        <p className="text-sm md:text-base text-jc-text-secondary">
          Décrochez plus d&apos;opportunités avec 241Job Premium.
        </p>
      </header>

      {isPremium && subscription ? (
        <article className="jc-card p-4 bg-jc-light-green border border-jc-primary-green/30">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-jc-primary-green" />
            <div className="flex-1">
              <p className="font-bold text-jc-primary-dark">
                Vous êtes Premium
              </p>
              <p className="text-xs text-jc-text-secondary">
                Actif jusqu&apos;au{" "}
                {new Date(subscription.expiresAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </article>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Free */}
        <article className="jc-card p-5 border border-black/5">
          <div className="space-y-1">
            <p className="text-xs font-bold tracking-wide text-jc-text-secondary">
              GRATUIT
            </p>
            <h2 className="text-xl font-bold">Découverte</h2>
            <p className="text-2xl font-bold mt-2">
              0<span className="text-sm font-normal text-jc-text-secondary"> FCFA</span>
            </p>
          </div>
          <ul className="mt-4 space-y-2">
            {FREE_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-sm text-jc-text-secondary"
              >
                <Check className="w-4 h-4 text-jc-text-muted shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </article>

        {/* Premium */}
        <article className="jc-card p-5 bg-jc-primary-dark text-white relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <PremiumBadge label="POPULAIRE" variant="green" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold tracking-wide text-white/70">
              PREMIUM
            </p>
            <h2 className="text-xl font-bold inline-flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Boost
            </h2>
            <p className="text-2xl font-bold mt-2">
              {PLAN_AMOUNTS.candidate_premium.toLocaleString("fr-FR")}
              <span className="text-sm font-normal text-white/70"> FCFA / mois</span>
            </p>
          </div>
          <ul className="mt-4 space-y-2">
            {PREMIUM_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-sm text-white/90"
              >
                <Check className="w-4 h-4 text-jc-primary-green shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            {isPremium ? (
              <p className="text-center text-xs text-white/70">
                Renouvellement automatique au paiement.
              </p>
            ) : (
              <UpgradeCta
                plan="candidate_premium"
                label="Payer 2 000 FCFA / mois"
                className="w-full"
              />
            )}
          </div>
        </article>
      </div>

      <p className="text-center text-xs text-jc-text-muted">
        Paiement sécurisé via Airtel Money ou Moov Money. Annulation à tout moment.
      </p>
    </div>
  );
}
