/**
 * Strapi API client for fetching center data.
 * Follows the same pattern as MurliNextJs/src/lib/strapi.ts:
 *   - Single strapiGet() wrapper with next: { revalidate } caching
 *   - Next.js handles disk caching — no manual in-memory cache needed
 *   - Dev=webapp, Prod=portal (auto-selected via NODE_ENV / .env.production)
 *   - Targeted queries per page — each page fetches only what it needs
 */

import { Center } from './types';
import { logger } from './logger';

const IS_PROD = process.env.NODE_ENV === 'production';
const STRAPI_URL =
  process.env.STRAPI_BASE_URL ||
  (IS_PROD ? 'https://portal.brahmakumaris.com/api' : 'https://webapp.brahmakumaris.com/api');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

// --- Generic Strapi helper (mirrors Murli pattern) ---

interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface StrapiResponse<T> {
  data: T;
  meta: { pagination: StrapiPagination };
}

async function strapiGet<T>(
  path: string,
  options?: { revalidate?: number; tags?: string[] }
): Promise<StrapiResponse<T>> {
  const url = `${STRAPI_URL}/${path}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      'Content-Type': 'application/json',
    },
    next: {
      revalidate: options?.revalidate ?? 86400,
      tags: options?.tags ?? [],
    },
  });

  if (!res.ok) {
    throw new Error(`Strapi error ${res.status}: ${url}`);
  }

  return res.json();
}

// --- Center-specific types ---

interface StrapiCenterAttributes {
  name: string;
  branch_code: string;
  address_line1: string;
  address_line2: string;
  address_line3: string;
  city: string;
  pincode: string;
  email: string | null;
  contact: string;
  mobile: string;
  country: string;
  zone: string;
  sub_zone: string;
  section: string;
  country_id: string;
  latitude: number | null;
  longitude: number | null;
  is_retreat: boolean;
  district_center?: {
    data: {
      id: number;
      attributes: {
        name: string;
        district_id: string;
        state_center?: {
          data: {
            id: number;
            attributes: {
              name: string;
              state_id: string;
              region_center?: {
                data: {
                  id: number;
                  attributes: {
                    name: string;
                  };
                } | null;
              };
            };
          } | null;
        };
      };
    } | null;
  };
}

interface StrapiCenterEntry {
  id: number;
  attributes: StrapiCenterAttributes;
}

// --- Transform ---

function transformStrapiCenter(entry: StrapiCenterEntry): Center {
  const a = entry.attributes;
  const district = a.district_center?.data?.attributes;
  const state = district?.state_center?.data?.attributes;
  const region = state?.region_center?.data?.attributes;

  return {
    name: a.name || '',
    branch_code: a.branch_code || '',
    address: {
      line1: a.address_line1 || '',
      line2: a.address_line2 || '',
      line3: a.address_line3 || '',
      city: a.city || '',
      pincode: a.pincode || '',
    },
    email: a.email || '',
    contact: a.contact || '',
    mobile: a.mobile || '',
    country: a.country || '',
    district: district?.name || '',
    state: state?.name || '',
    region: region?.name || '',
    zone: a.zone || '',
    sub_zone: a.sub_zone || '',
    section: a.section || '',
    district_id: district?.district_id || '',
    state_id: state?.state_id || '',
    country_id: a.country_id || '',
    coords: [
      a.latitude != null ? String(a.latitude) : '',
      a.longitude != null ? String(a.longitude) : '',
    ] as [string, string],
  };
}

// --- Shared constants ---

const POPULATE = 'populate=district_center.state_center.region_center';

// Lightweight populate: only hierarchy names + coords (for homepage aggregation)
const POPULATE_LIGHT = 'fields[0]=branch_code&fields[1]=latitude&fields[2]=longitude&populate[district_center][fields][0]=name&populate[district_center][populate][state_center][fields][0]=name&populate[district_center][populate][state_center][populate][region_center][fields][0]=name';

/**
 * Helper to paginate through a Strapi query and collect all results.
 */
async function fetchAllPages(
  basePath: string,
  pageSize: number,
  tags: string[]
): Promise<Center[]> {
  let all: StrapiCenterEntry[] = [];
  let page = 1;

  while (true) {
    const sep = basePath.includes('?') ? '&' : '?';
    const res = await strapiGet<StrapiCenterEntry[]>(
      `${basePath}${sep}pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
      { revalidate: 86400, tags }
    );

    all = all.concat(res.data || []);
    if (page >= res.meta.pagination.pageCount) break;
    page++;
  }

  return all.map(transformStrapiCenter);
}

// =====================================================
// PUBLIC API — Targeted queries (each page fetches only what it needs)
// =====================================================

/**
 * Load ALL centers with full data. Used by sync scripts and API route fallback.
 * pageSize=500 keeps each response under Next.js 2MB cache limit.
 */
export async function loadCentersFromStrapi(): Promise<Center[]> {
  logger.debug(`strapiClient: Loading all centers from ${STRAPI_URL}`);
  return fetchAllPages(`centers?${POPULATE}`, 500, ['centers']);
}

/**
 * Load ALL centers with MINIMAL fields — only what homepage needs for aggregation.
 * ~870KB per 3000 items → only 2 API calls for all 5612 centers.
 * Returns Center objects with: branch_code, region, state, district, coords (rest empty).
 */
export async function loadCentersLightweight(): Promise<Center[]> {
  logger.debug(`strapiClient: Loading lightweight centers for homepage`);
  return fetchAllPages(`centers?${POPULATE_LIGHT}`, 3000, ['centers-light']);
}

/**
 * Fetch a single center by branch_code. (1 API call)
 */
export async function fetchCenterByBranchCode(branchCode: string): Promise<Center | null> {
  const res = await strapiGet<StrapiCenterEntry[]>(
    `centers?filters[branch_code][$eq]=${branchCode}&${POPULATE}&pagination[pageSize]=1`,
    { revalidate: 86400, tags: [`center-${branchCode}`] }
  );
  if (!res.data?.length) return null;
  return transformStrapiCenter(res.data[0]);
}

/**
 * Fetch centers filtered by state name. (1-2 API calls)
 */
export async function fetchCentersByState(state: string): Promise<Center[]> {
  logger.debug(`strapiClient: Fetching centers for state: ${state}`);
  return fetchAllPages(
    `centers?filters[district_center][state_center][name][$eq]=${encodeURIComponent(state)}&${POPULATE}`,
    500,
    [`centers-state-${state}`]
  );
}

/**
 * Fetch centers filtered by district name within a state. (1 API call)
 */
export async function fetchCentersByDistrict(state: string, district: string): Promise<Center[]> {
  logger.debug(`strapiClient: Fetching centers for district: ${district}, state: ${state}`);
  return fetchAllPages(
    `centers?filters[district_center][name][$eq]=${encodeURIComponent(district)}&filters[district_center][state_center][name][$eq]=${encodeURIComponent(state)}&${POPULATE}`,
    500,
    [`centers-district-${state}-${district}`]
  );
}

/**
 * Fetch centers filtered by region name. (1-12 API calls depending on region size)
 */
export async function fetchCentersByRegion(region: string): Promise<Center[]> {
  logger.debug(`strapiClient: Fetching centers for region: ${region}`);
  return fetchAllPages(
    `centers?filters[district_center][state_center][region_center][name][$eq]=${encodeURIComponent(region)}&${POPULATE}`,
    500,
    [`centers-region-${region}`]
  );
}

/**
 * Fetch retreat centers only. (1 API call, ~3 results)
 */
export async function fetchRetreatCenters(): Promise<Center[]> {
  const res = await strapiGet<StrapiCenterEntry[]>(
    `centers?filters[is_retreat][$eq]=true&${POPULATE}&pagination[pageSize]=100`,
    { revalidate: 86400, tags: ['retreat-centers'] }
  );
  return (res.data || []).map(transformStrapiCenter);
}

// =====================================================
// LIGHTWEIGHT QUERIES — counts & name lists (1 API call each)
// =====================================================

interface StrapiNameEntry {
  id: number;
  attributes: { name: string; [key: string]: any };
}

/**
 * Get total center count. (1 API call, tiny payload)
 */
export async function fetchCenterCount(): Promise<number> {
  const res = await strapiGet<StrapiCenterEntry[]>(
    `centers?pagination[pageSize]=1&fields[0]=branch_code`,
    { revalidate: 86400, tags: ['center-count'] }
  );
  return res.meta.pagination.total;
}

/**
 * Get all region names. (1 API call, ~5 results)
 */
export async function fetchRegionNames(): Promise<string[]> {
  const res = await strapiGet<StrapiNameEntry[]>(
    `region-centers?fields[0]=name&pagination[pageSize]=100`,
    { revalidate: 86400, tags: ['region-names'] }
  );
  return (res.data || []).map(e => e.attributes.name).sort();
}

/**
 * Get all state names with their region. (1 API call, ~35 results)
 */
export async function fetchStateNames(): Promise<{ name: string; region: string }[]> {
  const res = await strapiGet<StrapiNameEntry[]>(
    `state-centers?fields[0]=name&populate[region_center][fields][0]=name&pagination[pageSize]=200`,
    { revalidate: 86400, tags: ['state-names'] }
  );
  return (res.data || []).map(e => ({
    name: e.attributes.name,
    region: e.attributes.region_center?.data?.attributes?.name || '',
  }));
}

/**
 * Get district names for a state. (1 API call)
 */
export async function fetchDistrictNamesByState(state: string): Promise<string[]> {
  const res = await strapiGet<StrapiNameEntry[]>(
    `district-centers?filters[state_center][name][$eq]=${encodeURIComponent(state)}&fields[0]=name&pagination[pageSize]=500`,
    { revalidate: 86400, tags: [`district-names-${state}`] }
  );
  return (res.data || []).map(e => e.attributes.name).sort();
}

/**
 * Get state count and district count. (2 tiny API calls)
 */
export async function fetchStatAndDistrictCounts(): Promise<{ stateCount: number; districtCount: number }> {
  const [stateRes, districtRes] = await Promise.all([
    strapiGet<StrapiNameEntry[]>(
      `state-centers?pagination[pageSize]=1&fields[0]=name`,
      { revalidate: 86400, tags: ['state-count'] }
    ),
    strapiGet<StrapiNameEntry[]>(
      `district-centers?pagination[pageSize]=1&fields[0]=name`,
      { revalidate: 86400, tags: ['district-count'] }
    ),
  ]);
  return {
    stateCount: stateRes.meta.pagination.total,
    districtCount: districtRes.meta.pagination.total,
  };
}
