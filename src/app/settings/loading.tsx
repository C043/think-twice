import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { iconButton } from "@/components/ui/styles";

/**
 * Settings waits on the same settings row the root layout reads, so the two
 * forms cannot render until it lands. The headings and the back link do not
 * depend on it and are drawn for real — the back link in particular, so leaving
 * a page you opened by mistake never needs the query to finish first.
 */
export default function Loading() {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center">
      <header className="sticky top-0 z-30 w-full border-b border-line bg-background pt-[env(safe-area-inset-top)]">
        <div
          className="mx-auto flex w-full max-w-xl items-center gap-2 py-3
                     pr-[max(1.25rem,env(safe-area-inset-right))]
                     pl-[max(1.25rem,env(safe-area-inset-left))]"
        >
          <Link href="/" aria-label="Back" className={iconButton}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[17px] font-semibold tracking-tight text-foreground">
            Settings
          </h1>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-xl flex-1 space-y-8 pt-5 sm:pt-7
                   pb-[calc(4rem+env(safe-area-inset-bottom))]
                   pr-[max(1.25rem,env(safe-area-inset-right))]
                   pl-[max(1.25rem,env(safe-area-inset-left))]"
      >
        <p className="sr-only" role="status">
          Loading settings…
        </p>

        <section aria-hidden className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
              Appearance
            </h2>
            <p className="text-[13px] leading-relaxed text-muted">
              Stored on this device only, so each device can differ.
            </p>
          </div>
          {/* The three-way theme selector: same grid, same 40px cells. */}
          <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-line bg-surface-muted p-1.5">
            <span className="skeleton h-10 rounded-lg" />
            <span className="skeleton h-10 rounded-lg" />
            <span className="skeleton h-10 rounded-lg" />
          </div>
        </section>

        <section aria-hidden className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
              Region
            </h2>
            <p className="text-[13px] leading-relaxed text-muted">
              Shared by every device, since prices and dates are formatted on the
              server too.
            </p>
          </div>

          <div className="space-y-4">
            {/* Two labelled selects: a 16px label over a 48px control. */}
            <div className="space-y-1.5">
              <span className="skeleton block h-4 w-40 rounded" />
              <span className="skeleton block h-12 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <span className="skeleton block h-4 w-20 rounded" />
              <span className="skeleton block h-12 w-full rounded-xl" />
            </div>

            <div className="rounded-xl border border-line bg-surface-muted px-3.5 py-3">
              <span className="skeleton block h-4 w-16 rounded" />
              <div className="mt-2 flex h-6 items-center justify-between gap-3">
                <span className="skeleton h-4 w-20 rounded" />
                <span className="skeleton h-3 w-24 rounded" />
              </div>
            </div>

            <span className="skeleton block h-11 w-full rounded-xl" />
          </div>
        </section>
      </main>
    </div>
  );
}
