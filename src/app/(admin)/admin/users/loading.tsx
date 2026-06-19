import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton, TabsSkeleton, TableSkeleton } from "../table-skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <HeaderSkeleton />
      <Skeleton className="h-12 w-full rounded-xl" />
      <TabsSkeleton count={4} />
      <TableSkeleton columns={5} />
    </div>
  );
}
