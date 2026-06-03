import { Briefcase, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AuthCard({
  title,
  subtitle,
  footer,
  children,
  className,
}: AuthCardProps) {
  return (
    <div className={cn("flex flex-col items-center w-full", className)}>
      <div className="w-full bg-white rounded-3xl shadow-sm p-6 sm:p-8">
        <div className="flex justify-center mb-4">
          <Briefcase className="w-8 h-8 text-jc-primary-dark" />
        </div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-jc-text-primary">JobConnect</h1>
          <h2 className="text-xl font-bold text-jc-text-primary mt-3 leading-tight">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-sm text-jc-text-secondary mt-2 px-2">
              {subtitle}
            </p>
          ) : null}
        </div>

        {children}

        <div className="mt-6 pt-4 border-t border-black/[0.04] flex items-center justify-center gap-6 text-xs text-jc-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            SÉCURISÉ
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            RAPIDE
          </span>
        </div>
      </div>
      {footer ? (
        <p className="mt-4 text-xs text-center text-jc-text-secondary px-6">
          {footer}
        </p>
      ) : null}
    </div>
  );
}
