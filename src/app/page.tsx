import Link from "next/link";
import { Settings } from "lucide-react";
import AddObjectComponent from "@/components/AddObjectComponent";
import ObjectList from "@/components/ObjectList";
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
      <header className="sticky top-0 z-30 w-full border-b border-line bg-background">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-5 py-3">
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

      <main className="mx-auto w-full max-w-xl flex-1 px-5 pt-7 pb-36">
        <div className="mb-6 space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Your objects
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Every timer still running is money you have not spent yet.
          </p>
        </div>

        <ObjectList />
      </main>

      <AddObjectComponent />
    </div>
  );
}
