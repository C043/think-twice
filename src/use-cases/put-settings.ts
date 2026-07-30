import { AppError } from "@/errors/AppError";
import { DrizzleSettingsRepository } from "@/repositories/drizzle-settings-repository";

interface PutSettingsInput {
  locale: string;
  currency: string;
}

/**
 * Both values are fed straight to `Intl`, which throws a RangeError on garbage.
 * Validating on the way in means a bad write cannot take the whole list down at
 * render time, when there is no good way to recover.
 */
function canonicaliseLocale(locale: string): string {
  if (!locale || locale.trim() === "") {
    throw new AppError("Locale is mandatory", 400);
  }

  try {
    const [canonical] = Intl.getCanonicalLocales(locale.trim());

    if (!canonical) {
      throw new AppError("Locale is not valid", 400);
    }

    return canonical;
  } catch (err) {
    if (err instanceof AppError) throw err;

    throw new AppError("Locale is not valid", 400);
  }
}

function canonicaliseCurrency(currency: string): string {
  if (!currency || currency.trim() === "") {
    throw new AppError("Currency is mandatory", 400);
  }

  const candidate = currency.trim().toUpperCase();

  if (!Intl.supportedValuesOf("currency").includes(candidate)) {
    throw new AppError("Currency is not a known ISO 4217 code", 400);
  }

  return candidate;
}

export class PutSettingsUseCase {
  constructor(private settingsRepository: DrizzleSettingsRepository) {}

  async execute(input: PutSettingsInput) {
    // Both validated before any write, so a rejected payload leaves the stored
    // settings untouched rather than half applied.
    const locale = canonicaliseLocale(input.locale);
    const currency = canonicaliseCurrency(input.currency);

    return await this.settingsRepository.update({ locale, currency });
  }
}
