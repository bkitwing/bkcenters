/**
 * Runs once when the Next.js server process starts (PM2 start/restart).
 * Starts loading the in-memory center index right away, so the first visitors
 * after a deploy get instant nearby/center search instead of the slower
 * Strapi fallback while it loads.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // Not during `next build` — only for the running server
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  const { getNearbyIndex } = await import('./lib/nearbyIndex');
  getNearbyIndex();
}
