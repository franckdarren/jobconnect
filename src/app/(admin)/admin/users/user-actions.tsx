"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  BadgeCheck,
  ShieldOff,
  Star,
  StarOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  activateUser,
  boostCandidate,
  suspendUser,
  unboostCandidate,
  unverifyEmployer,
  verifyEmployer,
} from "@/features/admin/actions";

type Props = {
  userId: string;
  role: "candidate" | "employer" | "admin";
  isActive: boolean;
  isVerified?: boolean | null;
  isBoosted?: boolean | null;
};

export function UserActions({
  userId,
  role,
  isActive,
  isVerified,
  isBoosted,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ success: boolean; error?: string }>) => {
    startTransition(async () => {
      const res = await fn();
      if (!res.success) {
        toast.error(res.error ?? "Erreur");
        return;
      }
      toast.success("Action appliquée");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {role !== "admin" ? (
        isActive ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => suspendUser(userId))}
            className="h-8 text-xs text-jc-warning border-jc-warning/30"
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Ban className="w-3 h-3 mr-1" />
            )}
            Suspendre
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => activateUser(userId))}
            className="h-8 text-xs text-jc-primary-green border-jc-primary-green/30"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Réactiver
          </Button>
        )
      ) : null}

      {role === "employer" ? (
        isVerified ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => unverifyEmployer(userId))}
            className="h-8 text-xs"
          >
            <ShieldOff className="w-3 h-3 mr-1" />
            Retirer vérif.
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => verifyEmployer(userId))}
            className="h-8 text-xs text-jc-primary-green border-jc-primary-green/30"
          >
            <BadgeCheck className="w-3 h-3 mr-1" />
            Vérifier
          </Button>
        )
      ) : null}

      {role === "candidate" ? (
        isBoosted ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => unboostCandidate(userId))}
            className="h-8 text-xs"
          >
            <StarOff className="w-3 h-3 mr-1" />
            Retirer boost
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              run(() => boostCandidate({ candidateId: userId, days: 30 }))
            }
            className="h-8 text-xs text-jc-orange border-jc-orange/30"
          >
            <Star className="w-3 h-3 mr-1" />
            Booster 30j
          </Button>
        )
      ) : null}
    </div>
  );
}
