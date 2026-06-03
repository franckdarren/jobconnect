import { MapPin, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LockOverlay } from "./LockOverlay";
import { WhatsAppButton } from "./WhatsAppButton";
import { employerContactMessage } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export type CandidateCardCandidate = {
  id: string;
  displayName: string;
  maskedName: string;
  profession?: string | null;
  city?: string | null;
  photoUrl?: string | null;
  whatsappPhone?: string | null;
  isBoosted?: boolean;
};

type CandidateCardProps = {
  candidate: CandidateCardCandidate;
  locked?: boolean;
  onUnlock?: () => void;
  className?: string;
};

export function CandidateCard({
  candidate,
  locked = false,
  onUnlock,
  className,
}: CandidateCardProps) {
  const name = locked ? candidate.maskedName : candidate.displayName;

  return (
    <article className={cn("jc-card overflow-hidden", className)}>
      <div className="relative p-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar
              className={cn(
                "w-12 h-12 ring-2 ring-jc-primary-green/30",
                locked && "blur-sm",
              )}
            >
              <AvatarImage src={candidate.photoUrl ?? undefined} alt={name} />
              <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {candidate.isBoosted ? (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-jc-orange text-white flex items-center justify-center">
                <Star className="w-3 h-3" />
              </span>
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-jc-text-primary leading-tight">
              {name}
            </h3>
            {candidate.profession ? (
              <p className="text-xs uppercase tracking-wide text-jc-text-secondary mt-0.5">
                {candidate.profession}
              </p>
            ) : null}
            {candidate.city ? (
              <p className="text-xs text-jc-text-muted mt-1 inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {candidate.city}
              </p>
            ) : null}
          </div>
        </div>

        {locked ? (
          <div className="mt-3">
            <LockOverlay onUnlock={onUnlock} />
          </div>
        ) : candidate.whatsappPhone ? (
          <div className="mt-3">
            <WhatsAppButton
              phone={candidate.whatsappPhone}
              message={employerContactMessage(candidate.displayName)}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
