import { test, describe } from "node:test";
import assert from "node:assert";
import { TICK_MS, tickSnapshot, tickToDate } from "./clock";

/**
 * `useSyncExternalStore` calls getSnapshot on every render and bails out only
 * when the value is referentially equal to the previous one. A snapshot of
 * `Date.now()` therefore never settles and React throws
 * "The result of getSnapshot should be cached". Bucketing is what makes it a
 * legal store, so that is what these tests pin down.
 */
describe("tickSnapshot", () => {
  test("should return the same value twice inside one bucket", () => {
    const base = 1_800_000_000_000;

    assert.strictEqual(tickSnapshot(base), tickSnapshot(base + 1));
    assert.strictEqual(tickSnapshot(base), tickSnapshot(base + TICK_MS - 1));
  });

  test("should change once the bucket boundary is crossed", () => {
    const base = 1_800_000_000_000;

    assert.notStrictEqual(tickSnapshot(base), tickSnapshot(base + TICK_MS));
  });

  test("should be monotonic", () => {
    const base = 1_800_000_000_000;

    assert.ok(tickSnapshot(base + TICK_MS * 3) > tickSnapshot(base));
  });

  test("should return a primitive, so referential equality holds", () => {
    assert.strictEqual(typeof tickSnapshot(1_800_000_000_000), "number");
  });
});

describe("tickToDate", () => {
  test("should rebuild a Date at the start of the bucket", () => {
    const base = 1_800_000_000_000;
    const date = tickToDate(tickSnapshot(base));

    assert.ok(date instanceof Date);
    assert.strictEqual(date.getTime() % TICK_MS, 0);
  });

  test("should stay within one tick of the instant it came from", () => {
    const base = 1_800_000_000_123;
    const drift = base - tickToDate(tickSnapshot(base)).getTime();

    assert.ok(drift >= 0 && drift < TICK_MS, `drift was ${drift}ms`);
  });

  test("should round trip every bucket boundary it produces", () => {
    const base = 1_800_000_000_000;

    for (let i = 0; i < 5; i += 1) {
      const at = base + TICK_MS * i;
      assert.strictEqual(tickToDate(tickSnapshot(at)).getTime(), at);
    }
  });
});
