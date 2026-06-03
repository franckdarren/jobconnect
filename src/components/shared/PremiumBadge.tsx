import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type PremiumBadgeProps = {
  label?: string;
  variant?: "dark" | "green";
  className?: string;
};

export function PremiumBadge({
  label = "OFFRE PRIVILÈGE",
  variant = "dark",
  className,
}: PremiumBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide",
        variant === "dark"
          ? "bg-jc-orange/15 text-jc-orange"
          : "bg-jc-light-green text-jc-primary-green",
        className,
      )}
    >
      <Sparkles className="w-3 h-3" />
      {label}
    </span>
  );
}
