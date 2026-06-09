"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "./PaymentModal";
import { cn } from "@/lib/utils";

type PaidPlan = "candidate_premium" | "employer_pro";

type UpgradeCtaProps = {
  plan: PaidPlan;
  label?: string;
  className?: string;
  variant?: "primary" | "outline" | "subtle";
  size?: "sm" | "md";
};

export function UpgradeCta({
  plan,
  label,
  className,
  variant = "primary",
  size = "md",
}: UpgradeCtaProps) {
  const [open, setOpen] = useState(false);

  const defaultLabel = plan === "candidate_premium" ? "Passer en Premium" : "Passer en Pro";

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          variant === "primary" &&
            "bg-jc-primary-green hover:bg-jc-primary-green/90 text-white",
          variant === "outline" &&
            "bg-white border-2 border-jc-primary-green text-jc-primary-green hover:bg-jc-light-green",
          variant === "subtle" &&
            "bg-jc-primary-dark hover:bg-jc-primary-dark/90 text-white",
          size === "sm" ? "h-9 px-4 text-xs rounded-full" : "h-12 px-6 rounded-xl",
          "font-semibold",
          className,
        )}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {label ?? defaultLabel}
      </Button>
      <PaymentModal open={open} onOpenChange={setOpen} plan={plan} />
    </>
  );
}
