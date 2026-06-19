import { HeaderSkeleton, TableSkeleton } from "../table-skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <HeaderSkeleton />
      <TableSkeleton columns={5} />
    </div>
  );
}
