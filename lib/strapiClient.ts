/**
 * Strapi API client for fetching center data.
 * Follows the same pattern as MurliNextJs/src/lib/strapi.ts:
 *   - Single strapiGet() wrapper with next: { revalidate } caching
 *   - Next.js handles disk caching — no manual in-memory cache needed
 *   - Dev=webapp, Prod=portal (auto-selected via NODE_ENV / .env.production)
 *   - Targeted queries per page — each page fetches only what it needs
 */

import { Center, NewsPost, EventPost } from './types';
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
  slug: string | null;
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
    slug: a.slug || (a.name || '').toLowerCase().replace(/\s+/g, '-'),
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
 * Fetch a single center by slug. (1 API call)
 * When state/district are provided, scopes the query to disambiguate
 * duplicate names (e.g. "Shahpura" exists in multiple districts).
 */
export async function fetchCenterBySlug(
  slug: string,
  state?: string,
  district?: string
): Promise<Center | null> {
  let query = `centers?filters[slug][$eq]=${encodeURIComponent(slug)}&${POPULATE}&pagination[pageSize]=1`;
  if (state) {
    query += `&filters[district_center][state_center][name][$eq]=${encodeURIComponent(state)}`;
  }
  if (district) {
    query += `&filters[district_center][name][$eq]=${encodeURIComponent(district)}`;
  }
  const res = await strapiGet<StrapiCenterEntry[]>(
    query,
    { revalidate: 86400, tags: [`center-slug-${slug}`] }
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

// Minimal populate: only hierarchy names, no coords/address/contact (for counting)
const POPULATE_STATS = 'fields[0]=branch_code&populate[district_center][fields][0]=name&populate[district_center][populate][state_center][fields][0]=name';

// Medium populate: name + slug + coords + district name (for map markers)
const POPULATE_MAP = 'fields[0]=name&fields[1]=slug&fields[2]=latitude&fields[3]=longitude&populate[district_center][fields][0]=name&populate[district_center][populate][state_center][fields][0]=name';

// Nearby populate: CenterCard-essential fields (name, slug, coords, address, contact, hierarchy)
const POPULATE_NEARBY = [
  'fields[0]=name', 'fields[1]=slug', 'fields[2]=branch_code',
  'fields[3]=latitude', 'fields[4]=longitude',
  'fields[5]=address_line1', 'fields[6]=address_line2', 'fields[7]=address_line3',
  'fields[8]=city', 'fields[9]=pincode',
  'fields[10]=email', 'fields[11]=contact', 'fields[12]=mobile',
  'fields[13]=country',
  'populate[district_center][fields][0]=name',
  'populate[district_center][populate][state_center][fields][0]=name',
  'populate[district_center][populate][state_center][populate][region_center][fields][0]=name',
].join('&');

/**
 * Load all centers with CenterCard-essential fields only.
 * ~5x smaller payload than full populate, uses page size 2000 (~3 API calls instead of 12).
 * Used by the /api/centers/nearby endpoint as fallback.
 */
export async function loadCentersForNearby(): Promise<Center[]> {
  let all: StrapiCenterEntry[] = [];
  let page = 1;
  while (true) {
    const res = await strapiGet<StrapiCenterEntry[]>(
      `centers?${POPULATE_NEARBY}&pagination[page]=${page}&pagination[pageSize]=2000`,
      { revalidate: 86400, tags: ['centers-nearby'] }
    );
    all = all.concat(res.data || []);
    if (page >= res.meta.pagination.pageCount) break;
    page++;
  }
  return all.map(transformStrapiCenter);
}

/**
 * Fast nearby search using bounding box pre-filter.
 * Instead of fetching all 5600+ centers, uses Strapi latitude/longitude
 * filters to only fetch centers within a geographic bounding box.
 * Reduces API calls from 3 pages to typically 1 page (~50-300 records).
 * 
 * 1° latitude ≈ 111 km, so for a 150km radius use ~1.5° padding.
 * Longitude varies by latitude; at India's range (8-35°N) use ~2° padding.
 */
export async function loadCentersNearbyBBox(
  lat: number,
  lng: number,
  radiusKm: number = 150
): Promise<Center[]> {
  // Convert radius to degree padding (with generous margin)
  const latPad = (radiusKm / 111) * 1.2; // ~1.2x safety margin
  const lngPad = (radiusKm / (111 * Math.cos((lat * Math.PI) / 180))) * 1.2;

  const minLat = lat - latPad;
  const maxLat = lat + latPad;
  const minLng = lng - lngPad;
  const maxLng = lng + lngPad;

  const bboxFilters = [
    `filters[latitude][$gte]=${minLat.toFixed(4)}`,
    `filters[latitude][$lte]=${maxLat.toFixed(4)}`,
    `filters[longitude][$gte]=${minLng.toFixed(4)}`,
    `filters[longitude][$lte]=${maxLng.toFixed(4)}`,
  ].join('&');

  let all: StrapiCenterEntry[] = [];
  let page = 1;
  while (true) {
    const res = await strapiGet<StrapiCenterEntry[]>(
      `centers?${POPULATE_NEARBY}&${bboxFilters}&pagination[page]=${page}&pagination[pageSize]=500`,
      { revalidate: 3600, tags: ['centers-nearby-bbox'] }
    );
    all = all.concat(res.data || []);
    if (page >= res.meta.pagination.pageCount) break;
    page++;
  }
  logger.info(`BBox nearby: fetched ${all.length} centers for (${lat.toFixed(2)}, ${lng.toFixed(2)}) r=${radiusKm}km`);
  return all.map(transformStrapiCenter);
}

/**
 * Fetch state-level stats for a region (name, centerCount, districtCount).
 * Uses minimal fields — ~10x smaller payload than full populate.
 * Region page only needs this, not full center objects.
 */
export async function fetchRegionStats(
  region: string
): Promise<{ name: string; centerCount: number; districtCount: number }[]> {
  // Fetch all centers for the region with MINIMAL fields
  let all: any[] = [];
  let page = 1;
  const filter = `centers?filters[district_center][state_center][region_center][name][$eq]=${encodeURIComponent(region)}&${POPULATE_STATS}`;
  while (true) {
    const res = await strapiGet<any[]>(
      `${filter}&pagination[page]=${page}&pagination[pageSize]=2000`,
      { revalidate: 86400, tags: [`region-stats-${region}`] }
    );
    all = all.concat(res.data || []);
    if (page >= res.meta.pagination.pageCount) break;
    page++;
  }

  // Group by state → count centers and unique districts
  const stateMap = new Map<string, { centerCount: number; districts: Set<string> }>();
  for (const entry of all) {
    const district = entry.attributes?.district_center?.data?.attributes;
    const state = district?.state_center?.data?.attributes;
    const stateName = state?.name || '';
    const districtName = district?.name || '';
    if (!stateName) continue;
    if (!stateMap.has(stateName)) {
      stateMap.set(stateName, { centerCount: 0, districts: new Set() });
    }
    const sd = stateMap.get(stateName)!;
    sd.centerCount++;
    if (districtName) sd.districts.add(districtName);
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
 * Fetch centers for a state with only map-essential fields:
 * name, slug, coords, district name. No address/email/contact.
 * ~5x smaller payload than full populate.
 */
export async function fetchStateCentersLightweight(
  state: string
): Promise<{ name: string; slug: string; district: string; coords: [string, string] }[]> {
  let all: any[] = [];
  let page = 1;
  const filter = `centers?filters[district_center][state_center][name][$eq]=${encodeURIComponent(state)}&${POPULATE_MAP}`;
  while (true) {
    const res = await strapiGet<any[]>(
      `${filter}&pagination[page]=${page}&pagination[pageSize]=2000`,
      { revalidate: 86400, tags: [`state-centers-light-${state}`] }
    );
    all = all.concat(res.data || []);
    if (page >= res.meta.pagination.pageCount) break;
    page++;
  }

  return all.map(entry => {
    const a = entry.attributes;
    const district = a.district_center?.data?.attributes;
    return {
      name: a.name || '',
      slug: a.slug || (a.name || '').toLowerCase().replace(/\s+/g, '-'),
      district: district?.name || '',
      coords: [
        a.latitude != null ? String(a.latitude) : '',
        a.longitude != null ? String(a.longitude) : '',
      ] as [string, string],
    };
  });
}

/**
 * Get the region name for a state. (1 API call via state-centers relation)
 * Replaces the old approach of fetching ALL state centers just for centers[0].region.
 */
export async function fetchRegionForState(stateSlug: string): Promise<string | null> {
  const res = await strapiGet<StrapiNameEntry[]>(
    `state-centers?filters[slug][$eq]=${encodeURIComponent(stateSlug)}&populate[region_center][fields][0]=name&fields[0]=name&pagination[pageSize]=1`,
    { revalidate: 86400, tags: [`state-region-${stateSlug}`] }
  );
  if (!res.data?.length) return null;
  return res.data[0].attributes.region_center?.data?.attributes?.name || null;
}

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
 * Find a region name by its slug. (1 API call)
 */
export async function fetchRegionBySlug(slug: string): Promise<string | null> {
  const res = await strapiGet<StrapiNameEntry[]>(
    `region-centers?filters[slug][$eq]=${encodeURIComponent(slug)}&fields[0]=name&pagination[pageSize]=1`,
    { revalidate: 86400, tags: [`region-slug-${slug}`] }
  );
  if (!res.data?.length) return null;
  return res.data[0].attributes.name;
}

/**
 * Find a state name by its slug. (1 API call)
 */
export async function fetchStateBySlug(slug: string): Promise<string | null> {
  const res = await strapiGet<StrapiNameEntry[]>(
    `state-centers?filters[slug][$eq]=${encodeURIComponent(slug)}&fields[0]=name&pagination[pageSize]=1`,
    { revalidate: 86400, tags: [`state-slug-${slug}`] }
  );
  if (!res.data?.length) return null;
  return res.data[0].attributes.name;
}

/**
 * Find a district name by its slug (scoped to state slug). (1 API call)
 */
export async function fetchDistrictBySlug(districtSlug: string, stateSlug: string): Promise<string | null> {
  const res = await strapiGet<StrapiNameEntry[]>(
    `district-centers?filters[slug][$eq]=${encodeURIComponent(districtSlug)}&filters[state_center][slug][$eq]=${encodeURIComponent(stateSlug)}&fields[0]=name&pagination[pageSize]=1`,
    { revalidate: 86400, tags: [`district-slug-${districtSlug}-${stateSlug}`] }
  );
  if (!res.data?.length) return null;
  return res.data[0].attributes.name;
}

// =====================================================
// NEWS POSTS — fetched by email match (no relation needed)
// =====================================================

interface StrapiNewsPostEntry {
  id: number;
  title: string;
  slug: string;
  date: string;
  Featured: boolean;
  featuredImage: {
    id: number;
    url: string;
    alternativeText: string | null;
    formats: {
      thumbnail?: { url: string; width: number; height: number };
      Thumbnail?: { url: string; width: number; height: number };
      microHD?: { url: string; width: number; height: number };
      miniHD?: { url: string; width: number; height: number };
      HD?: { url: string; width: number; height: number };
      FullHD?: { url: string; width: number; height: number };
    } | null;
  } | null;
}

function transformNewsPost(entry: StrapiNewsPostEntry): NewsPost {
  return {
    id: entry.id,
    title: entry.title || '',
    slug: entry.slug || '',
    date: entry.date || '',
    Featured: entry.Featured || false,
    featuredImage: entry.featuredImage
      ? {
          url: entry.featuredImage.url,
          alternativeText: entry.featuredImage.alternativeText,
          formats: entry.featuredImage.formats,
        }
      : null,
  };
}

/**
 * Fetch news posts by center email. (1 API call)
 * Returns latest news sorted by date descending.
 * Only fetches: title, slug, date, Featured, featuredImage (with formats).
 */
export async function fetchNewsByEmail(
  email: string,
  limit: number = 6
): Promise<{ posts: NewsPost[]; total: number }> {
  if (!email || !email.includes('@')) return { posts: [], total: 0 };

  try {
    const res = await strapiGet<StrapiNewsPostEntry[]>(
      `news-posts?filters[email][$eq]=${encodeURIComponent(email)}&sort=date:desc&pagination[pageSize]=${limit}&fields[0]=title&fields[1]=slug&fields[2]=date&fields[3]=Featured&populate[featuredImage][fields][0]=url&populate[featuredImage][fields][1]=formats&populate[featuredImage][fields][2]=alternativeText`,
      { revalidate: 3600, tags: [`news-${email}`] }
    );
    return {
      posts: (res.data || []).map(transformNewsPost),
      total: res.meta?.pagination?.total || 0,
    };
  } catch (error) {
    logger.error(`strapiClient: Error fetching news for email ${email}:`, error);
    return { posts: [], total: 0 };
  }
}

/**
 * Fetch news posts by email with pagination support. (1 API call)
 * Returns { posts, total } for client-side "Load More".
 */
export async function fetchNewsByEmailPaginated(
  email: string,
  page: number = 1,
  pageSize: number = 6
): Promise<{ posts: NewsPost[]; total: number }> {
  if (!email || !email.includes('@')) return { posts: [], total: 0 };

  try {
    const res = await strapiGet<StrapiNewsPostEntry[]>(
      `news-posts?filters[email][$eq]=${encodeURIComponent(email)}&sort=date:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}&fields[0]=title&fields[1]=slug&fields[2]=date&fields[3]=Featured&populate[featuredImage][fields][0]=url&populate[featuredImage][fields][1]=formats&populate[featuredImage][fields][2]=alternativeText`,
      { revalidate: 3600, tags: [`news-${email}-p${page}`] }
    );
    return {
      posts: (res.data || []).map(transformNewsPost),
      total: res.meta?.pagination?.total || 0,
    };
  } catch (error) {
    logger.error(`strapiClient: Error fetching paginated news for email ${email}:`, error);
    return { posts: [], total: 0 };
  }
}

// =====================================================
// EVENTS — fetched by centeremail match
// =====================================================

interface StrapiEventImageFormats {
  thumbnail?: { url: string; width: number; height: number };
  Thumbnail?: { url: string; width: number; height: number };
  microHD?: { url: string; width: number; height: number };
  miniHD?: { url: string; width: number; height: number };
  HD?: { url: string; width: number; height: number };
  FullHD?: { url: string; width: number; height: number };
}

interface StrapiEventPostEntry {
  id: number;
  attributes: {
    title: string;
    slug: string;
    start_date: string;
    end_date: string;
    more_infor: string | null;
    registration_link: string | null;
    centeremail: string | null;
    featured_image: {
      data: {
        id: number;
        attributes: {
          url: string;
          alternativeText: string | null;
          formats: StrapiEventImageFormats | null;
        };
      } | null;
    };
  };
}

function transformEventPost(entry: StrapiEventPostEntry): EventPost {
  const a = entry.attributes;
  const imgData = a.featured_image?.data?.attributes;
  return {
    id: entry.id,
    title: a.title || '',
    slug: a.slug || '',
    start_date: a.start_date || '',
    end_date: a.end_date || '',
    more_infor: a.more_infor || null,
    registration_link: a.registration_link || null,
    centeremail: a.centeremail || '',
    featuredImage: imgData
      ? {
          url: imgData.url,
          alternativeText: imgData.alternativeText,
          formats: imgData.formats,
        }
      : null,
  };
}

/**
 * Fetch events by center email (centeremail field). (1 API call)
 * Returns events sorted by start_date descending.
 */
export async function fetchEventsByEmail(
  email: string,
  limit: number = 20
): Promise<{ events: EventPost[]; total: number }> {
  if (!email || !email.includes('@')) return { events: [], total: 0 };

  try {
    const res = await strapiGet<StrapiEventPostEntry[]>(
      `events?filters[centeremail][$eq]=${encodeURIComponent(email)}&sort=start_date:desc&pagination[pageSize]=${limit}&fields[0]=title&fields[1]=slug&fields[2]=start_date&fields[3]=end_date&fields[4]=more_infor&fields[5]=registration_link&fields[6]=centeremail&populate[featured_image][fields][0]=url&populate[featured_image][fields][1]=formats&populate[featured_image][fields][2]=alternativeText`,
      { revalidate: 3600, tags: [`events-${email}`] }
    );
    return {
      events: (res.data || []).map(transformEventPost),
      total: res.meta?.pagination?.total || 0,
    };
  } catch (error) {
    logger.error(`strapiClient: Error fetching events for email ${email}:`, error);
    return { events: [], total: 0 };
  }
}

/**
 * Fetch events by email with pagination support. (1 API call)
 */
export async function fetchEventsByEmailPaginated(
  email: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ events: EventPost[]; total: number }> {
  if (!email || !email.includes('@')) return { events: [], total: 0 };

  try {
    const res = await strapiGet<StrapiEventPostEntry[]>(
      `events?filters[centeremail][$eq]=${encodeURIComponent(email)}&sort=start_date:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}&fields[0]=title&fields[1]=slug&fields[2]=start_date&fields[3]=end_date&fields[4]=more_infor&fields[5]=registration_link&fields[6]=centeremail&populate[featured_image][fields][0]=url&populate[featured_image][fields][1]=formats&populate[featured_image][fields][2]=alternativeText`,
      { revalidate: 3600, tags: [`events-${email}-p${page}`] }
    );
    return {
      events: (res.data || []).map(transformEventPost),
      total: res.meta?.pagination?.total || 0,
    };
  } catch (error) {
    logger.error(`strapiClient: Error fetching paginated events for email ${email}:`, error);
    return { events: [], total: 0 };
  }
}

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
