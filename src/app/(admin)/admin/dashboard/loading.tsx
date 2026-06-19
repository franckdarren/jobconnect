import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton } from "../table-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <article key={i} className="jc-card p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-36" />
          </article>
        ))}
      </div>
    </div>
  );
}
