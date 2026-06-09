"use client";

import { useState, useTransition } from "react";
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
  const [, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const run = (action: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setPendingAction(action);
    startTransition(async () => {
      const res = await fn();
      setPendingAction(null);
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
            disabled={pendingAction !== null}
            onClick={() => run("suspend", () => suspendUser(userId))}
            className="h-8 text-xs text-jc-warning border-jc-warning/30"
          >
            {pendingAction === "suspend" ? (
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
            disabled={pendingAction !== null}
            onClick={() => run("activate", () => activateUser(userId))}
            className="h-8 text-xs text-jc-primary-green border-jc-primary-green/30"
          >
            {pendingAction === "activate" ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3 mr-1" />
            )}
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
            disabled={pendingAction !== null}
            onClick={() => run("unverify", () => unverifyEmployer(userId))}
            className="h-8 text-xs"
          >
            {pendingAction === "unverify" ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <ShieldOff className="w-3 h-3 mr-1" />
            )}
            Retirer vérif.
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pendingAction !== null}
            onClick={() => run("verify", () => verifyEmployer(userId))}
            className="h-8 text-xs text-jc-primary-green border-jc-primary-green/30"
          >
            {pendingAction === "verify" ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <BadgeCheck className="w-3 h-3 mr-1" />
            )}
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
            disabled={pendingAction !== null}
            onClick={() => run("unboost", () => unboostCandidate(userId))}
            className="h-8 text-xs"
          >
            {pendingAction === "unboost" ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <StarOff className="w-3 h-3 mr-1" />
            )}
            Retirer boost
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pendingAction !== null}
            onClick={() =>
              run("boost", () => boostCandidate({ candidateId: userId, days: 30 }))
            }
            className="h-8 text-xs text-jc-orange border-jc-orange/30"
          >
            {pendingAction === "boost" ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Star className="w-3 h-3 mr-1" />
            )}
            Booster 30j
          </Button>
        )
      ) : null}
    </div>
  );
}
