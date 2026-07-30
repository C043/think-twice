/**
 * Presentation helpers shared by the object list and the object form.
 *
 * Deliberately free of React and of `Date.now()` — the caller passes `now` in —
 * so the same numbers can be rendered on the server and asserted in tests
 * without freezing the clock.
 *
 * The same applies to locale and currency: they are arguments, never read from
 * the environment. Prices and dates are formatted during SSR as well, and an
 * implicit locale would resolve differently in Node and in the browser, so the
 * markup would not match on hydration.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_MINUTE = 1000 * 60;

export interface MoneyFormat {
  locale: string;
  currency: string;
}

/** Cents rendered as major units in the given locale and currency. */
export function formatPrice(cents: number, format: MoneyFormat): string {
  return new Intl.NumberFormat(format.locale, {
    style: "currency",
    currency: format.currency,
  }).format(cents / 100);
}

/**
 * Which side of the amount the currency symbol belongs on, for the price input
 * where the symbol sits outside the field. `it-IT` puts the euro after the
 * number, `en-US` puts the dollar before it, so neither can be hardcoded.
 */
export function currencyAffix(format: MoneyFormat): {
  symbol: string;
  position: "prefix" | "suffix";
} {
  const parts = new Intl.NumberFormat(format.locale, {
    style: "currency",
    currency: format.currency,
  }).formatToParts(1);

  const symbolIndex = parts.findIndex((part) => part.type === "currency");
  const numberIndex = parts.findIndex((part) => part.type === "integer");

  return {
    symbol: parts[symbolIndex]?.value ?? format.currency,
    position: symbolIndex < numberIndex ? "prefix" : "suffix",
  };
}

/** Percentage of the waiting period already elapsed, clamped to 0..100. */
export function progressPercentage(
  createdAt: Date | string,
  reviewAt: Date | string,
  now: Date,
): number {
  const start = new Date(createdAt).getTime();
  const end = new Date(reviewAt).getTime();

  const totalDuration = end - start;
  if (totalDuration <= 0) return 100;

  const percentage = ((now.getTime() - start) / totalDuration) * 100;

  return Math.max(0, Math.min(100, percentage));
}

/** Length of the waiting period in whole days, as the form expects it. */
export function reviewDaysBetween(
  createdAt: Date | string,
  reviewAt: Date | string,
): number {
  const diffInMs = new Date(reviewAt).getTime() - new Date(createdAt).getTime();

  return Math.round(diffInMs / MS_PER_DAY) || 30;
}

/**
 * Coarse "time left" label. Only the two most significant units are shown:
 * at this granularity "11d 4h 23m" reads as noise.
 */
export function formatTimeLeft(reviewAt: Date | string, now: Date): string {
  const remaining = new Date(reviewAt).getTime() - now.getTime();

  if (remaining <= 0) return "Ready to decide";

  const days = Math.floor(remaining / MS_PER_DAY);
  const hours = Math.floor((remaining % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((remaining % MS_PER_HOUR) / MS_PER_MINUTE);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m left`;

  return "Less than a minute left";
}

/** Absolute review date in the given locale, e.g. "29 Aug 2026". */
export function formatReviewDate(
  reviewAt: Date | string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(reviewAt));
}

export function isReadyToDecide(reviewAt: Date | string, now: Date): boolean {
  return new Date(reviewAt).getTime() <= now.getTime();
}
