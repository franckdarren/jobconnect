"use client";

import { useTransition } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { contactCandidateOnWhatsApp } from "@/features/employers/actions";
import { cn } from "@/lib/utils";

type TrackedWhatsAppButtonProps = {
  candidateId: string;
  label?: string;
  className?: string;
};

/**
 * Server-tracked WhatsApp contact button (employer → candidate).
 * - Decrements the employer's monthly WA quota server-side.
 * - Records the interaction in `whatsapp_contacts`.
 * - Notifies the candidate.
 * - Opens the WhatsApp deep-link returned by the server only on success.
 */
export function TrackedWhatsAppButton({
  candidateId,
  label = "Contacter via WhatsApp",
  className,
}: TrackedWhatsAppButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const res = await contactCandidateOnWhatsApp(candidateId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      window.open(res.data.whatsappUrl, "_blank", "noopener,noreferrer");
      const remaining = res.data.remaining;
      if (remaining !== "unlimited") {
        toast.success(
          remaining === 0
            ? "Contact envoyé — quota mensuel atteint"
            : `Contact envoyé — ${remaining} restant(s) ce mois-ci`,
        );
      } else {
        toast.success("Contact envoyé");
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1fbf5b] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 text-sm transition-colors w-full",
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
