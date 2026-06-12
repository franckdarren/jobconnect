export default function EmployerSearchLoading() {
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

      <div className="jc-card p-3 flex items-center justify-between">
        <div className="h-3 w-32 rounded bg-jc-text-muted/15" />
        <div className="h-3 w-40 rounded bg-jc-text-muted/15" />
      </div>

      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="jc-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-full bg-jc-text-muted/20 shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-3/4 rounded bg-jc-text-muted/20" />
                <div className="h-3 w-1/2 rounded bg-jc-text-muted/15" />
                <div className="h-3 w-1/3 rounded bg-jc-text-muted/15" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-black/[0.04] flex gap-2">
              <div className="h-5 w-16 rounded-full bg-jc-text-muted/15" />
              <div className="h-5 w-20 rounded-full bg-jc-text-muted/15" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
