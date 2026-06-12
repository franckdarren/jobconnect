export default function CandidateProfileLoading() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      <div className="jc-card p-5 flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-jc-text-muted/20 shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-40 rounded bg-jc-text-muted/20" />
          <div className="h-4 w-28 rounded bg-jc-text-muted/15" />
          <div className="h-3 w-24 rounded bg-jc-text-muted/15" />
        </div>
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <section key={i} className="jc-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 rounded bg-jc-text-muted/20" />
            <div className="h-7 w-7 rounded-full bg-jc-text-muted/15" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-jc-text-muted/15" />
            <div className="h-4 w-5/6 rounded bg-jc-text-muted/15" />
            <div className="h-4 w-2/3 rounded bg-jc-text-muted/15" />
          </div>
        </section>
      ))}
    </div>
  );
}
