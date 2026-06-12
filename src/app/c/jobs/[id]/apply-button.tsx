"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle, Sparkles, Loader2 } from "lucide-react";
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
};

export function ApplyButton({
  jobId,
  jobTitle,
  employerWhatsapp,
}: ApplyButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);

  const onClick = () => {
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
