export default function JobsListLoading() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      <header className="space-y-2">
        <div className="h-7 md:h-8 w-3/4 max-w-md rounded bg-jc-text-muted/20" />
        <div className="h-4 w-2/3 max-w-lg rounded bg-jc-text-muted/15" />
      </header>

      <div className="jc-card p-3 flex gap-2">
        <div className="flex-1 h-10 rounded-xl bg-jc-text-muted/15" />
        <div className="h-10 w-10 rounded-xl bg-jc-text-muted/15" />
        <div className="h-10 w-10 rounded-xl bg-jc-text-muted/15" />
      </div>

      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="jc-card overflow-hidden">
            <div className="p-4 flex gap-3">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-jc-text-muted/20" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-3/4 rounded bg-jc-text-muted/20" />
                <div className="h-3 w-1/2 rounded bg-jc-text-muted/15" />
                <div className="flex gap-2 pt-1">
                  <div className="h-3 w-16 rounded bg-jc-text-muted/15" />
                  <div className="h-3 w-20 rounded bg-jc-text-muted/15" />
                </div>
              </div>
            </div>
            <div className="border-t border-black/[0.04] px-4 py-3 flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-jc-text-muted/15" />
              <div className="h-8 w-24 rounded-md bg-jc-text-muted/20" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
