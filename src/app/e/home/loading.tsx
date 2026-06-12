export default function EmployerHomeLoading() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      <div className="jc-card p-5 bg-jc-primary-dark/95 space-y-3">
        <div className="h-4 w-32 rounded bg-white/20" />
        <div className="h-6 w-2/3 rounded bg-white/20" />
        <div className="h-3 w-3/4 rounded bg-white/15" />
        <div className="grid grid-cols-2 gap-3 mt-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white/10 p-3 space-y-1">
              <div className="h-6 w-10 rounded bg-white/20" />
              <div className="h-3 w-20 rounded bg-white/15" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="jc-card p-4 space-y-2">
            <div className="h-4 w-28 rounded bg-jc-text-muted/15" />
            <div className="h-8 w-12 rounded bg-jc-text-muted/20" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="h-6 w-36 rounded bg-jc-text-muted/20" />
            <div className="h-4 w-16 rounded bg-jc-text-muted/15" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="jc-card p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-jc-text-muted/20 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-4 w-3/4 rounded bg-jc-text-muted/20" />
                  <div className="h-3 w-1/3 rounded bg-jc-text-muted/15" />
                </div>
              </div>
            ))}
            <div className="h-9 w-full rounded-xl bg-jc-text-muted/15" />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="h-6 w-44 rounded bg-jc-text-muted/20" />
            <div className="h-4 w-16 rounded bg-jc-text-muted/15" />
          </div>
          <div className="jc-card p-6 space-y-2">
            <div className="h-3 w-2/3 mx-auto rounded bg-jc-text-muted/15" />
            <div className="h-3 w-1/2 mx-auto rounded bg-jc-text-muted/15" />
          </div>
        </section>
      </div>
    </div>
  );
}
