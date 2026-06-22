"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle, Sparkles, Loader2, UserCog, Circle } from "lucide-react";
import { toast } from "sonner";
import { applyToJob } from "@/features/applications/actions";
import { buildWhatsAppUrl, candidateContactMessage } from "@/lib/whatsapp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ApplyButtonProps = {
  jobId: string;
  jobTitle: string;
  employerWhatsapp: string | null;
  /** Complétude du profil candidat (incitation souple avant de postuler). */
  profilePercent?: number;
  /** `true` si le profil dépasse le seuil d'incitation — on postule directement. */
  profileMeetsThreshold?: boolean;
  /** Libellés des éléments de profil manquants, affichés dans la modale. */
  profileMissing?: string[];
};

export function ApplyButton({
  jobId,
  jobTitle,
  employerWhatsapp,
  profilePercent = 100,
  profileMeetsThreshold = true,
  profileMissing = [],
}: ApplyButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const doApply = () => {
    if (!employerWhatsapp) {
      toast.error("Le recruteur n'a pas renseigné son WhatsApp");
      return;
    }
    startTransition(async () => {
      const res = await applyToJob(jobId);
      if (!res.success) {
        if (res.code === "quota_exceeded") {
          setQuotaModalOpen(true);
          return;
        }
        toast.error(res.error);
        return;
      }
      toast.success("Candidature enregistrée");
      const phone = res.data.whatsappPhone ?? employerWhatsapp;
      window.open(
        buildWhatsAppUrl(phone, candidateContactMessage(jobTitle)),
        "_blank",
        "noopener,noreferrer",
      );
    });
  };

  const onClick = () => {
    if (!employerWhatsapp) {
      toast.error("Le recruteur n'a pas renseigné son WhatsApp");
      return;
    }
    // Incitation souple : profil incomplet → on propose de le compléter, sans bloquer.
    if (!profileMeetsThreshold) {
      setProfileModalOpen(true);
      return;
    }
    doApply();
  };

  const applyAnyway = () => {
    setProfileModalOpen(false);
    doApply();
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        aria-label={isPending ? "Envoi de la candidature en cours..." : "Postuler via WhatsApp"}
        className="w-full rounded-xl bg-[#25D366] hover:bg-[#1fbf5b] text-white font-semibold py-3 text-sm transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
        {isPending ? "Envoi..." : "Postuler via WhatsApp"}
      </button>

      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="text-center">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-jc-light-green flex items-center justify-center">
              <UserCog className="w-5 h-5 text-jc-primary-green" />
            </div>
            <DialogTitle className="text-xl font-bold mt-3">
              Complétez votre profil
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-jc-text-secondary">
            Votre profil est complété à{" "}
            <span className="font-semibold text-jc-text-primary">
              {profilePercent}&nbsp;%
            </span>
            . Un profil complet retient bien plus l&apos;attention des recruteurs
            qui reçoivent votre candidature.
          </p>
          {profileMissing.length > 0 ? (
            <ul className="space-y-2 text-left">
              {profileMissing.slice(0, 4).map((label) => (
                <li
                  key={label}
                  className="flex items-center gap-2 rounded-lg bg-jc-background px-3 py-2 text-sm"
                >
                  <Circle className="w-4 h-4 shrink-0 text-jc-text-muted" />
                  {label}
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            asChild
            className="w-full h-11 rounded-full bg-jc-primary-green hover:bg-jc-primary-green/90 text-white font-semibold"
          >
            <Link href="/c/profile">Compléter mon profil</Link>
          </Button>
          <button
            type="button"
            onClick={applyAnyway}
            className="text-sm font-medium text-jc-text-secondary hover:text-jc-text-primary"
          >
            Postuler quand même
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={quotaModalOpen} onOpenChange={setQuotaModalOpen}>
        <DialogContent className="text-center">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-jc-warning/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-jc-warning" />
            </div>
            <DialogTitle className="text-xl font-bold mt-3">
              Limite de candidatures atteinte
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-jc-text-secondary">
            Passez au niveau supérieur pour ne manquer aucune opportunité
            professionnelle.
          </p>
          <ul className="space-y-2 text-left">
            <li className="flex items-center gap-2 rounded-lg bg-jc-background px-3 py-2 text-sm">
              <span className="w-4 h-4 rounded-full bg-jc-primary-green text-white text-[10px] flex items-center justify-center">
                ✓
              </span>
              Candidatures illimitées
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-jc-background px-3 py-2 text-sm">
              <span className="w-4 h-4 rounded-full bg-jc-primary-green text-white text-[10px] flex items-center justify-center">
                ✓
              </span>
              Profil boosté (visibilité 3x)
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-jc-background px-3 py-2 text-sm">
              <span className="w-4 h-4 rounded-full bg-jc-primary-green text-white text-[10px] flex items-center justify-center">
                ✓
              </span>
              Priorité dans les recherches
            </li>
          </ul>
          <Button
            asChild
            className="w-full h-11 rounded-full bg-jc-primary-green hover:bg-jc-primary-green/90 text-white font-semibold"
          >
            <Link href="/c/upgrade">Activer Premium — 2 000 FCFA</Link>
          </Button>
          <p className="text-[11px] text-jc-text-muted">
            Engagement de 30 jours, renouvellement non-automatique.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
