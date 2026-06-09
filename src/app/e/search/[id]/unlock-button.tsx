"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { viewCandidateProfile } from "@/features/employers/actions";

type UnlockButtonProps = {
  candidateId: string;
  remaining: number | "unlimited";
};

export function UnlockButton({ candidateId, remaining }: UnlockButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const res = await viewCandidateProfile(candidateId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Profil débloqué");
      router.refresh();
    });
  };

  const label =
    remaining === "unlimited"
      ? "Débloquer ce profil"
      : `Débloquer ce profil (${remaining} restant${remaining > 1 ? "s" : ""} aujourd'hui)`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-jc-primary-green hover:bg-jc-primary-green/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 text-sm transition-colors"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Lock className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
