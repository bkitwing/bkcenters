/**
 * Ref-counted body scroll lock so multiple overlays (menu, mini player, etc.)
 * can coexist without leaving overflow:hidden stuck after one closes.
 */
let lockCount = 0;

export function lockBodyScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  if (lockCount === 0) {
    document.body.style.overflow = "hidden";
  }
  lockCount++;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = "";
    }
  };
}

/** Force-clear all locks — safety net on route changes. */
export function resetBodyScrollLock(): void {
  if (typeof document === "undefined") return;
  lockCount = 0;
  document.body.style.overflow = "";
}
