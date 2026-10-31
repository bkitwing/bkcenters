import { Center } from './types';
import { loadCentersForNearby } from './strapiClient';
import { logger } from './logger';

/**
 * In-memory index of every center for /api/centers/nearby.
 *
 * The app runs as a long-lived Node process (PM2), so we load all ~6k centers
 * once and keep them in memory. A nearby lookup then becomes an in-memory scan
 * (a few ms) instead of a Strapi round trip per search (~1s), and we can report
 * the true number of centers within a radius.
 *
 * - First request after a restart: returns null (caller falls back to the
 *   Strapi bbox query) while the index loads in the background.
 * - After REFRESH_AFTER_MS the index is served stale while it reloads.
 */

export type IndexedCenter = { center: Center; lat: number; lng: number };

const REFRESH_AFTER_MS = 30 * 60 * 1000;

type IndexStore = {
  entries: IndexedCenter[] | null;
  /** Every center, including the few without coordinates (for name search) */
  allCenters: Center[] | null;
  loadedAt: number;
  inflight: Promise<void> | null;
};

// On globalThis so every API route (nearby, search) and dev hot reloads share
// one copy per process instead of each loading its own.
const globalStore = globalThis as typeof globalThis & { __bkNearbyIndex?: IndexStore };
const store: IndexStore = (globalStore.__bkNearbyIndex ??= {
  entries: null,
  allCenters: null,
  loadedAt: 0,
  inflight: null,
});

function refresh(): Promise<void> {
  if (!store.inflight) {
    const started = Date.now();
    store.inflight = loadCentersForNearby()
      .then((centers) => {
        store.allCenters = centers;
        store.entries = centers.flatMap((center) => {
          const lat = parseFloat(center.coords?.[0] ?? '');
          const lng = parseFloat(center.coords?.[1] ?? '');
          return Number.isFinite(lat) && Number.isFinite(lng) ? [{ center, lat, lng }] : [];
        });
        store.loadedAt = Date.now();
        logger.info(`Nearby index: ${store.entries.length} centers loaded in ${store.loadedAt - started}ms`);
      })
      .catch((error) => {
        logger.error('Nearby index: refresh failed', error);
      })
      .finally(() => {
        store.inflight = null;
      });
  }
  return store.inflight;
}

/**
 * Reload the index now and wait for it — used by /api/revalidate so pages
 * re-rendered after a Strapi update read fresh data, not the 30-minute-old copy.
 */
export async function reloadNearbyIndexNow(): Promise<void> {
  if (store.inflight) await store.inflight; // let a load already running finish first
  await refresh();
}

/** The loaded index, or null while the first load is still running. */
export function getNearbyIndex(): IndexedCenter[] | null {
  if (!store.entries || Date.now() - store.loadedAt > REFRESH_AFTER_MS) {
    void refresh();
  }
  return store.entries;
}

/** All centers from the index (for text search), or null while loading. */
export function getIndexedCenters(): Center[] | null {
  getNearbyIndex();
  return store.allCenters;
}

/**
 * All centers from the index, waiting up to `maxWaitMs` for a load already in
 * progress (e.g. the preload at server start). Null if it isn't ready in time.
 */
export async function getIndexedCentersWithin(maxWaitMs: number): Promise<Center[] | null> {
  const ready = getIndexedCenters();
  if (ready || !store.inflight) return ready;
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    store.inflight,
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, maxWaitMs);
    }),
  ]);
  clearTimeout(timer);
  return store.allCenters;
}

/** Haversine distance in km. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
