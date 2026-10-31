/**
 * Server-side only data access functions for center data.
 * Fetches data from Strapi CMS API.
 * 
 * IMPORTANT: This file should only be imported in Server Components, not in Client Components.
 */

import { Center, CentersData, RegionStateMapping, NewsPost, EventPost } from './types';
import { logger } from './logger';
import { RETREAT_CENTER_BRANCH_CODES } from './retreatCenters';
import {
  loadCentersFromStrapi,
  fetchCenterByBranchCode,
  fetchCenterBySlug,
  fetchCentersByState,
  fetchCentersByDistrict,
  fetchCentersByRegion,
  fetchRetreatCenters,
  fetchCenterCount,
  fetchRegionNames,
  fetchStateNames,
  fetchDistrictNamesByState,
  fetchStatAndDistrictCounts,
  fetchNewsByEmail,
  fetchEventsByEmail,
  fetchRegionBySlug,
  fetchStateBySlug,
  fetchDistrictBySlug,
  fetchRegionStats,
  loadCentersLightweight,
  fetchStateCentersLightweight,
  fetchRegionForState as fetchRegionForStateFromStrapi,
} from './strapiClient';
import { distanceKm, getIndexedCentersWithin } from './nearbyIndex';

// How long a page render waits for the in-memory center index if it's still loading
const INDEX_WAIT_MS = 6000;

/**
 * Every center from the in-memory index (lib/nearbyIndex.ts), which the running
 * server keeps for nearby search. State and region summaries are computed from
 * it in milliseconds instead of downloading them from Strapi on each first
 * render. Null during `next build` (the index lives in the running server) or
 * if it isn't ready — callers then use Strapi.
 */
async function getIndexedCentersForPage(): Promise<Center[] | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null;
  try {
    return await getIndexedCentersWithin(INDEX_WAIT_MS);
  } catch {
    return null;
  }
}

/**
 * Load all centers from Strapi CMS.
 * This is the primary data loading function for server-side rendering.
 * All downstream functions in this file depend on this.
 */
export async function loadCentersFromFile(): Promise<Center[]> {
  try {
    const centers = await loadCentersFromStrapi();
    logger.debug(`serverCenterData: Loaded ${centers.length} centers from Strapi`);
    return centers;
  } catch (error) {
    logger.error('serverCenterData: Error loading centers from Strapi:', error);
    return [];
  }
}

/**
 * Get a center by its branch code or name slug.
 */
export async function getCenterByCode(
  branchCodeOrName: string,
  state?: string,
  district?: string
): Promise<Center | undefined> {
  // Try targeted Strapi query by branch_code first (1 API call)
  const center = await fetchCenterByBranchCode(branchCodeOrName);
  if (center) return center;

  // Try slug-based lookup (1 API call) — slug is stored in Strapi by sync script
  // URL params are lowercase (haryana); Strapi stores Title Case (Haryana)
  const titleCase = (s: string) => s.replace(/-/g, ' ').split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const slug = branchCodeOrName.toLowerCase().replace(/\s+/g, '-');
  const bySlug = await fetchCenterBySlug(
    slug,
    state ? titleCase(state) : undefined,
    district ? titleCase(district) : undefined
  );
  if (bySlug) return bySlug;

  return undefined;
}

/**
 * Get all centers for a specific state.
 */
export async function getCentersByState(state: string): Promise<Center[]> {
  return fetchCentersByState(state);
}

/**
 * Get all centers for a specific district within a state.
 */
export async function getCentersByDistrict(state: string, district: string): Promise<Center[]> {
  return fetchCentersByDistrict(state, district);
}

/**
 * Get lightweight center data for a state (map markers + district grouping).
 * Returns only name, slug, district, coords — no address/email/contact.
 */
export async function getStateCentersLightweight(state: string) {
  const indexed = await getIndexedCentersForPage();
  if (indexed) {
    return indexed
      .filter((center) => center.state === state)
      .map((center) => ({
        name: center.name,
        slug: center.slug,
        district: center.district,
        coords: center.coords,
      }));
  }
  return fetchStateCentersLightweight(state);
}

/**
 * Get the region for a specific state.
 * Uses state→region relation (1 tiny API call) instead of fetching all state centers.
 */
export async function getRegionForState(state: string): Promise<string> {
  // state could be a name ("Haryana") or a slug ("haryana")
  const slug = state.toLowerCase().replace(/\s+/g, '-');
  const region = await fetchRegionForStateFromStrapi(slug);
  return region || 'Unknown';
}

/**
 * Calculate distance between two points using Haversine formula.
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Get the nearest centers to a given location.
 */
export async function getNearestCenters(
  latitude: number,
  longitude: number,
  limit: number = 5
): Promise<Center[]> {
  const centers = await loadCentersFromFile();

  // Process centers and calculate distances
  const processedCenters = centers.map((center) => {
    let lat: number | null = null;
    let lng: number | null = null;

    // Check if center has valid coordinates
    if (center.coords && center.coords.length === 2) {
      const parsedLat = parseFloat(center.coords[0]);
      const parsedLng = parseFloat(center.coords[1]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        lat = parsedLat;
        lng = parsedLng;
      }
    }

    // Calculate distance if we have valid coordinates
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      const distance = getDistance(latitude, longitude, lat, lng);
      return { ...center, distance };
    }

    // If no valid coordinates, return center with Infinity distance
    return { ...center, distance: Infinity };
  });

  // Sort centers by distance and return the requested number
  return processedCenters
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
    .slice(0, Math.min(limit, 1000));
}

/**
 * Get list of available regions.
 */
export async function getRegions(): Promise<string[]> {
  return fetchRegionNames();
}

/**
 * Get districts for a specific state.
 */
export async function getDistrictsByState(state: string): Promise<string[]> {
  return fetchDistrictNamesByState(state);
}

/**
 * Get state data including districts.
 */
export async function getStateData(state: string): Promise<{
  stateName: string;
  districts: {
    name: string;
    centerCount: number;
  }[];
}> {
  const stateData = await fetchCentersByState(state);

  const districts = new Map<string, number>();

  stateData.forEach((center) => {
    if (center.district) {
      const count = districts.get(center.district) || 0;
      districts.set(center.district, count + 1);
    }
  });

  return {
    stateName: state,
    districts: Array.from(districts.entries())
      .map(([name, centerCount]) => ({
        name,
        centerCount,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/**
 * Get states by region with details.
 */
export async function getStatesByRegion(region: string): Promise<
  {
    name: string;
    centerCount: number;
    districtCount: number;
  }[]
> {
  const allCenters = await fetchCentersByRegion(region);
  
  // Find states in this region
  const stateDataMap = new Map<string, { centerCount: number; districts: Set<string> }>();
  
  allCenters.forEach((center) => {
    if (center.state) {
      if (!stateDataMap.has(center.state)) {
        stateDataMap.set(center.state, { centerCount: 0, districts: new Set() });
      }
      
      const stateData = stateDataMap.get(center.state)!;
      stateData.centerCount++;
      if (center.district) {
        stateData.districts.add(center.district);
      }
    }
  });

  return Array.from(stateDataMap.entries())
    .map(([name, data]) => ({
      name,
      centerCount: data.centerCount,
      districtCount: data.districts.size,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get states summary with center and district counts.
 */
export async function getStatesSummary(): Promise<
  {
    state: string;
    centerCount: number;
    districtCount: number;
  }[]
> {
  // Use state names list + targeted per-state district counts
  // This avoids loading all 5612 centers
  const stateNames = await fetchStateNames();
  const results = await Promise.all(
    stateNames.map(async ({ name }) => {
      const districts = await fetchDistrictNamesByState(name);
      const centers = await fetchCentersByState(name);
      return {
        state: name,
        centerCount: centers.length,
        districtCount: districts.length,
      };
    })
  );
  return results;
}

/**
 * Get all centers (alias for loadCentersFromFile for compatibility).
 */
export async function getAllCenters(): Promise<Center[]> {
  return loadCentersFromFile();
}

/**
 * Get centers filtered by region.
 */
export async function getCentersByRegion(region: string): Promise<Center[]> {
  return fetchCentersByRegion(region);
}

/**
 * Get regions with details (state count, center count).
 */
export async function getRegionsWithDetails(): Promise<
  {
    name: string;
    stateCount: number;
    centerCount: number;
  }[]
> {
  const centers = await loadCentersFromFile();
  const regionMap = new Map<string, { states: Set<string>; centerCount: number }>();

  centers.forEach((center) => {
    if (center.region) {
      const regionData = regionMap.get(center.region) || {
        states: new Set<string>(),
        centerCount: 0,
      };

      regionData.centerCount++;
      if (center.state) {
        regionData.states.add(center.state);
      }

      regionMap.set(center.region, regionData);
    }
  });

  return Array.from(regionMap.entries())
    .map(([name, data]) => ({
      name,
      stateCount: data.states.size,
      centerCount: data.centerCount,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The centers closest to `center` (across district borders), nearest first,
 * with `distance` in km — from the in-memory index. Null when the index isn't
 * ready or the center has no coordinates; callers then use same-district centers.
 */
export async function getCentersNearCenter(
  center: Center,
  limit = 6,
  maxKm = 50
): Promise<(Center & { distance: number })[] | null> {
  const lat = parseFloat(center.coords?.[0] ?? '');
  const lng = parseFloat(center.coords?.[1] ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const indexed = await getIndexedCentersForPage();
  if (!indexed) return null;

  return indexed
    .filter((other) => other.branch_code !== center.branch_code)
    .flatMap((other) => {
      const oLat = parseFloat(other.coords?.[0] ?? '');
      const oLng = parseFloat(other.coords?.[1] ?? '');
      if (!Number.isFinite(oLat) || !Number.isFinite(oLng)) return [];
      const distance = distanceKm(lat, lng, oLat, oLng);
      return distance <= maxKm ? [{ ...other, distance: Math.round(distance * 10) / 10 }] : [];
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Short name of a center's area for lists: drops the district (or its first
 * word) the name starts with — "Pune Raviwar Peth" in Pune → "Raviwar Peth",
 * "Mumbai Borivali" in Mumbai Suburban → "Borivali".
 */
export function centerAreaName(centerName: string, district: string): string {
  const name = centerName.trim();
  const lower = name.toLowerCase();
  for (const prefix of [district.trim(), district.trim().split(/\s+/)[0]]) {
    const p = prefix.toLowerCase();
    if (p && lower.startsWith(`${p} `)) {
      const rest = name.slice(prefix.length).trim();
      // Keep "Thane (east)" whole rather than showing just "(east)"
      return /^[A-Za-z]/.test(rest) && rest.length >= 3 ? rest : name;
    }
  }
  return name;
}

/** [lat, lng] numbers for valid coordinates (4 decimals ≈ 11 m), else null */
function toPoint(coords: [string, string] | undefined | null): [number, number] | null {
  const lat = parseFloat(coords?.[0] ?? '');
  const lng = parseFloat(coords?.[1] ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [Math.round(lat * 1e4) / 1e4, Math.round(lng * 1e4) / 1e4];
}

/**
 * Middle of an area as map coords: the median point, which stays in the dense
 * core (the main city) instead of being pulled out by a few far-off centers.
 */
function centroid(points: [number, number][]): [string, string] | null {
  if (points.length === 0) return null;
  const median = (values: number[]) => {
    const sorted = [...values].sort((x, y) => x - y);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  return [median(points.map((p) => p[0])).toFixed(5), median(points.map((p) => p[1])).toFixed(5)];
}

export type DistrictDetail = {
  district: string;
  centerCount: number;
  /** Map bubble position (middle of its centers) */
  coords: [string, string] | null;
  /** Every center's location — for "distance to the nearest center" */
  points: [number, number][];
  /** A few well-known localities: the most central centers, one per locality */
  areas: string[];
};

/**
 * Localities people are likely to recognise: centers closest to the middle of
 * the district (usually the main city) first, skipping repeats of the same
 * locality ("Andheri (east) J.B. Nagar" and "Andheri (east) Poonam Nagar").
 */
function centralAreas(
  centers: { name: string; coords: [string, string] }[],
  district: string,
  middle: [string, string] | null,
  count: number
): string[] {
  const [midLat, midLng] = middle ? [Number(middle[0]), Number(middle[1])] : [NaN, NaN];
  const byCloseness = centers
    .map((c) => {
      const point = toPoint(c.coords);
      const d = point && middle ? (point[0] - midLat) ** 2 + (point[1] - midLng) ** 2 : Infinity;
      return { area: centerAreaName(c.name, district), d };
    })
    .sort((a, b) => a.d - b.d || a.area.localeCompare(b.area));

  const seenLocalities = new Set<string>();
  const areas: string[] = [];
  for (const { area } of byCloseness) {
    const locality = area.toLowerCase().split(/[\s(,]+/)[0];
    if (seenLocalities.has(locality)) continue;
    seenLocalities.add(locality);
    areas.push(area);
    if (areas.length === count) break;
  }
  return areas;
}

/** Per-district counts, locations and area names from a state's (lightweight) centers */
export function summarizeDistricts(
  districts: string[],
  centers: { name: string; district: string; coords: [string, string] }[],
  areasPerDistrict = 3
): DistrictDetail[] {
  return districts
    .map((district) => {
      const inDistrict = centers.filter((c) => c.district === district);
      const points = inDistrict.map((c) => toPoint(c.coords)).filter((p): p is [number, number] => p !== null);
      const middle = centroid(points);
      return {
        district,
        centerCount: inDistrict.length,
        coords: middle,
        points,
        areas: centralAreas(inDistrict, district, middle, areasPerDistrict),
      };
    })
    .sort((a, b) => b.centerCount - a.centerCount); // Most centers first
}

export type StateDetail = {
  name: string;
  centerCount: number;
  districtCount: number;
  /** Map bubble position (middle of its centers) */
  coords: [string, string] | null;
  /** Middle of each district — for an approximate "distance to the nearest city" */
  districtPoints: [number, number][];
  /** Districts with the most centers */
  topDistricts: string[];
};

/**
 * Per-state counts, top cities and locations for a region (country) page.
 * From the in-memory center index when ready; otherwise the lightweight
 * all-centers query the home page already caches.
 */
export async function getRegionStateDetails(region: string, topPerState = 3): Promise<StateDetail[]> {
  const centers = (await getIndexedCentersForPage()) ?? (await loadCentersLightweight());

  const byState = new Map<string, Map<string, [number, number][]>>();
  const countByState = new Map<string, number>();
  for (const center of centers) {
    if (center.region !== region || !center.state) continue;
    countByState.set(center.state, (countByState.get(center.state) || 0) + 1);
    const districts = byState.get(center.state) || new Map<string, [number, number][]>();
    const district = center.district || '';
    const points = districts.get(district) || [];
    const point = toPoint(center.coords);
    if (point) points.push(point);
    districts.set(district, points);
    byState.set(center.state, districts);
  }

  return Array.from(byState.entries())
    .map(([name, districts]) => {
      const named = Array.from(districts.entries()).filter(([district]) => district);
      const allPoints = Array.from(districts.values()).flat();
      return {
        name,
        centerCount: countByState.get(name) || 0,
        districtCount: named.length,
        coords: centroid(allPoints),
        districtPoints: named
          .map(([, points]) => centroid(points))
          .filter((c): c is [string, string] => c !== null)
          .map(([lat, lng]) => [Number(lat), Number(lng)] as [number, number]),
        topDistricts: named
          .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
          .slice(0, topPerState)
          .map(([district]) => district),
      };
    })
    .sort((a, b) => b.centerCount - a.centerCount);
}

/**
 * Fast function to get states by region (center and district counts per state).
 * From the in-memory center index when ready; otherwise the lightweight Strapi
 * stats query (~1 MB for India, so only as a fallback).
 */
export async function getStatesByRegionFast(region: string): Promise<
  {
    name: string;
    centerCount: number;
    districtCount: number;
  }[]
> {
  const indexed = await getIndexedCentersForPage();
  if (!indexed) return fetchRegionStats(region);

  // Same grouping as fetchRegionStats: per state, count centers and unique districts
  const stateMap = new Map<string, { centerCount: number; districts: Set<string> }>();
  for (const center of indexed) {
    if (center.region !== region || !center.state) continue;
    const entry = stateMap.get(center.state) || { centerCount: 0, districts: new Set<string>() };
    entry.centerCount++;
    if (center.district) entry.districts.add(center.district);
    stateMap.set(center.state, entry);
  }
  return Array.from(stateMap.entries())
    .map(([name, data]) => ({
      name,
      centerCount: data.centerCount,
      districtCount: data.districts.size,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get region to state mapping.
 */
export async function getRegionToStateMapping(): Promise<RegionStateMapping> {
  const centers = await loadCentersFromFile();
  const regionMap: RegionStateMapping = {};

  // Build state to district mapping for district counts
  const stateDistrictMap = new Map<string, Set<string>>();
  centers.forEach((center) => {
    if (center.state && center.district) {
      if (!stateDistrictMap.has(center.state)) {
        stateDistrictMap.set(center.state, new Set());
      }
      stateDistrictMap.get(center.state)!.add(center.district);
    }
  });

  centers.forEach((center) => {
    const region = center.region || '';
    const { state } = center;

    if (!region) return;

    if (!regionMap[region]) {
      regionMap[region] = {
        states: {},
        centerCount: 0,
      };
    }

    if (state && !regionMap[region].states[state]) {
      regionMap[region].states[state] = {
        centerCount: 0,
        districtCount: stateDistrictMap.get(state)?.size || 0,
      };
    }

    regionMap[region].centerCount++;

    if (state) {
      regionMap[region].states[state].centerCount++;
    }
  });

  return regionMap;
}

/**
 * Find a region by its slug. (1 API call via slug field)
 */
export async function getRegionBySlug(regionSlug: string): Promise<string | null> {
  return fetchRegionBySlug(regionSlug);
}

/**
 * Find a state by its slug. (1 API call via slug field)
 */
export async function getStateBySlug(stateSlug: string): Promise<string | null> {
  return fetchStateBySlug(stateSlug);
}

/**
 * Find a district by its slug (scoped by state slug). (1 API call via slug field)
 */
export async function getDistrictBySlug(
  stateSlug: string,
  districtSlug: string
): Promise<string | null> {
  return fetchDistrictBySlug(districtSlug, stateSlug);
}

/**
 * Get retreat centers.
 */
export async function getRetreatCenters(): Promise<Center[]> {
  const retreatCenters = await fetchRetreatCenters();

  // Sort centers according to the order in RETREAT_CENTER_BRANCH_CODES
  return retreatCenters.sort((a, b) => {
    const indexA = RETREAT_CENTER_BRANCH_CODES.indexOf(a.branch_code);
    const indexB = RETREAT_CENTER_BRANCH_CODES.indexOf(b.branch_code);
    return indexA - indexB;
  });
}

/**
 * Get news posts for a center by email match.
 * Returns latest news sorted by date descending (default limit: 6).
 */
export async function getNewsByEmail(email: string, limit?: number): Promise<{ posts: NewsPost[]; total: number }> {
  return fetchNewsByEmail(email, limit);
}

/**
 * Get events for a center by centeremail match.
 * Returns events sorted by start_date descending (default limit: 20).
 */
export async function getEventsByEmail(email: string, limit?: number): Promise<{ events: EventPost[]; total: number }> {
  return fetchEventsByEmail(email, limit);
}

