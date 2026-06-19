import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton générique d'un tableau de liste admin (en-tête + lignes). */
export function TableSkeleton({
  columns,
  rows = 8,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <div className="jc-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/5">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-black/5 last:border-0">
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-[140px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Skeleton d'en-tête de page (titre + sous-titre). */
export function HeaderSkeleton() {
  return (
    <header className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-32" />
    </header>
  );
}

/** Skeleton d'une barre d'onglets (pills). */
export function TabsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
      ))}
    </div>
  );
}
