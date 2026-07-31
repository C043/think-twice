"use client";

import { useEffect } from "react";

/**
 * Blocks every zoom gesture the viewport meta cannot.
 *
 * `user-scalable=no` is honoured by standalone iOS but ignored by iOS Safari
 * proper, and the `touch-action: pan-x pan-y` in globals.css only covers the
 * engines that implement pinch through touch events (Chrome, Android). Safari
 * routes it through its own non-standard `gesture*` events instead, which
 * nothing but an explicit preventDefault stops.
 *
 * The listeners have to be non-passive: the browser assumes passive by default
 * for touch events and then ignores preventDefault entirely.
 */
export default function ZoomGuard() {
  useEffect(() => {
    const block = (event: Event) => event.preventDefault();

    // Two fingers on the glass is a pinch; one is a scroll and must go through.
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };

    const options = { passive: false } as const;

    document.addEventListener("gesturestart", block, options);
    document.addEventListener("gesturechange", block, options);
    document.addEventListener("gestureend", block, options);
    document.addEventListener("touchmove", onTouchMove, options);

    return () => {
      document.removeEventListener("gesturestart", block);
      document.removeEventListener("gesturechange", block);
      document.removeEventListener("gestureend", block);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return null;
}
