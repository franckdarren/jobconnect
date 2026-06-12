export default function EmployerJobDetailLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="jc-card p-4 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-2/3 rounded bg-jc-text-muted/20" />
          <div className="h-3 w-1/3 rounded bg-jc-text-muted/15" />
        </div>
        <div className="h-9 w-9 rounded-full bg-jc-text-muted/15" />
      </div>

      <div className="grid grid-cols-2 gap-2 bg-jc-background p-1 rounded-xl">
        <div className="h-9 rounded-md bg-white" />
        <div className="h-9 rounded-md bg-jc-text-muted/10" />
      </div>

      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="jc-card p-4 flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-jc-text-muted/20 shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 w-1/2 rounded bg-jc-text-muted/20" />
              <div className="h-3 w-1/3 rounded bg-jc-text-muted/15" />
              <div className="h-3 w-2/3 rounded bg-jc-text-muted/15" />
            </div>
            <div className="h-5 w-16 rounded-full bg-jc-text-muted/15 shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}
