export default function EmployerDashboardLoading() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      <header className="flex items-center justify-between">
        <div className="h-7 md:h-8 w-52 rounded bg-jc-text-muted/20" />
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="jc-card p-4 space-y-2">
            <div className="h-4 w-24 rounded bg-jc-text-muted/15" />
            <div className="h-8 w-12 rounded bg-jc-text-muted/20" />
            <div className="h-3 w-28 rounded bg-jc-text-muted/15" />
          </div>
        ))}
      </div>

      <div className="jc-card p-4 bg-jc-primary-dark/95 space-y-2">
        <div className="h-3 w-32 rounded bg-white/20" />
        <div className="h-5 w-48 rounded bg-white/20" />
        <div className="h-3 w-2/3 rounded bg-white/15" />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 rounded bg-jc-text-muted/20" />
        </div>
        <ul className="grid gap-2 md:grid-cols-2 md:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="jc-card p-3 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-jc-text-muted/20 shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-1/2 rounded bg-jc-text-muted/20" />
                <div className="h-3 w-1/3 rounded bg-jc-text-muted/15" />
                <div className="h-3 w-2/3 rounded bg-jc-text-muted/15" />
              </div>
              <div className="h-5 w-14 rounded-full bg-jc-text-muted/15 shrink-0" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
