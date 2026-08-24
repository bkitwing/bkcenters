/**
 * Display formatting for PAD place strings (mostly ALL CAPS).
 * Keep in sync with formatCenterName() in scripts/strapi-sync.js.
 */

export function titleCaseWords(str: string): string {
  if (!str) return str;
  return str
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

/** Title-case, then uppercase the letter after each "." (I.S.R.O, J.P.Nagar, H.No). */
export function formatCenterName(str: string): string {
  if (!str) return str;
  return titleCaseWords(str).replace(/\.([a-z])/g, (_, c) => '.' + c.toUpperCase());
}
