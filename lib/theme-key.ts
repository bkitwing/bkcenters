/*
 * Shared theme storage for every brahmakumaris.com app (wisdom, about,
 * contact, initiatives, news, events, centers on www; courses on its own
 * subdomain). Keep this file identical in every repo.
 *
 * - Apps on www share one localStorage key (same origin).
 * - A cookie on .brahmakumaris.com carries the choice across subdomains
 *   (e.g. courses.brahmakumaris.com), where localStorage is not shared.
 *
 * Plain module (no "use client") so server layouts can import it.
 */

export const BK_THEME_STORAGE_KEY = "bk-theme";
const COOKIE = "bk-theme";

/**
 * Inline script for <head>, run before next-themes reads storage:
 * the cross-site cookie wins (latest choice anywhere); otherwise this app's
 * old per-site key is carried over once.
 */
export function themeMigrationScript(oldKey: string): string {
  return `try{var s=localStorage,k=${JSON.stringify(BK_THEME_STORAGE_KEY)},m=document.cookie.match(/(?:^|; )${COOKIE}=(light|dark)/);if(m){s.setItem(k,m[1])}else if(!s.getItem(k)){var o=s.getItem(${JSON.stringify(oldKey)});if(o==="light"||o==="dark")s.setItem(k,o)}}catch(e){}`;
}

/** Remember the theme for every brahmakumaris.com subdomain (no-op elsewhere, e.g. localhost). */
export function writeThemeCookie(mode: "light" | "dark"): void {
  if (typeof document === "undefined") return;
  if (!/(^|\.)brahmakumaris\.com$/.test(window.location.hostname)) return;
  document.cookie = `${COOKIE}=${mode}; domain=.brahmakumaris.com; path=/; max-age=31536000; SameSite=Lax`;
}
