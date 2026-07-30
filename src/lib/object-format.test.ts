import { test, describe } from "node:test";
import assert from "node:assert";
import {
  currencyAffix,
  formatPrice,
  formatReviewDate,
  formatTimeLeft,
  isReadyToDecide,
  progressPercentage,
  reviewDaysBetween,
} from "./object-format";

/**
 * Assertions on formatted output use `includes` rather than exact equality:
 * ICU inserts a non-breaking space between amount and symbol and the exact
 * codepoint has changed across Node releases. The digit grouping and the symbol
 * are what this code is responsible for.
 */
function normalise(value: string): string {
  return value.replace(/ | /g, " ");
}

const EUR_IT = { locale: "it-IT", currency: "EUR" };
const USD_US = { locale: "en-US", currency: "USD" };

describe("formatPrice", () => {
  test("should render cents as major units with two decimals", () => {
    assert.ok(normalise(formatPrice(34900, EUR_IT)).includes("349,00"));
    assert.ok(normalise(formatPrice(500, EUR_IT)).includes("5,00"));
  });

  test("should use the decimal separator of the given locale", () => {
    assert.ok(normalise(formatPrice(34900, USD_US)).includes("349.00"));
  });

  test("should render the symbol of the given currency", () => {
    assert.ok(normalise(formatPrice(1000, EUR_IT)).includes("€"));
    assert.ok(normalise(formatPrice(1000, USD_US)).includes("$"));
  });

  test("should group thousands", () => {
    const formatted = normalise(formatPrice(123456789, USD_US));
    assert.ok(
      formatted.includes("1,234,567.89"),
      `expected grouped thousands, got ${formatted}`,
    );
  });

  test("should keep a currency independent of the locale", () => {
    // Being in Italy while thinking in dollars is a valid combination.
    const formatted = normalise(formatPrice(34900, { locale: "it-IT", currency: "USD" }));
    assert.ok(formatted.includes("349,00"), `got ${formatted}`);
    assert.ok(formatted.includes("USD") || formatted.includes("$"), `got ${formatted}`);
  });
});

describe("currencyAffix", () => {
  test("should report the symbol before the amount for en-US dollars", () => {
    const affix = currencyAffix(USD_US);

    assert.strictEqual(affix.position, "prefix");
    assert.strictEqual(affix.symbol, "$");
  });

  test("should report the symbol after the amount for it-IT euros", () => {
    const affix = currencyAffix(EUR_IT);

    assert.strictEqual(affix.position, "suffix");
    assert.strictEqual(affix.symbol, "€");
  });
});

describe("formatReviewDate", () => {
  const date = new Date("2026-08-29T10:00:00Z");

  test("should render day, month and year in the given locale", () => {
    const formatted = formatReviewDate(date, "en-GB");

    assert.ok(formatted.includes("29"), `got ${formatted}`);
    assert.ok(formatted.includes("2026"), `got ${formatted}`);
    assert.ok(formatted.includes("Aug"), `got ${formatted}`);
  });

  test("should follow the locale rather than a hardcoded format", () => {
    assert.notStrictEqual(
      formatReviewDate(date, "en-GB"),
      formatReviewDate(date, "it-IT"),
    );
  });

  test("should accept an ISO string as well as a Date", () => {
    assert.strictEqual(
      formatReviewDate("2026-08-29T10:00:00Z", "en-GB"),
      formatReviewDate(date, "en-GB"),
    );
  });
});

describe("progressPercentage", () => {
  const createdAt = new Date("2026-01-01T00:00:00Z");
  const reviewAt = new Date("2026-01-11T00:00:00Z");

  test("should report the share of the wait already elapsed", () => {
    const now = new Date("2026-01-03T00:00:00Z");

    assert.strictEqual(progressPercentage(createdAt, reviewAt, now), 20);
  });

  test("should clamp outside the window", () => {
    assert.strictEqual(
      progressPercentage(createdAt, reviewAt, new Date("2025-12-01T00:00:00Z")),
      0,
    );
    assert.strictEqual(
      progressPercentage(createdAt, reviewAt, new Date("2026-06-01T00:00:00Z")),
      100,
    );
  });

  test("should report a complete wait when the window has no duration", () => {
    assert.strictEqual(progressPercentage(createdAt, createdAt, createdAt), 100);
  });
});

describe("formatTimeLeft", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  test("should count down in days and hours while far out", () => {
    assert.strictEqual(
      formatTimeLeft(new Date("2026-01-13T04:00:00Z"), now),
      "12d 4h left",
    );
  });

  test("should drop to hours and minutes inside a day", () => {
    assert.strictEqual(
      formatTimeLeft(new Date("2026-01-01T05:30:00Z"), now),
      "5h 30m left",
    );
  });

  test("should drop to minutes inside an hour", () => {
    assert.strictEqual(
      formatTimeLeft(new Date("2026-01-01T00:07:00Z"), now),
      "7m left",
    );
  });

  test("should announce readiness once the review date has passed", () => {
    assert.strictEqual(
      formatTimeLeft(new Date("2025-12-31T00:00:00Z"), now),
      "Ready to decide",
    );
  });
});

describe("reviewDaysBetween", () => {
  test("should return the length of the wait in whole days", () => {
    assert.strictEqual(
      reviewDaysBetween("2026-01-01T00:00:00Z", "2026-01-31T00:00:00Z"),
      30,
    );
  });

  test("should fall back to 30 for a zero length wait", () => {
    assert.strictEqual(
      reviewDaysBetween("2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z"),
      30,
    );
  });
});

describe("isReadyToDecide", () => {
  test("should be true from the review instant onwards", () => {
    const at = new Date("2026-01-01T00:00:00Z");

    assert.strictEqual(isReadyToDecide(at, at), true);
    assert.strictEqual(
      isReadyToDecide(at, new Date("2025-12-31T23:59:59Z")),
      false,
    );
  });
});
