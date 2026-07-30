/**
 * The passing of time as an external store.
 *
 * A countdown is not React state to be seeded in an effect: it is a subscription
 * to something outside React. Modelling it as a store keeps the render pure, and
 * gives the "no clock on the server" behaviour for free, since
 * `useSyncExternalStore` takes a separate server snapshot.
 *
 * The buckets exist because getSnapshot runs on every render and React bails out
 * only on referential equality — a raw `Date.now()` would never settle.
 */

export const TICK_MS = 10_000;

/** Current instant reduced to a bucket index. Stable within the bucket. */
export function tickSnapshot(nowMs: number): number {
  return Math.floor(nowMs / TICK_MS);
}

/** The instant a bucket started. */
export function tickToDate(tick: number): Date {
  return new Date(tick * TICK_MS);
}
