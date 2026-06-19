"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteAccount } from "@/features/auth/actions";

const CONFIRM_WORD = "SUPPRIMER";

export function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteAccount();
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Votre compte a été supprimé");
      router.replace("/login?deleted=1");
    });
  };

  return (
    <section className="jc-card border border-jc-warning/30 p-5 md:max-w-3xl">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-jc-warning/10 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-jc-warning" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-jc-warning">
            Supprimer mon compte
          </h2>
          <p className="text-sm text-jc-text-secondary mt-1">
            Cette action est définitive. Toutes vos données (profil, documents,
            candidatures, offres, abonnement) seront supprimées et ne pourront
            pas être récupérées.
          </p>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setConfirmText("");
        }}
      >
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full h-11 rounded-xl border-jc-warning/40 text-jc-warning hover:bg-jc-warning/5 hover:text-jc-warning font-semibold"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer définitivement mon compte
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Pour confirmer, tapez{" "}
              <span className="font-bold text-jc-warning">{CONFIRM_WORD}</span>{" "}
              ci-dessous. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoComplete="off"
            disabled={isPending}
            className="mt-1"
          />

          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                className="rounded-xl"
              >
                Annuler
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isPending || confirmText.trim() !== CONFIRM_WORD}
              className="rounded-xl bg-jc-warning hover:bg-jc-warning/90 text-white font-semibold"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
