import { AppSettings, DEFAULT_SETTINGS } from "@/lib/settings";

/**
 * Server-side settings read for the root layout.
 *
 * Falls back to the defaults instead of throwing: the layout wraps every route,
 * so an unreachable database here would turn a degraded page into a blank 500.
 * `ObjectList` already treats a failed query the same way.
 */
export async function readSettings(): Promise<AppSettings> {
  try {
    const { db } = await import("@/db/client");
    const { DrizzleSettingsRepository } = await import(
      "@/repositories/drizzle-settings-repository"
    );
    const { SelectSettingsUseCase } = await import(
      "@/use-cases/select-settings"
    );

    const settings = await new SelectSettingsUseCase(
      new DrizzleSettingsRepository(db),
    ).execute();

    return { locale: settings.locale, currency: settings.currency };
  } catch (err) {
    console.error("Error reading settings, falling back to defaults", err);
    return DEFAULT_SETTINGS;
  }
}
