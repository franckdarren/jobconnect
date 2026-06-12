export default function NotificationsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <header className="flex items-center justify-between">
        <div className="h-7 md:h-8 w-40 rounded bg-jc-text-muted/20" />
        <div className="h-8 w-24 rounded-full bg-jc-text-muted/15" />
      </header>

      <ul className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="jc-card p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-jc-text-muted/20 shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 w-3/4 rounded bg-jc-text-muted/20" />
              <div className="h-3 w-full rounded bg-jc-text-muted/15" />
              <div className="h-3 w-1/3 rounded bg-jc-text-muted/15" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
