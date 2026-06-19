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
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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

  const hasActions = role !== "admin";
  if (!hasActions) {
    return <span className="text-jc-text-muted">—</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          className="h-8 w-8 p-0"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MoreHorizontal className="w-4 h-4" />
          )}
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="admin-shell w-44">
        {isActive ? (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => run(() => suspendUser(userId))}
          >
            <Ban className="w-4 h-4" />
            Suspendre
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => run(() => activateUser(userId))}>
            <CheckCircle2 className="w-4 h-4 text-jc-primary-green" />
            Réactiver
          </DropdownMenuItem>
        )}

        {role === "employer" ? (
          isVerified ? (
            <DropdownMenuItem
              onSelect={() => run(() => unverifyEmployer(userId))}
            >
              <ShieldOff className="w-4 h-4" />
              Retirer vérif.
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => run(() => verifyEmployer(userId))}>
              <BadgeCheck className="w-4 h-4 text-jc-primary-green" />
              Vérifier
            </DropdownMenuItem>
          )
        ) : null}

        {role === "candidate" ? (
          isBoosted ? (
            <DropdownMenuItem
              onSelect={() => run(() => unboostCandidate(userId))}
            >
              <StarOff className="w-4 h-4" />
              Retirer boost
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() =>
                run(() => boostCandidate({ candidateId: userId, days: 30 }))
              }
            >
              <Star className="w-4 h-4 text-jc-orange" />
              Booster 30j
            </DropdownMenuItem>
          )
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
