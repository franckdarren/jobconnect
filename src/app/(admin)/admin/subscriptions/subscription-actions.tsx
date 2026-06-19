"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { extendSubscription } from "@/features/admin/actions";

export function SubscriptionActions({
  subscriptionId,
}: {
  subscriptionId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onExtend = () => {
    startTransition(async () => {
      const res = await extendSubscription({ subscriptionId, days: 30 });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Abonnement prolongé de 30 jours");
      router.refresh();
    });
  };

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
        <DropdownMenuItem onSelect={onExtend}>
          <CalendarPlus className="w-4 h-4 text-jc-primary-green" />
          Prolonger (+30j)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
