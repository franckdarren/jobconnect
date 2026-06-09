"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteJobOffer } from "@/features/admin/actions";

export function DeleteJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm("Supprimer définitivement cette offre ?")) return;
    startTransition(async () => {
      const res = await deleteJobOffer(jobId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Offre supprimée");
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={isPending}
      className="h-8 text-xs text-jc-warning border-jc-warning/30"
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
      ) : (
        <Trash2 className="w-3 h-3 mr-1" />
      )}
      Supprimer
    </Button>
  );
}
