"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Eye, X, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  markApplicationViewed,
  rejectApplication,
} from "@/features/applications/actions";
import { buildWhatsAppUrl, employerContactMessage } from "@/lib/whatsapp";

type ApplicationRow = {
  id: string;
  status: "pending" | "viewed" | "rejected";
  createdAt: Date | string;
  candidateId: string;
  firstName: string;
  lastName: string;
  profession: string | null;
  city: string | null;
  photoUrl: string | null;
  whatsappPhone: string | null;
  candidatePhone: string;
};

const STATUS_STYLE = {
  pending: "bg-jc-orange/10 text-jc-orange",
  viewed: "bg-jc-light-green text-jc-primary-green",
  rejected: "bg-jc-warning/10 text-jc-warning",
} as const;

const STATUS_LABEL = {
  pending: "Nouvelle",
  viewed: "Vue",
  rejected: "Rejetée",
} as const;

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function ApplicationsList({
  applications,
}: {
  applications: ApplicationRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const onView = (id: string) => {
    setPendingKey(`${id}-view`);
    startTransition(async () => {
      const res = await markApplicationViewed(id);
      setPendingKey(null);
      if (!res.success) toast.error(res.error);
      else router.refresh();
    });
  };

  const onReject = (id: string) => {
    setPendingKey(`${id}-reject`);
    startTransition(async () => {
      const res = await rejectApplication(id);
      setPendingKey(null);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Candidature rejetée");
      router.refresh();
    });
  };

  if (applications.length === 0) {
    return (
      <div className="jc-card p-8 text-center text-sm text-jc-text-secondary">
        Aucune candidature pour le moment.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {applications.map((a) => {
        const fullName = `${a.firstName} ${a.lastName}`;
        const phone = a.whatsappPhone || a.candidatePhone;
        return (
          <li key={a.id} className="jc-card p-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-jc-primary-green/20 shrink-0">
                <AvatarImage src={a.photoUrl ?? undefined} alt={fullName} />
                <AvatarFallback>
                  {a.firstName[0]}
                  {a.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold leading-tight">{fullName}</h3>
                {a.profession ? (
                  <p className="text-xs text-jc-text-secondary mt-0.5">
                    {a.profession}
                  </p>
                ) : null}
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-jc-text-muted">
                  {a.city ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {a.city}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(a.createdAt)}
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold tracking-wide px-2 py-1 rounded-full shrink-0 ${STATUS_STYLE[a.status]}`}
              >
                {STATUS_LABEL[a.status]}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-black/[0.04] grid grid-cols-3 gap-2">
              {a.status === "pending" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pendingKey !== null}
                  onClick={() => onView(a.id)}
                  className="text-xs"
                >
                  {pendingKey === `${a.id}-view` ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Eye className="w-3 h-3 mr-1" />
                  )}
                  Marquer vue
                </Button>
              ) : (
                <span />
              )}
              {a.status !== "rejected" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pendingKey !== null}
                  onClick={() => onReject(a.id)}
                  className="text-xs text-jc-warning border-jc-warning/30"
                >
                  {pendingKey === `${a.id}-reject` ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <X className="w-3 h-3 mr-1" />
                  )}
                  Rejeter
                </Button>
              ) : (
                <span />
              )}
              <a
                href={buildWhatsAppUrl(phone, employerContactMessage(a.firstName))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-[#25D366] hover:bg-[#1fbf5b] text-white text-xs font-semibold h-8 px-2"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                WhatsApp
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
