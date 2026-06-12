"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type WhatsAppButtonProps = {
  phone: string;
  message: string;
  label?: string;
  className?: string;
  onClick?: () => void;
};

export function WhatsAppButton({
  phone,
  message,
  label = "Contacter via WhatsApp",
  className,
  onClick,
}: WhatsAppButtonProps) {
  return (
    <a
      href={buildWhatsAppUrl(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1fbf5b] text-white font-semibold px-4 py-2.5 text-sm transition-colors w-full",
        className,
      )}
    >
      <MessageCircle className="w-4 h-4" />
      {label}
    </a>
  );
}
