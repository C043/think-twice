import Link from "next/link";
import { Suspense } from "react";
import { Settings } from "lucide-react";
import AddObjectComponent from "@/components/AddObjectComponent";
import ObjectList from "@/components/ObjectList";
import ObjectListSkeleton from "@/components/ObjectListSkeleton";
import PushNotificationsToggle from "@/components/PushNotificationsToggle";
import InstallPwaButton from "@/components/InstallPwaButton";
import { iconButton } from "@/components/ui/styles";

export default function Home() {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center">
      {/* Glassy bar so the controls stay reachable while the list scrolls. */}
      {/* Opaque, no backdrop-filter: blurring what is behind a sticky bar means
          re-reading and re-blurring that region on every scroll frame, which is
          the single most expensive thing a header can do. */}
      {/* The inset is zero with statusBarStyle "default", but it is what keeps
          the bar clear of the notch in landscape, and what would save the layout
          if the status bar style ever went back to translucent. */}
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

          <div className="flex items-center gap-0.5">
            <InstallPwaButton />
            <PushNotificationsToggle />
            <Link href="/settings" aria-label="Settings" className={iconButton}>
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Tighter on phones, where the header, the heading and the room left for
          the floating button were together eating most of a small viewport. The
          bottom padding clears the button: 3.5rem tall, sitting 1.75rem up. */}
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

        {/* The header, the heading and the add button do not depend on the
            database, so they are sent as soon as they render and the list
            streams in behind them. Without the boundary the whole document
            waits on the query, and a cold Postgres connection is long enough
            for that to look like a broken app. */}
        <Suspense fallback={<ObjectListSkeleton />}>
          <ObjectList />
        </Suspense>
      </main>

      <AddObjectComponent />
    </div>
  );
}
