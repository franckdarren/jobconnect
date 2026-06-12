export default function EmployerJobsLoading() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 md:h-8 w-40 rounded bg-jc-text-muted/20" />
          <div className="h-3 w-32 rounded bg-jc-text-muted/15" />
        </div>
        <div className="h-10 w-36 rounded-full bg-jc-text-muted/20" />
      </header>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="jc-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-5 w-3/4 rounded bg-jc-text-muted/20" />
                <div className="h-3 w-1/2 rounded bg-jc-text-muted/15" />
              </div>
              <div className="h-5 w-16 rounded-full bg-jc-text-muted/15 shrink-0" />
            </div>
            <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-jc-text-muted/15" />
              <div className="h-3 w-16 rounded bg-jc-text-muted/15" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
