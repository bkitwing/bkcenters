/**
 * Sticky / fixed top offset under the floating pill header.
 * `--bk-header-h` is measured by UnifiedHeader (wrap top → pill bottom)
 * and already includes safe-area inset padding on the wrap.
 * `--bk-sticky-h` is set by StickyActionBar / MovieTopBar when docked.
 */
export const HEADER_OFFSET = "var(--bk-header-h, 4.75rem)";

/** Alias for sticky sub-bars that sit directly under the pill. */
export const HEADER_STICKY_TOP = "var(--bk-header-h, 4.75rem)";

/** Combined clearance for in-page anchors under header + sticky chrome. */
export const SCROLL_OFFSET =
  "calc(var(--bk-header-h, 4.75rem) + var(--bk-sticky-h, 3.25rem) + 0.75rem)";
