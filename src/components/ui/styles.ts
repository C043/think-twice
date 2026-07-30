/**
 * Shared class strings for the handful of controls the app reuses.
 *
 * Plain constants rather than components: the markup around each control still
 * differs (icons, swipe rows, submit vs button), only the skin is shared.
 *
 * Transitions name their properties instead of using `transition-all`: `all`
 * makes the browser watch every animatable property on the element, so a
 * hover ends up recomputing layout-affecting ones it never needed to touch.
 */

/** 40px square, glassy on hover. Used by every header control. */
export const iconButton =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted " +
  "transition-[background-color,color,transform] duration-200 hover:bg-surface hover:text-foreground " +
  "active:scale-95 disabled:pointer-events-none disabled:opacity-40 cursor-pointer";

/** Filled accent action: submit, confirm. */
export const primaryButton =
  "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 " +
  "text-sm font-semibold text-white shadow-card transition-[background-color,transform] duration-200 " +
  "hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

/** Quiet action sitting next to a primary one: cancel, dismiss. */
export const secondaryButton =
  "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line " +
  "bg-surface px-4 text-sm font-semibold text-foreground transition-[background-color,border-color,transform] duration-200 " +
  "hover:bg-surface-muted hover:border-line-strong active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

/** Destructive confirm inside a modal. */
export const dangerButton =
  "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 " +
  "text-sm font-semibold text-white shadow-card transition-[background-color,transform] duration-200 " +
  "hover:bg-red-500 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

export const fieldLabel =
  "block text-xs font-semibold uppercase tracking-wider text-muted";

export const fieldInput =
  "h-12 w-full rounded-xl border border-line bg-surface-muted px-3.5 text-[15px] " +
  "text-foreground placeholder:text-muted/60 transition-[background-color,border-color,box-shadow] duration-200 " +
  "focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/15 focus:outline-none";
