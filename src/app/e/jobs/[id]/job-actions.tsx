"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Copy, Power, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  closeJobOffer,
  duplicateJobOffer,
  reopenJobOffer,
} from "@/features/jobs/actions";

type JobActionsProps = {
  id: string;
  status: "active" | "closed" | "expired";
  applicationsCount: number;
};

export function JobActions({ id, status, applicationsCount }: JobActionsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"toggle" | "duplicate" | null>(null);

  const onToggle = () => {
    setPendingAction("toggle");
    startTransition(async () => {
      const res = status === "active"
        ? await closeJobOffer(id)
        : await reopenJobOffer(id);
      setPendingAction(null);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(status === "active" ? "Offre clôturée" : "Offre republiée");
      router.refresh();
    });
  };

  const onDuplicate = () => {
    setPendingAction("duplicate");
    startTransition(async () => {
      const res = await duplicateJobOffer(id);
      setPendingAction(null);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Offre dupliquée");
      router.push(`/e/jobs/${res.data.id}`);
      router.refresh();
    });
  };

  return (
    <section className="jc-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-jc-text-secondary">
          <Users className="w-4 h-4" />
          {applicationsCount} candidat{applicationsCount > 1 ? "s" : ""}
        </span>
        <span
          className={`text-[11px] font-bold tracking-wide px-2 py-1 rounded-full ${
            status === "active"
              ? "bg-jc-light-green text-jc-primary-green"
              : "bg-jc-text-secondary/10 text-jc-text-secondary"
          }`}
        >
          {status === "active"
            ? "Active"
            : status === "closed"
              ? "Clôturée"
              : "Expirée"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pendingAction !== null}
          onClick={onToggle}
        >
          {pendingAction === "toggle" ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : status === "active" ? (
            <Lock className="w-3 h-3 mr-1" />
          ) : (
            <Power className="w-3 h-3 mr-1" />
          )}
          {status === "active" ? "Clôturer" : "Republier"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pendingAction !== null}
          onClick={onDuplicate}
        >
          {pendingAction === "duplicate" ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Copy className="w-3 h-3 mr-1" />
          )}
          Dupliquer
        </Button>
      </div>
    </section>
  );
}
