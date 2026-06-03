import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type LockOverlayProps = {
  label?: string;
  className?: string;
  onUnlock?: () => void;
};

export function LockOverlay({
  label = "DÉBLOQUER AVEC PRO",
  className,
  onUnlock,
}: LockOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2 backdrop-blur-md bg-white/50 rounded-2xl",
        className,
      )}
    >
      <button
        type="button"
        onClick={onUnlock}
        className="flex flex-col items-center gap-2 text-jc-text-primary"
      >
        <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">
          <Lock className="w-4 h-4" />
        </div>
        <span className="text-[11px] font-bold tracking-wide">{label}</span>
      </button>
    </div>
  );
}
