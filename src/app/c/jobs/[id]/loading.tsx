export default function JobDetailLoading() {
  return (
    <div className="pb-24 md:pb-0 animate-pulse">
      <div className="flex items-center gap-2 mb-3 md:hidden">
        <div className="w-5 h-5 rounded bg-jc-text-muted/20" />
        <div className="h-5 w-32 rounded bg-jc-text-muted/20" />
      </div>

      <div className="hidden md:block h-4 w-40 rounded bg-jc-text-muted/20 mb-4" />

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-2 space-y-4">
          <article className="jc-card overflow-hidden">
            <div className="w-full h-40 md:h-56 bg-jc-text-muted/15" />
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-jc-text-muted/20 shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-jc-text-muted/20" />
                  <div className="h-4 w-1/2 rounded bg-jc-text-muted/15" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="h-5 w-20 rounded-full bg-jc-text-muted/15" />
                <div className="h-5 w-16 rounded-full bg-jc-text-muted/15" />
                <div className="h-5 w-24 rounded-full bg-jc-text-muted/15" />
              </div>
            </div>
          </article>

          <section className="mt-4 space-y-2">
            <div className="h-6 w-48 rounded bg-jc-text-muted/20" />
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-jc-text-muted/15" />
              <div className="h-3 w-full rounded bg-jc-text-muted/15" />
              <div className="h-3 w-5/6 rounded bg-jc-text-muted/15" />
              <div className="h-3 w-2/3 rounded bg-jc-text-muted/15" />
            </div>
          </section>

          <section className="mt-4 space-y-2">
            <div className="h-6 w-44 rounded bg-jc-text-muted/20" />
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-16 rounded-full bg-jc-text-muted/15" />
              <div className="h-7 w-20 rounded-full bg-jc-text-muted/15" />
              <div className="h-7 w-14 rounded-full bg-jc-text-muted/15" />
              <div className="h-7 w-24 rounded-full bg-jc-text-muted/15" />
            </div>
          </section>
        </div>

        <aside className="hidden md:block md:col-span-1">
          <div className="sticky top-6 jc-card p-5 space-y-3">
            <div className="h-5 w-40 rounded bg-jc-text-muted/20" />
            <div className="h-3 w-full rounded bg-jc-text-muted/15" />
            <div className="h-11 w-full rounded-xl bg-jc-text-muted/20" />
          </div>
        </aside>
      </div>

      <div className="md:hidden fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0))] inset-x-0 z-30 max-w-md mx-auto px-4">
        <div className="h-11 rounded-xl bg-jc-text-muted/25" />
      </div>
    </div>
  );
}
