// Data service for center information - client-side only
import {
  Center,
  CentersData,
  RegionStateMapping,
  StateDistrictMapping,
  DistrictCentersMapping,
} from "./types";
import { deSlugify } from "./urlUtils";
import { RETREAT_CENTER_BRANCH_CODES } from './retreatCenters';
import { logger } from './logger';

// Cache for data
let centersData: CentersData | null = null;
const stateCentersCache: Record<string, Center[]> = {};
const districtCentersCache: Record<string, Record<string, Center[]>> = {};
const regionStatesCache: Record<string, string[]> = {};
const stateRegionCache: Record<string, string> = {}; // Cache to store which region a state belongs to

// Advanced mapping structures (global cache)
let regionToStateMapping: RegionStateMapping | null = null;
let stateToDistrictMapping: StateDistrictMapping | null = null;
let districtToCentersMapping: DistrictCentersMapping | null = null;
let isDataMappingInitialized = false;

// Constants for localStorage caching
const LOCAL_STORAGE_CENTERS_KEY = 'bkcenters_data_cache';
const LOCAL_STORAGE_TIMESTAMP_KEY = 'bkcenters_data_timestamp';
const CACHE_EXPIRY_MS = 1000 * 60 * 60; // 1 hour cache validity

// Helper function to get the correct base path for API calls
const getBasePath = () => {
  // Check if we're in browser environment
  const isBrowser = typeof window !== "undefined";
  
  if (isBrowser) {
    // For client-side, check if we're running in production with base path
    const currentPath = window.location.pathname;
    
    // If the current path starts with /centers, we're running with base path
    if (currentPath.startsWith('/centers')) {
      return '/centers';
    }
    
    // Otherwise, no base path needed
    return '';
  }
  
  // For server-side, check environment
  const isProd = process.env.NODE_ENV === "production";
  const isLocalDev = process.env.IS_LOCAL === "true";
  
  return isProd && !isLocalDev ? "/centers" : "";
};

const getOrigin = () => {
  // Check if we're in browser environment
  const isBrowser = typeof window !== "undefined";
  
  // For client-side, check current location
  if (isBrowser) {
    const currentOrigin = window.location.origin;
    logger.debug("getOrigin: Client-side, using window.location.origin:", currentOrigin);
    return currentOrigin;
  }
  
  // For server-side, check environment variables
  const isLocal = process.env.IS_LOCAL === "true";
  const isDev = process.env.NODE_ENV === "development";
  
  logger.trace("getOrigin: Server-side, IS_LOCAL =", isLocal);
  logger.trace("getOrigin: Server-side, NODE_ENV =", process.env.NODE_ENV);
  
  if (isLocal || isDev) {
    const origin = "http://localhost:5400";
    logger.debug("getOrigin: Using local development origin:", origin);
    return origin;
  } else {
    const origin = "https://www.brahmakumaris.com";
    const fullOrigin = origin + (process.env.NEXT_PUBLIC_BASE_PATH || "");
    logger.debug("getOrigin: Using production origin:", fullOrigin);
    return fullOrigin;
  }
};

// Function to build all data mappings - call this once at initialization
async function initializeDataMappings(): Promise<void> {
  if (isDataMappingInitialized) return;

  logger.info("Initializing data mappings...");
  const centers = await getAllCenters();
  logger.info(`Loaded ${centers.length} centers for mapping`);

  // Build region to states mapping
  const regionMap: RegionStateMapping = {};

  // Build state to districts mapping
  const stateMap: StateDistrictMapping = {};

  // Build district to centers mapping
  const districtMap: DistrictCentersMapping = {};

  // Check if we have any regions defined
  const hasRegions = centers.some(
    (center) => center.region && center.region.trim() !== ""
  );

  // If we don't have regions, we need to use the default
  if (!hasRegions) {
    logger.warn("No regions found in data, using 'INDIA' as default region");
  }

  // Process all centers to build mappings
  centers.forEach((center) => {
    // Use the actual region as is - do not assign a default
    const region = center.region || "";
    const { state, district } = center;

    // Skip entries without a region
    if (!region) {
      logger.warn(
        `Center ${center.name} (${center.branch_code}) has no region assigned, skipping from mappings`
      );
      return;
    }

    // Initialize the region entry if it doesn't exist
    if (!regionMap[region]) {
      regionMap[region] = {
        states: {},
        centerCount: 0,
      };
    }

    // Initialize the state within the region if it doesn't exist
    if (state && !regionMap[region].states[state]) {
      regionMap[region].states[state] = {
        centerCount: 0,
        districtCount: 0,
      };
    }

    // Increment center count for region
    regionMap[region].centerCount++;

    if (state) {
      // Initialize state entry if it doesn't exist
      if (!stateMap[state]) {
        stateMap[state] = {
          region,
          districts: {},
          centerCount: 0,
        };
      }

      // Check if this state is already assigned to a different region
      if (stateMap[state].region !== region) {
        logger.warn(
          `State "${state}" is assigned to multiple regions: "${stateMap[state].region}" and "${region}"`
        );
      }

      // Increment center count for state
      stateMap[state].centerCount++;
      regionMap[region].states[state].centerCount++;

      if (district) {
        // Initialize district entry if it doesn't exist in state
        if (!stateMap[state].districts[district]) {
          stateMap[state].districts[district] = {
            centerCount: 0,
          };

          // Increment district count for state and region-state
          regionMap[region].states[state].districtCount++;
        }

        // Increment center count for district
        stateMap[state].districts[district].centerCount++;

        // Initialize district mapping
        const districtKey = `${state}:${district}`;
        if (!districtMap[districtKey]) {
          districtMap[districtKey] = [];
        }

        // Add center to district mapping
        districtMap[districtKey].push(center);
      }
    }
  });

  logger.info(
    `Mapping complete: ${Object.keys(regionMap).length} regions, ${
      Object.keys(stateMap).length
    } states`
  );
  Object.keys(regionMap).forEach((region) => {
    logger.debug(
      `Region "${region}": ${regionMap[region].centerCount} centers, ${
        Object.keys(regionMap[region].states).length
      } states`
    );
  });

  // Store in global cache
  regionToStateMapping = regionMap;
  stateToDistrictMapping = stateMap;
  districtToCentersMapping = districtMap;
  isDataMappingInitialized = true;
}

// Function to check if we're in a build/SSR environment
const isServerEnvironment = () => {
  return typeof window === "undefined";
};

// Function to determine if we're in Next.js static generation
const isStaticGeneration = () => {
  return process.env.NEXT_PHASE === "phase-production-build";
};

// Fallback empty data structure for build time
const getEmptyData = (): CentersData => {
  //@ts-expect-error
  return {
    data: [],
    total: 0,
    zone: "",
    subzone: "",
    country: "",
    state: "",
    city: "",
  };
};

// Helper function to save data to localStorage
const saveToLocalStorage = (data: CentersData) => {
  try {
    if (isServerEnvironment()) {
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_CENTERS_KEY, JSON.stringify(data));
    localStorage.setItem(LOCAL_STORAGE_TIMESTAMP_KEY, Date.now().toString());
    console.log('Saved centers data to localStorage cache');
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

// Helper function to load data from localStorage
const loadFromLocalStorage = (): { data: CentersData | null, isExpired: boolean } => {
  try {
    if (isServerEnvironment()) {
      return { data: null, isExpired: true };
    }
    
    const cachedData = localStorage.getItem(LOCAL_STORAGE_CENTERS_KEY);
    const timestamp = localStorage.getItem(LOCAL_STORAGE_TIMESTAMP_KEY);
    
    if (!cachedData || !timestamp) {
      return { data: null, isExpired: true };
    }
    
    const isExpired = Date.now() - parseInt(timestamp) > CACHE_EXPIRY_MS;
    return { 
      data: JSON.parse(cachedData) as CentersData, 
      isExpired 
    };
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return { data: null, isExpired: true };
  }
};

// Function to fetch data from API only
async function fetchCentersData(canUseCache: boolean = true): Promise<CentersData> {
  logger.debug("fetchCentersData: Starting to fetch centers data");
  
  // Return cached data if available and cache usage is allowed
  if (canUseCache && centersData !== null) {
    logger.trace("fetchCentersData: Returning in-memory cached data");
    return centersData;
  }

  // If we're in a build environment or SSR, return empty data
  // This prevents API calls during static generation
  if (isServerEnvironment() && isStaticGeneration()) {
    logger.warn("Static generation detected - using empty centers data");
    const emptyData = getEmptyData();
    centersData = emptyData;
    return emptyData;
  }

  // Try to load from localStorage first if we're in the browser
  if (!isServerEnvironment()) {
    const { data: cachedData, isExpired } = loadFromLocalStorage();
    
    if (cachedData && cachedData.data && cachedData.data.length > 0) {
      logger.debug(`fetchCentersData: Found cached data with ${cachedData.data.length} centers`);
      
      // Cache in memory for future requests
      centersData = cachedData;
      
      // If cache is not expired, return it immediately
      if (!isExpired) {
        logger.debug('fetchCentersData: Using localStorage cached data (not expired)');
        return cachedData;
      }
      
      // If expired, use it temporarily but trigger a background refresh
      logger.debug('fetchCentersData: Cache expired, returning cached data but refreshing in background');
      
      // Trigger background refresh without blocking
      (async () => {
        try {
          const freshData = await fetchFreshCentersData();
          if (freshData && freshData.data && freshData.data.length > 0) {
            centersData = freshData; // Update memory cache
            saveToLocalStorage(freshData); // Update localStorage cache
            logger.debug('Background refresh of centers data completed');
          }
        } catch (err) {
          logger.error('Background data refresh failed:', err);
        }
      })();
      
      return cachedData;
    }
  }

  // If no cache or cache expired, fetch fresh data
  try {
    const freshData = await fetchFreshCentersData();
    return freshData;
  } catch (error) {
    logger.error("Failed to fetch centers data:", error);
    
    // If we have stale data in localStorage, use it as fallback
    if (!isServerEnvironment()) {
      const { data: staleCachedData } = loadFromLocalStorage();
      if (staleCachedData && staleCachedData.data && staleCachedData.data.length > 0) {
        logger.warn('Using stale cache as fallback after fetch failure');
        centersData = staleCachedData;
        return staleCachedData;
      }
    }
    
    // Last resort - return empty data structure
    const emptyData = getEmptyData();
    centersData = emptyData;
    return emptyData;
  }
}

// Helper function to fetch fresh data from the API
async function fetchFreshCentersData(): Promise<CentersData> {
  // For client-side, always use relative URLs to avoid CORS issues
  const isBrowser = typeof window !== "undefined";
  let apiUrl: string;
  
  if (isBrowser) {
    // Client-side: use relative URL with correct base path
    const basePath = getBasePath();
    apiUrl = `${basePath}/api/centers?lightweight=false`;
    logger.trace(`fetchFreshCentersData: Client-side, using relative URL: ${apiUrl}`);
  } else {
    // Server-side: use absolute URL
    const origin = getOrigin();
    apiUrl = `${origin}/api/centers?lightweight=false`;
    logger.trace(`fetchFreshCentersData: Server-side, using absolute URL: ${apiUrl}`);
  }
  
  // Try to load from API endpoint
  logger.debug("fetchFreshCentersData: Fetching from API...");
  const response = await fetch(apiUrl, {
    cache: "no-store",
  });

  logger.debug(`fetchFreshCentersData: API response status: ${response.status}`);
  
  if (response.ok) {
    const data = (await response.json()) as CentersData;
    
    if (data.data && data.data.length > 0) {
      logger.info(`fetchFreshCentersData: Successfully loaded ${data.data.length} centers from API`);
      
      // Cache in memory for future requests
      centersData = data;
      
      // Cache in localStorage if we're in the browser
      if (!isServerEnvironment()) {
        saveToLocalStorage(data);
      }
      
      return data;
    } else {
      logger.warn("API returned empty data");
      throw new Error("API returned empty data");
    }
  } else {
    logger.error(`Failed to fetch centers data: ${response.status} ${response.statusText}`);
    console.error(`Failed to fetch centers data: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to fetch centers data: ${response.status} ${response.statusText}`);
  }
}

// Get centers for a specific state
async function fetchCentersByState(state: string): Promise<Center[]> {
  // Check cache first
  if (stateCentersCache[state]) {
    return stateCentersCache[state];
  }

  // If in build/SSR environment, return empty array
  if (isServerEnvironment() && isStaticGeneration()) {
    stateCentersCache[state] = [];
    return [];
  }

  // Use relative URLs on client-side, absolute on server-side
  const isBrowser = typeof window !== "undefined";
  let apiUrl: string;
  
  if (isBrowser) {
    const basePath = getBasePath();
    apiUrl = `${basePath}/api/centers?state=${encodeURIComponent(state)}`;
    logger.trace("fetchCentersByState: Client-side, using relative URL:", apiUrl);
  } else {
    const origin = getOrigin();
    apiUrl = `${origin}/api/centers?state=${encodeURIComponent(state)}`;
    logger.trace("fetchCentersByState: Server-side, using absolute URL:", apiUrl);
  }

  try {
    // Load directly from API with state filter
    const response = await fetch(apiUrl, {
      cache: "no-store",
    });

    if (response.ok) {
      const data = (await response.json()) as CentersData;
      // Cache the response
      stateCentersCache[state] = data.data || [];
      return data.data || [];
    }
  } catch (error) {
    logger.error(`Error fetching centers for state ${state}:`, error);
  }

  // If direct state API fails, fall back to full data
  const allCenters = await getAllCenters();
  const filtered = allCenters.filter((center) => center.state === state);
  stateCentersCache[state] = filtered;
  return filtered;
}

// Get centers for a specific district
async function fetchCentersByDistrict(
  state: string,
  district: string
): Promise<Center[]> {
  // Check cache first
  if (districtCentersCache[state]?.[district]) {
    return districtCentersCache[state][district];
  }

  // Initialize state cache if needed
  if (!districtCentersCache[state]) {
    districtCentersCache[state] = {};
  }

  // If in build/SSR environment, return empty array
  if (isServerEnvironment() && isStaticGeneration()) {
    districtCentersCache[state][district] = [];
    return [];
  }

  // Use relative URLs on client-side, absolute on server-side
  const isBrowser = typeof window !== "undefined";
  let apiUrl: string;
  
  if (isBrowser) {
    const basePath = getBasePath();
    apiUrl = `${basePath}/api/centers?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`;
    logger.trace("fetchCentersByDistrict: Client-side, using relative URL:", apiUrl);
  } else {
    const origin = getOrigin();
    apiUrl = `${origin}/api/centers?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`;
    logger.trace("fetchCentersByDistrict: Server-side, using absolute URL:", apiUrl);
  }
  
  try {
    // Load directly from API with state and district filter
    const response = await fetch(apiUrl, { cache: "no-store" });

    if (response.ok) {
      const data = (await response.json()) as CentersData;
      // Cache the response
      districtCentersCache[state][district] = data.data || [];
      return data.data || [];
    }
  } catch (error) {
    logger.error(`Error fetching centers for ${district}, ${state}:`, error);
  }

  // If direct district API fails, fall back to state data
  const stateCenters = await fetchCentersByState(state);
  const filtered = stateCenters.filter(
    (center) => center.district === district
  );
  districtCentersCache[state][district] = filtered;
  return filtered;
}

export async function getAllCenters(useSharedData: boolean = true): Promise<Center[]> {
  logger.debug("getAllCenters: Starting to fetch all centers");
  
  const data = await fetchCentersData(useSharedData);
  
  logger.debug(`getAllCenters: fetchCentersData returned ${data.data ? data.data.length : 0} centers`);

  // Update the state-region cache when we fetch all centers
  if (data.data && data.data.length > 0) {
    logger.debug("getAllCenters: Updating state-region cache");
    data.data.forEach((center) => {
      if (center.state && center.region) {
        stateRegionCache[center.state] = center.region;
      }
    });
  } else {
    console.warn("getAllCenters: No centers data to process");
  }

  return data.data || [];
}

export async function getStatesList(region?: string): Promise<string[]> {
  const centers = await getAllCenters();
  const states = new Set<string>();

  centers.forEach((center) => {
    if (center.state && (!region || center.region === region)) {
      states.add(center.state);
    }
  });

  return Array.from(states).sort();
}

export async function getDistrictsByState(state: string): Promise<string[]> {
  const centers = await fetchCentersByState(state);
  const districts = new Set<string>();

  centers.forEach((center) => {
    if (center.district) {
      districts.add(center.district);
    }
  });

  return Array.from(districts).sort();
}

export async function getCentersByDistrict(
  state: string,
  district: string
): Promise<Center[]> {
  return fetchCentersByDistrict(state, district);
}

export async function getCenterByCode(
  branchCodeOrName: string
): Promise<Center | undefined> {
  // This is a relatively rare operation, so just use the full dataset
  const centers = await getAllCenters();

  // First try to find by branch_code (exact match)
  const centerByCode = centers.find(
    (center) => center.branch_code === branchCodeOrName
  );
  if (centerByCode) return centerByCode;

  // If not found, try to find by name slug
  // Convert the input to a slug format: lowercase and hyphens
  const nameSlug = branchCodeOrName.toLowerCase().replace(/\s+/g, "-");

  // Try to find a center where the name matches the slug
  return centers.find((center) => {
    const centerNameSlug = center.name.toLowerCase().replace(/\s+/g, "-");
    return centerNameSlug === nameSlug;
  });
}

export async function getCentersByCityName(
  cityName: string
): Promise<Center[]> {
  const centers = await getAllCenters();
  return centers.filter(
    (center) => center.address?.city?.toLowerCase() === cityName.toLowerCase()
  );
}

// Helper to detect server environment
const isServer = () => {
  return typeof window === "undefined";
};

export async function getNearestCenters(
  latitude: number,
  longitude: number,
  limit: number = 5,
  providedCenters?: Center[]
): Promise<Center[]> {
  // Use provided centers if available, otherwise fetch them
  const centers = providedCenters || await getAllCenters(true);

  // Calculate distance between two points using Haversine formula
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
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
  };

  // Process centers and calculate distances
  const processedCenters = centers.map((center) => {
    // Try to get coordinates from the center
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

    // No more client-side geocoding needed - coords should be available from server processing

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
    .slice(0, Math.min(limit, 1000)); // Cap at 1000 for better lazy loading
}

export async function getStateData(state: string): Promise<{
  stateName: string;
  districts: {
    name: string;
    centerCount: number;
  }[];
}> {
  const centers = await getAllCenters();
  const stateData = centers.filter((center) => center.state === state);

  if (stateData.length === 0) {
    console.warn(`No centers found for state: ${state}`);
  }

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

// Add this function to get state summaries with counts
export async function getStatesSummary(): Promise<
  {
    state: string;
    centerCount: number;
    districtCount: number;
  }[]
> {
  const centers = await getAllCenters();
  const stateMap = new Map<
    string,
    {
      centerCount: number;
      districts: Set<string>;
    }
  >();

  // Count centers and districts per state
  centers.forEach((center) => {
    if (center.state) {
      const stateData = stateMap.get(center.state) || {
        centerCount: 0,
        districts: new Set<string>(),
      };

      stateData.centerCount++;
      if (center.district) {
        stateData.districts.add(center.district);
      }

      stateMap.set(center.state, stateData);
    }
  });

  // Convert to array format
  return Array.from(stateMap.entries()).map(([state, data]) => ({
    state,
    centerCount: data.centerCount,
    districtCount: data.districts.size,
  }));
}

// Get list of available regions
export async function getRegions(): Promise<string[]> {
  const centers = await getAllCenters();
  const regions = new Set<string>();

  centers.forEach((center) => {
    if (center.region) {
      regions.add(center.region);
    }
  });

  return Array.from(regions).sort();
}

// Get states for a specific region
export async function getStatesByRegion(region: string): Promise<
  {
    name: string;
    centerCount: number;
    districtCount: number;
  }[]
> {
  // Check cache first
  if (regionStatesCache[region]) {
    const states = regionStatesCache[region];
    const statesSummary = await getStatesSummary();

    return statesSummary
      .filter((state) => states.includes(state.state))
      .map((state) => ({
        name: state.state,
        centerCount: state.centerCount,
        districtCount: state.districtCount,
      }));
  }

  const allCenters = await getAllCenters();

  // Find states in this region
  const states = new Set<string>();
  allCenters.forEach((center) => {
    if (center.region === region && center.state) {
      states.add(center.state);
    }
  });

  // Cache the result
  regionStatesCache[region] = Array.from(states);

  // Get summary data for these states
  const statesSummary = await getStatesSummary();

  return statesSummary
    .filter((state) => states.has(state.state))
    .map((state) => ({
      name: state.state,
      centerCount: state.centerCount,
      districtCount: state.districtCount,
    }));
}

// Get all centers for a state
export async function getCentersByState(state: string): Promise<Center[]> {
  return fetchCentersByState(state);
}

// Get region for a specific state
export async function getRegionForState(state: string): Promise<string> {
  // Ensure data mappings are initialized
  if (!isDataMappingInitialized) {
    await initializeDataMappings();
  }

  // Get the state data from our mapping
  const stateData = stateToDistrictMapping?.[state];
  if (stateData?.region) {
    return stateData.region;
  }

  // If we still don't have the region, try to get it from all centers
  // This is a fallback in case the mappings weren't properly initialized
  const centers = await getAllCenters();
  const center = centers.find((c) => c.state === state);
  if (center?.region) {
    return center.region;
  }

  // Return a default value if no region is found
  return "Unknown";
}

// Get full region to state mapping - much faster than individual lookups
export async function getRegionToStateMapping(): Promise<RegionStateMapping> {
  if (!isDataMappingInitialized) {
    await initializeDataMappings();
  }
  return regionToStateMapping || {};
}

// Get full state to district mapping
export async function getStateToDistrictMapping(): Promise<StateDistrictMapping> {
  if (!isDataMappingInitialized) {
    await initializeDataMappings();
  }
  return stateToDistrictMapping || {};
}

// Fast function to get all regions with their details
export async function getRegionsWithDetails(): Promise<
  {
    name: string;
    stateCount: number;
    centerCount: number;
  }[]
> {
  if (!isDataMappingInitialized) {
    await initializeDataMappings();
  }

  return Object.entries(regionToStateMapping || {})
    .map(([name, data]) => ({
      name,
      stateCount: Object.keys(data.states).length,
      centerCount: data.centerCount,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Fast function to get states by region
export async function getStatesByRegionFast(region: string): Promise<
  {
    name: string;
    centerCount: number;
    districtCount: number;
  }[]
> {
  if (!isDataMappingInitialized) {
    await initializeDataMappings();
  }

  const regionData = regionToStateMapping?.[region];
  if (!regionData) return [];

  return Object.entries(regionData.states)
    .map(([stateName, stateData]) => ({
      name: stateName,
      centerCount: stateData.centerCount,
      districtCount: stateData.districtCount,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Force reinitialization of data mappings
export async function reinitializeDataMappings(): Promise<boolean> {
  // Clear all caches
  centersData = null;
  regionToStateMapping = null;
  stateToDistrictMapping = null;
  districtToCentersMapping = null;
  isDataMappingInitialized = false;

  // Clear all other caches
  Object.keys(stateCentersCache).forEach(
    (key) => delete stateCentersCache[key]
  );
  Object.keys(districtCentersCache).forEach(
    (key) => delete districtCentersCache[key]
  );
  Object.keys(regionStatesCache).forEach(
    (key) => delete regionStatesCache[key]
  );
  Object.keys(stateRegionCache).forEach((key) => delete stateRegionCache[key]);

  try {
    // Re-initialize mappings
    await initializeDataMappings();
    return true;
  } catch (error) {
    console.error("Failed to reinitialize data mappings:", error);
    return false;
  }
}

// Get centers for a region by filtering the data
export async function getCentersByRegion(region: string): Promise<Center[]> {
  const centers = await getAllCenters();
  // Filter centers to only include those from the specified region
  return centers.filter((center) => center.region === region);
}

// Helper function to find a region by its slug
export async function getRegionBySlug(
  regionSlug: string
): Promise<string | null> {
  const regions = await getRegions();
  const possibleFormats = deSlugify(regionSlug);

  // Try to find a match among possible formats
  for (const format of possibleFormats) {
    const match = regions.find(
      (region) => region.toLowerCase() === format.toLowerCase()
    );
    if (match) return match;
  }

  // If no match found
  console.warn(`No region found for slug: ${regionSlug}`);
  return null;
}

// Helper function to find a state by its slug
export async function getStateBySlug(
  stateSlug: string
): Promise<string | null> {
  const centers = await getAllCenters();
  const states = new Set<string>();
  centers.forEach((center) => {
    if (center.state) {
      states.add(center.state);
    }
  });

  const possibleFormats = deSlugify(stateSlug);

  // Try to find a match among possible formats
  for (const format of possibleFormats) {
    const match = Array.from(states).find(
      (state) => state.toLowerCase() === format.toLowerCase()
    );
    if (match) return match;
  }

  // If no match found
  console.warn(`No state found for slug: ${stateSlug}`);
  return null;
}

// Helper function to find a district by its slug
export async function getDistrictBySlug(
  stateSlug: string,
  districtSlug: string
): Promise<string | null> {
  // First find the actual state name
  const state = await getStateBySlug(stateSlug);
  if (!state) return null;

  // Get districts for that state
  const districts = await getDistrictsByState(state);
  const possibleFormats = deSlugify(districtSlug);

  // Try to find a match among possible formats
  for (const format of possibleFormats) {
    const match = districts.find(
      (district) => district.toLowerCase() === format.toLowerCase()
    );
    if (match) return match;
  }

  // If no match found
  console.warn(
    `No district found for slug: ${districtSlug} in state: ${state}`
  );
  return null;
}

export async function getRetreatCenters(): Promise<Center[]> {
  logger.debug("==== getRetreatCenters: Starting to fetch retreat centers ====");
  
  try {
    // Get all centers
    logger.debug("getRetreatCenters: Calling getAllCenters");
    const allCenters = await getAllCenters();
    
    logger.debug(`getRetreatCenters: Retrieved ${allCenters.length} centers`);
    
    if (!allCenters || allCenters.length === 0) {
      logger.warn('No centers found in the database');
      return [];
    }

    // Filter centers that are retreat centers using the branch codes
    logger.debug(`getRetreatCenters: Filtering using ${RETREAT_CENTER_BRANCH_CODES.length} retreat center branch codes`);
    logger.debug("Retreat center branch codes:", RETREAT_CENTER_BRANCH_CODES.join(", "));
    
    const retreatCenters = allCenters.filter(center => 
      center.branch_code && RETREAT_CENTER_BRANCH_CODES.includes(center.branch_code)
    );

    logger.debug(`getRetreatCenters: Found ${retreatCenters.length} retreat centers after filtering`);
    
    if (retreatCenters.length === 0) {
      // Try logging branch codes of all centers to see if they match what we expect
      logger.debug("getRetreatCenters: No retreat centers found, checking branch codes from data:");
      const allBranchCodes = allCenters
        .filter(c => c.branch_code)
        .map(c => c.branch_code);
      
      logger.debug(`getRetreatCenters: Sample of branch codes from data (first 10): ${allBranchCodes.slice(0, 10).join(", ")}`);
      
      // Check if any of our expected retreat centers exist in the data
      const matchingCodes = RETREAT_CENTER_BRANCH_CODES.filter(code => 
        allBranchCodes.includes(code)
      );
      
      logger.debug(`getRetreatCenters: Matching branch codes between data and retreat centers: ${matchingCodes.join(", ")}`);
    } else {
      // Log the returned retreat centers for debugging
      logger.debug("getRetreatCenters: Found these retreat centers:");
      retreatCenters.forEach(center => {
        logger.debug(`- ${center.name} (${center.branch_code})`);
      });
    }

    // Sort centers according to the order in RETREAT_CENTER_BRANCH_CODES
    return retreatCenters.sort((a, b) => {
      const indexA = RETREAT_CENTER_BRANCH_CODES.indexOf(a.branch_code);
      const indexB = RETREAT_CENTER_BRANCH_CODES.indexOf(b.branch_code);
      return indexA - indexB;
    });
  } catch (error) {
    logger.error('Error fetching retreat centers:', error);
    return [];
  }
}
