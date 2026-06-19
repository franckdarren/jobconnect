import { HeaderSkeleton, TabsSkeleton, TableSkeleton } from "../table-skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <HeaderSkeleton />
      <TabsSkeleton count={4} />
      <TableSkeleton columns={8} />
    </div>
  );
}
