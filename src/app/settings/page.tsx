import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import ThemeSelector from "@/components/settings/ThemeSelector";
import RegionForm from "@/components/settings/RegionForm";
import { readSettings } from "@/lib/read-settings";
import { iconButton } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Settings — Think Twice",
};

export default async function SettingsPage() {
  const settings = await readSettings();

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
        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
              Appearance
            </h2>
            <p className="text-[13px] leading-relaxed text-muted">
              Stored on this device only, so each device can differ.
            </p>
          </div>
          <ThemeSelector />
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
              Region
            </h2>
            <p className="text-[13px] leading-relaxed text-muted">
              Shared by every device, since prices and dates are formatted on the
              server too.
            </p>
          </div>
          <RegionForm initial={settings} />
        </section>
      </main>
    </div>
  );
}
