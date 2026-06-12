"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconInput } from "@/components/shared/IconInput";
import { cn } from "@/lib/utils";
import {
  getPaymentStatus,
  initiatePayment,
} from "@/features/payments/actions";
import {
  PLAN_AMOUNTS,
  PLAN_LABELS,
  type InitiatePaymentInput,
} from "@/features/payments/schemas";

type PaidPlan = "candidate_premium" | "employer_pro";
type Operator = "airtel_money" | "moov_money";

type PaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PaidPlan;
};

const OPERATORS: { value: Operator; label: string; color: string }[] = [
  { value: "airtel_money", label: "Airtel Money", color: "bg-[#E60000]" },
  { value: "moov_money", label: "Moov Money", color: "bg-[#003DA5]" },
];

type Phase = "form" | "pending" | "success" | "failed";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 3 * 60 * 1_000;

export function PaymentModal({ open, onOpenChange, plan }: PaymentModalProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [operator, setOperator] = useState<Operator>("airtel_money");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [merchantReference, setMerchantReference] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const startedAtRef = useRef<number>(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const amount = PLAN_AMOUNTS[plan];
  const label = PLAN_LABELS[plan];

  const reset = () => {
    setPhase("form");
    setOperator("airtel_money");
    setPhone("");
    setError(null);
    setMerchantReference(null);
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "pending" || !merchantReference) return;

    let cancelled = false;

    const poll = async () => {
      const elapsed = Date.now() - startedAtRef.current;
      if (elapsed > POLL_TIMEOUT_MS) {
        if (!cancelled) {
          setError(
            "Le paiement met du temps à se confirmer. Vérifiez votre téléphone, puis relancez si besoin.",
          );
          setPhase("failed");
        }
        return;
      }

      const res = await getPaymentStatus(merchantReference);
      if (cancelled) return;

      if (!res.success) {
        setError(res.error);
        setPhase("failed");
        return;
      }
      if (res.data.status === "success") {
        setPhase("success");
        router.refresh();
        return;
      }
      if (res.data.status === "failed") {
        setError("Paiement échoué. Réessayez ou contactez le support.");
        setPhase("failed");
        return;
      }
      pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [phase, merchantReference, router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startSubmit(async () => {
      const payload: InitiatePaymentInput = { plan, operator, phone };
      const res = await initiatePayment(payload);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setMerchantReference(res.data.merchantReference);
      startedAtRef.current = Date.now();
      setPhase("pending");
      toast.success("Paiement initié — confirmez sur votre téléphone");
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Souscrire {label}</DialogTitle>
          <DialogDescription>
            {amount.toLocaleString("fr-FR")} FCFA / mois — paiement Mobile Money
          </DialogDescription>
        </DialogHeader>

        {phase === "form" ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-jc-text-primary mb-2">
                Choisissez votre opérateur
              </p>
              <div className="grid grid-cols-2 gap-2">
                {OPERATORS.map((op) => {
                  const active = op.value === operator;
                  return (
                    <button
                      type="button"
                      key={op.value}
                      onClick={() => setOperator(op.value)}
                      aria-label={`Payer avec ${op.label}`}
                      aria-pressed={active}
                      className={cn(
                        "rounded-xl border-2 p-3 text-sm font-semibold transition-all",
                        active
                          ? "border-jc-primary-green bg-jc-light-green text-jc-primary-green"
                          : "border-black/5 bg-white text-jc-text-secondary",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white",
                          op.color,
                        )}
                      >
                        <Smartphone className="w-4 h-4" />
                      </div>
                      {op.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <IconInput
              label="Numéro Mobile Money"
              placeholder="+241 06 12 34 56"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={error ?? undefined}
            />

            <div className="rounded-xl bg-jc-background p-3 text-xs text-jc-text-secondary space-y-1">
              <p>
                Après confirmation, vous recevrez une notification sur votre
                téléphone pour valider le paiement de{" "}
                <span className="font-semibold text-jc-text-primary">
                  {amount.toLocaleString("fr-FR")} FCFA
                </span>
                .
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting || !phone}
              className="w-full bg-jc-primary-green hover:bg-jc-primary-green/90 text-white"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Payer {amount.toLocaleString("fr-FR")} FCFA
            </Button>
          </form>
        ) : null}

        {phase === "pending" ? (
          <div className="py-6 text-center space-y-3">
            <Loader2 className="w-10 h-10 mx-auto text-jc-primary-green animate-spin" />
            <p className="font-semibold text-jc-text-primary">
              Paiement en attente
            </p>
            <p className="text-xs text-jc-text-secondary">
              Validez la transaction sur votre téléphone. Cette fenêtre se
              fermera automatiquement.
            </p>
          </div>
        ) : null}

        {phase === "success" ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-jc-primary-green" />
            <p className="font-bold text-jc-text-primary text-lg">
              Abonnement activé
            </p>
            <p className="text-xs text-jc-text-secondary">
              Vous bénéficiez désormais de tous les avantages {label}.
            </p>
            <Button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="w-full bg-jc-primary-green hover:bg-jc-primary-green/90 text-white"
            >
              Continuer
            </Button>
          </div>
        ) : null}

        {phase === "failed" ? (
          <div className="py-6 text-center space-y-3">
            <AlertCircle className="w-12 h-12 mx-auto text-jc-warning" />
            <p className="font-bold text-jc-text-primary">Paiement non confirmé</p>
            <p className="text-xs text-jc-text-secondary">
              {error ?? "Une erreur est survenue pendant le paiement."}
            </p>
            <Button
              type="button"
              onClick={reset}
              variant="outline"
              className="w-full"
            >
              Réessayer
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
