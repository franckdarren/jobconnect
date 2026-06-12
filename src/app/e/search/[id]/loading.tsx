export default function CandidateDetailLoading() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      <div className="h-4 w-40 rounded bg-jc-text-muted/20" />

      <article className="jc-card overflow-hidden">
        <div className="bg-jc-primary-dark/95 p-5">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-white/15 shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-5 w-40 rounded bg-white/20" />
              <div className="h-4 w-32 rounded bg-white/15" />
              <div className="flex gap-2 pt-1">
                <div className="h-3 w-16 rounded bg-white/15" />
                <div className="h-3 w-20 rounded bg-white/15" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="rounded-xl bg-jc-background p-4 space-y-2">
            <div className="h-4 w-32 mx-auto rounded bg-jc-text-muted/20" />
            <div className="h-3 w-2/3 mx-auto rounded bg-jc-text-muted/15" />
          </div>
          <div className="h-11 w-full rounded-xl bg-jc-text-muted/20" />
        </div>
      </article>

      <section className="jc-card p-4 space-y-2">
        <div className="h-4 w-32 rounded bg-jc-text-muted/20" />
        <div className="flex flex-wrap gap-2">
          <div className="h-7 w-16 rounded-full bg-jc-text-muted/15" />
          <div className="h-7 w-20 rounded-full bg-jc-text-muted/15" />
          <div className="h-7 w-14 rounded-full bg-jc-text-muted/15" />
          <div className="h-7 w-24 rounded-full bg-jc-text-muted/15" />
        </div>
      </section>
    </div>
  );
}
