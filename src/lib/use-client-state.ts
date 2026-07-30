"use client";

import { useSyncExternalStore } from "react";
import { TICK_MS, tickSnapshot, tickToDate } from "./clock";
import {
  PushCapabilities,
  SERVER_PUSH_CAPABILITIES,
  probePushCapabilities,
} from "./push-client";

/** Nothing to subscribe to: hydration happens once and never reverts. */
function subscribeToNothing(): () => void {
  return () => {};
}

/**
 * True once the component has hydrated, false while server-rendering.
 *
 * The usual shape for this is `useState(false)` plus an effect that immediately
 * sets it to true, which is a cascading render by construction. A store with a
 * different server snapshot expresses the same thing declaratively, and is what
 * `useSyncExternalStore`'s third argument is for.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

function subscribeToClock(onStoreChange: () => void): () => void {
  const interval = setInterval(onStoreChange, TICK_MS);
  return () => clearInterval(interval);
}

/**
 * Current time, refreshed every tick, `null` until hydrated.
 *
 * Null rather than a server value on purpose: the server has no clock the client
 * would agree with, and rendering one would guarantee a hydration mismatch on
 * every countdown.
 */
export function useNow(): Date | null {
  const tick = useSyncExternalStore(
    subscribeToClock,
    () => tickSnapshot(Date.now()),
    () => null,
  );

  return tick === null ? null : tickToDate(tick);
}

/**
 * What this browser can do about push notifications.
 *
 * A store rather than state set from an effect: the values are read from the
 * browser once and never change, so there is nothing to synchronise afterwards.
 */
export function usePushCapabilities(): PushCapabilities {
  return useSyncExternalStore(
    subscribeToNothing,
    probePushCapabilities,
    () => SERVER_PUSH_CAPABILITIES,
  );
}
