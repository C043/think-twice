/**
 * Shape of the settings the UI needs, plus the fallback used when the database
 * cannot be reached. Mirrors the column defaults in `settingsTable`.
 */
export interface AppSettings {
  locale: string;
  currency: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  locale: "it-IT",
  currency: "EUR",
};

/**
 * Curated shortlist for the pickers. The API validates against the full ISO
 * 4217 set and the whole BCP 47 space, so a value set by hand keeps working —
 * a select with three hundred options just is not a picker.
 */
export const LOCALE_OPTIONS = [
  { value: "it-IT", label: "Italiano (Italia)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-US", label: "English (US)" },
  { value: "de-DE", label: "Deutsch (Deutschland)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "pt-PT", label: "Português (Portugal)" },
  { value: "nl-NL", label: "Nederlands (Nederland)" },
];

export const CURRENCY_OPTIONS = [
  { value: "EUR", label: "Euro" },
  { value: "USD", label: "US Dollar" },
  { value: "GBP", label: "Pound Sterling" },
  { value: "CHF", label: "Swiss Franc" },
  { value: "SEK", label: "Swedish Krona" },
  { value: "JPY", label: "Japanese Yen" },
  { value: "CAD", label: "Canadian Dollar" },
  { value: "AUD", label: "Australian Dollar" },
];
