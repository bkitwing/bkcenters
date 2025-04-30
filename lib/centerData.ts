// Data service for center information - client-side only
import {
  Center,
  CentersData,
  RegionStateMapping,
  StateDistrictMapping,
  DistrictCentersMapping,
} from "./types";
import { deSlugify } from "./urlUtils";

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

// Function to build all data mappings - call this once at initialization
async function initializeDataMappings(): Promise<void> {
  if (isDataMappingInitialized) return;

  console.log("Initializing data mappings...");
  const centers = await getAllCenters();
  console.log(`Loaded ${centers.length} centers for mapping`);

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
    console.warn("No regions found in data, using 'INDIA' as default region");
  }

  // Process all centers to build mappings
  centers.forEach((center) => {
    // Use the actual region as is - do not assign a default
    const region = center.region || "";
    const { state, district } = center;

    // Skip entries without a region
    if (!region) {
      console.warn(
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
        console.warn(
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

  console.log(
    `Mapping complete: ${Object.keys(regionMap).length} regions, ${
      Object.keys(stateMap).length
    } states`
  );
  Object.keys(regionMap).forEach((region) => {
    console.log(
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

// Function to fetch data from API only
async function fetchCentersData(): Promise<CentersData> {
  // Return cached data if available
  if (centersData !== null) return centersData;

  // If we're in a build environment or SSR, return empty data
  // This prevents API calls during static generation
  if (isServerEnvironment() && isStaticGeneration()) {
    console.warn("Static generation detected - using empty centers data");
    const emptyData = getEmptyData();
    centersData = emptyData;
    return emptyData;
  }

  // Get the origin for absolute URLs
  const origin =
    typeof window !== "undefined"
      ? window.location.origin + process.env.NEXT_PUBLIC_BASE_PATH
      : "http://localhost:3000" + process.env.NEXT_PUBLIC_BASE_PATH;

  try {
    // Try to load from API endpoint with absolute URL
    const response = await fetch(`${origin}/api/centers?lightweight=false`, {
      // Add cache: 'no-store' to avoid caching issues during build
      cache: "no-store",
    });

    if (response.ok) {
      const data = (await response.json()) as CentersData;
      centersData = data;
      return data;
    } else {
      console.error(
        `Failed to fetch centers data: ${response.status} ${response.statusText}`
      );
      // Return empty data on error to avoid build failures
      const emptyData = getEmptyData();
      centersData = emptyData;
      return emptyData;
    }
  } catch (error) {
    console.error("API data loading error:", error);
    // Return empty data on error
    const emptyData = getEmptyData();
    centersData = emptyData;
    return emptyData;
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

  // Get the origin for absolute URLs
  const origin =
    typeof window !== "undefined"
      ? window.location.origin + process.env.NEXT_PUBLIC_BASE_PATH
      : "http://localhost:3000" + process.env.NEXT_PUBLIC_BASE_PATH;

  try {
    // Load directly from API with state filter
    const response = await fetch(
      `${origin}/api/centers?state=${encodeURIComponent(state)}`,
      {
        cache: "no-store",
      }
    );

    if (response.ok) {
      const data = (await response.json()) as CentersData;
      // Cache the response
      stateCentersCache[state] = data.data || [];
      return data.data || [];
    }
  } catch (error) {
    console.error(`Error fetching centers for state ${state}:`, error);
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

  // Get the origin for absolute URLs
  const origin =
    typeof window !== "undefined"
      ? window.location.origin + process.env.NEXT_PUBLIC_BASE_PATH
      : "http://localhost:3000" + process.env.NEXT_PUBLIC_BASE_PATH;
  try {
    // Load directly from API with state and district filter
    const response = await fetch(
      `${origin}/api/centers?state=${encodeURIComponent(
        state
      )}&district=${encodeURIComponent(district)}`,
      { cache: "no-store" }
    );

    if (response.ok) {
      const data = (await response.json()) as CentersData;
      // Cache the response
      districtCentersCache[state][district] = data.data || [];
      return data.data || [];
    }
  } catch (error) {
    console.error(`Error fetching centers for ${district}, ${state}:`, error);
  }

  // If direct district API fails, fall back to state data
  const stateCenters = await fetchCentersByState(state);
  const filtered = stateCenters.filter(
    (center) => center.district === district
  );
  districtCentersCache[state][district] = filtered;
  return filtered;
}

export async function getAllCenters(): Promise<Center[]> {
  const data = await fetchCentersData();

  // Update the state-region cache when we fetch all centers
  data.data.forEach((center) => {
    if (center.state && center.region) {
      stateRegionCache[center.state] = center.region;
    }
  });

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
  limit: number = 5
): Promise<Center[]> {
  const centers = await getAllCenters();

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
  const processedCenters = await Promise.all(
    centers.map(async (center) => {
      // Try to get coordinates from the center
      let lat: number | null = null;
      let lng: number | null = null;

      // First check if center has valid coordinates
      if (center.coords && center.coords.length === 2) {
        const parsedLat = parseFloat(center.coords[0]);
        const parsedLng = parseFloat(center.coords[1]);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          lat = parsedLat;
          lng = parsedLng;
        }
      }

      // If no valid coordinates and we're in the browser, try to geocode the address
      // Skip geocoding on the server to prevent errors
      if ((lat === null || lng === null) && !isServer()) {
        try {
          const { geocodeAddress } = await import("./geocoding");
          const geocodedCoords = await geocodeAddress(center);
          if (geocodedCoords) {
            lat = parseFloat(geocodedCoords[0]);
            lng = parseFloat(geocodedCoords[1]);
          }
        } catch (error) {
          console.warn(
            `Failed to geocode address for center ${center.name}:`,
            error
          );
        }
      }

      // Calculate distance if we have valid coordinates
      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        const distance = getDistance(latitude, longitude, lat, lng);
        return { ...center, distance };
      }

      // If still no valid coordinates, return center with Infinity distance
      return { ...center, distance: Infinity };
    })
  );

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
  const allCenters = await getAllCenters();

  // For now, we'll manually select retreat centers
  // In a production environment, you would typically use a flag in the database

  // List of branch codes or names for retreat centers
  const retreatCenterBranchCodes: string[] = [
    "90001",
    "90007",
    "90006",
    "04543",
    "01758",
    "04195",
    "03793",
    "03724",
    "03180",
    "02755",
    "02417",
    "02284",
    "01758",
    "00858",
    "00510",
    "00386",
    "00346",
    "00182",
    // For example: 'RET001', 'RET002', etc.
    // You should replace these with your actual retreat center codes
  ];

  // Filter centers that are retreat centers
  const retreatCenters = allCenters.filter((center) =>
    retreatCenterBranchCodes.includes(center.branch_code)
  );

  return retreatCenters;
}
