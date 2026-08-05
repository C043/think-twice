import ObjectListSkeleton from "@/components/ObjectListSkeleton";

/**
 * Shown while the home segment is being fetched — on the first paint of a cold
 * load, and on every client-side navigation back from Settings.
 *
 * Anything that does not come from the database is drawn for real: the title,
 * the heading, the strapline. Only the three header controls and the list are
 * placeholders, because those are the parts that genuinely are not there yet.
 * The layout below is the one in page.tsx, kept in step with it by hand — the
 * point of a skeleton is that nothing moves when the real page replaces it.
 */
export default function Loading() {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center">
      <header className="sticky top-0 z-30 w-full border-b border-line bg-background pt-[env(safe-area-inset-top)]">
        <div
          className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 py-3
                     pr-[max(1.25rem,env(safe-area-inset-right))]
                     pl-[max(1.25rem,env(safe-area-inset-left))]"
        >
          <div className="flex items-baseline gap-2">
            <h1 className="text-[17px] font-semibold tracking-tight text-foreground">
              Think Twice
            </h1>
            <span className="hidden text-[13px] text-muted sm:inline">
              buy it later, or not at all
            </span>
          </div>

          {/* The controls mount on hydration; 40px squares hold their place so
              the title does not slide sideways when they arrive. */}
          <div aria-hidden className="flex items-center gap-0.5">
            <span className="skeleton h-10 w-10 rounded-xl" />
            <span className="skeleton h-10 w-10 rounded-xl" />
            <span className="skeleton h-10 w-10 rounded-xl" />
          </div>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-xl flex-1 pt-5 sm:pt-7
                   pb-[calc(7rem+env(safe-area-inset-bottom))]
                   pr-[max(1.25rem,env(safe-area-inset-right))]
                   pl-[max(1.25rem,env(safe-area-inset-left))]"
      >
        <div className="mb-5 space-y-1 sm:mb-6 sm:space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Your objects
          </h2>
          <p className="hidden text-sm leading-relaxed text-muted sm:block">
            Every timer still running is money you have not spent yet.
          </p>
        </div>

        <ObjectListSkeleton />
      </main>
    </div>
  );
}
