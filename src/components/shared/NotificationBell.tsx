"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

type Props = {
  role: "candidate" | "employer";
  className?: string;
};

export function NotificationBell({ role, className }: Props) {
  const [count, setCount] = useState(0);
  const href = role === "candidate" ? "/c/notifications" : "/e/notifications";

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { count: number };
        if (!cancelled) setCount(json.count ?? 0);
      } catch {
        // silent — indicative-only counter
      }
    };
    fetchCount();
    const id = setInterval(fetchCount, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <Link
      href={href}
      aria-label={`Notifications${count > 0 ? ` (${count} non lues)` : ""}`}
      className={cn(
        "relative p-1.5 text-jc-text-primary hover:text-jc-primary-green transition-colors",
        className,
      )}
    >
      <Bell className="w-5 h-5" />
      {count > 0 ? (
        <span className="absolute top-0 right-0 min-w-[18px] h-[18px] rounded-full bg-jc-warning text-white text-[10px] font-bold flex items-center justify-center px-1">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
