"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  markAllAsRead,
  markAsRead,
} from "@/features/notifications/actions";
import { cn } from "@/lib/utils";

type NotificationType =
  | "profile_viewed"
  | "application_sent"
  | "subscription_expired"
  | "quota_reached"
  | "payment_success"
  | "payment_failed";

type Notif = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
  metadata?: Record<string, unknown> | null;
};

const ICON_BY_TYPE: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  profile_viewed: { icon: Eye, color: "bg-jc-primary-green/15 text-jc-primary-green" },
  application_sent: { icon: Send, color: "bg-jc-orange/15 text-jc-orange" },
  subscription_expired: { icon: Clock, color: "bg-jc-warning/15 text-jc-warning" },
  quota_reached: { icon: AlertTriangle, color: "bg-jc-warning/15 text-jc-warning" },
  payment_success: { icon: CheckCircle2, color: "bg-jc-primary-green/15 text-jc-primary-green" },
  payment_failed: { icon: XCircle, color: "bg-jc-warning/15 text-jc-warning" },
};

function relativeTime(d: Date | string): string {
  const now = Date.now();
  const t = new Date(d).getTime();
  const diff = now - t;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const days = Math.floor(h / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function NotificationsList({ initial }: { initial: Notif[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>(initial);
  const [isPending, startTransition] = useTransition();

  const hasUnread = items.some((n) => !n.isRead);

  const onMarkOne = (id: string) => {
    const target = items.find((n) => n.id === id);
    if (!target || target.isRead) return;
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    startTransition(async () => {
      const res = await markAsRead(id);
      if (!res.success) {
        toast.error(res.error);
        // Revert optimistic update on failure
        setItems((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
        );
        return;
      }
      router.refresh();
    });
  };

  const onMarkAll = () => {
    if (!hasUnread) return;
    const previous = items;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    startTransition(async () => {
      const res = await markAllAsRead();
      if (!res.success) {
        toast.error(res.error);
        setItems(previous);
        return;
      }
      toast.success("Tout marqué comme lu");
      router.refresh();
    });
  };

  if (items.length === 0) {
    return (
      <div className="jc-card p-10 text-center space-y-2">
        <Bell className="w-8 h-8 mx-auto text-jc-text-muted" />
        <p className="text-sm font-semibold text-jc-text-primary">
          Pas de notification
        </p>
        <p className="text-xs text-jc-text-secondary">
          Vous serez prévenu ici quand quelque chose se passe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {hasUnread ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMarkAll}
            disabled={isPending}
            className="text-xs text-jc-primary-green"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCheck className="w-4 h-4 mr-1" />}
            Tout lire
          </Button>
        ) : null}
      </div>

      <ul className="space-y-2">
        {items.map((n) => {
          const meta = ICON_BY_TYPE[n.type];
          const Icon = meta.icon;
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onMarkOne(n.id)}
                className={cn(
                  "w-full text-left jc-card p-3 flex items-start gap-3 transition-colors",
                  !n.isRead && "bg-jc-light-green/40 ring-1 ring-jc-primary-green/20",
                )}
              >
                <span
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                    meta.color,
                  )}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm leading-tight",
                        n.isRead
                          ? "font-medium text-jc-text-secondary"
                          : "font-bold text-jc-text-primary",
                      )}
                    >
                      {n.title}
                    </p>
                    <span className="text-[11px] text-jc-text-muted shrink-0">
                      {relativeTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-jc-text-secondary mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                </div>
                {!n.isRead ? (
                  <span className="w-2 h-2 rounded-full bg-jc-primary-green mt-1.5 shrink-0" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
