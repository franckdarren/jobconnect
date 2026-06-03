import { cn } from "@/lib/utils";

type HeroCardProps = {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function HeroCard({
  title,
  subtitle,
  badge,
  children,
  className,
}: HeroCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-jc-primary-dark text-white p-5 shadow-sm",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5"
      />
      {badge ? <div className="mb-3">{badge}</div> : null}
      <h2 className="text-xl font-bold leading-tight">{title}</h2>
      {subtitle ? (
        <p className="mt-2 text-sm text-white/70 max-w-sm">{subtitle}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
