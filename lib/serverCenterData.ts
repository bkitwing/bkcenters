/**
 * Server-side only data access functions for center data.
 * These functions read directly from the JSON file and are safe to use with ISR/static generation.
 * 
 * IMPORTANT: This file should only be imported in Server Components, not in Client Components.
 * It uses Node.js fs module which is not available in the browser.
 */

import path from 'path';
import fs from 'fs';
import { Center, CentersData, RegionStateMapping } from './types';
import { logger } from './logger';
import { deSlugify } from './urlUtils';
import { RETREAT_CENTER_BRANCH_CODES } from './retreatCenters';

// Cache for loaded data (per-request in production, persistent in development)
let centersCache: Center[] | null = null;

/**
 * Load all centers directly from the JSON file.
 * This is the primary data loading function for server-side rendering.
 */
export async function loadCentersFromFile(): Promise<Center[]> {
  // Return cached data if available
  if (centersCache !== null) {
    return centersCache;
  }

  try {
    const publicFilePath = path.join(process.cwd(), 'public', 'Center-Processed.json');
    const rootFilePath = path.join(process.cwd(), 'Center-Processed.json');
    
    let filePath: string;
    if (fs.existsSync(publicFilePath)) {
      filePath = publicFilePath;
      logger.trace('serverCenterData: Using data file from public directory');
    } else if (fs.existsSync(rootFilePath)) {
      filePath = rootFilePath;
      logger.trace('serverCenterData: Using data file from root directory');
    } else {
      logger.error('serverCenterData: Centers data file not found in any location');
      return [];
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data: CentersData = JSON.parse(fileContent);
    
    if (!data || !data.data || !Array.isArray(data.data)) {
      logger.error('serverCenterData: Invalid data structure in centers file');
      return [];
    }
    
    logger.debug(`serverCenterData: Loaded ${data.data.length} centers from file`);
    centersCache = data.data;
    return data.data;
  } catch (error) {
    logger.error('serverCenterData: Error loading centers from file:', error);
    return [];
  }
}

/**
 * Get a center by its branch code or name slug.
 */
export async function getCenterByCode(branchCodeOrName: string): Promise<Center | undefined> {
  const centers = await loadCentersFromFile();
  
  // First try to find by branch_code (exact match)
  const centerByCode = centers.find(
    (center) => center.branch_code === branchCodeOrName
  );
  if (centerByCode) return centerByCode;

  // If not found, try to find by name slug
  const nameSlug = branchCodeOrName.toLowerCase().replace(/\s+/g, '-');
  
  return centers.find((center) => {
    const centerNameSlug = center.name.toLowerCase().replace(/\s+/g, '-');
    return centerNameSlug === nameSlug;
  });
}

/**
 * Get all centers for a specific state.
 */
export async function getCentersByState(state: string): Promise<Center[]> {
  const centers = await loadCentersFromFile();
  return centers.filter((center) => center.state === state);
}

/**
 * Get all centers for a specific district within a state.
 */
export async function getCentersByDistrict(state: string, district: string): Promise<Center[]> {
  const centers = await loadCentersFromFile();
  return centers.filter(
    (center) => center.state === state && center.district === district
  );
}

/**
 * Get the region for a specific state.
 */
export async function getRegionForState(state: string): Promise<string> {
  const centers = await loadCentersFromFile();
  const center = centers.find((c) => c.state === state);
  
  if (center?.region) {
    return center.region;
  }
  
  return 'Unknown';
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
  const centers = await loadCentersFromFile();
  const regions = new Set<string>();

  centers.forEach((center) => {
    if (center.region) {
      regions.add(center.region);
    }
  });

  return Array.from(regions).sort();
}

/**
 * Get districts for a specific state.
 */
export async function getDistrictsByState(state: string): Promise<string[]> {
  const centers = await loadCentersFromFile();
  const districts = new Set<string>();

  centers
    .filter((center) => center.state === state)
    .forEach((center) => {
      if (center.district) {
        districts.add(center.district);
      }
    });

  return Array.from(districts).sort();
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
  const centers = await loadCentersFromFile();
  const stateData = centers.filter((center) => center.state === state);

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
  const allCenters = await loadCentersFromFile();
  
  // Find states in this region
  const stateDataMap = new Map<string, { centerCount: number; districts: Set<string> }>();
  
  allCenters.forEach((center) => {
    if (center.region === region && center.state) {
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
  const centers = await loadCentersFromFile();
  const stateMap = new Map<
    string,
    {
      centerCount: number;
      districts: Set<string>;
    }
  >();

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

  return Array.from(stateMap.entries()).map(([state, data]) => ({
    state,
    centerCount: data.centerCount,
    districtCount: data.districts.size,
  }));
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
  const centers = await loadCentersFromFile();
  return centers.filter((center) => center.region === region);
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
 * Fast function to get states by region.
 */
export async function getStatesByRegionFast(region: string): Promise<
  {
    name: string;
    centerCount: number;
    districtCount: number;
  }[]
> {
  const allCenters = await loadCentersFromFile();
  
  const stateDataMap = new Map<string, { centerCount: number; districts: Set<string> }>();
  
  allCenters.forEach((center) => {
    if (center.region === region && center.state) {
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
 * Find a region by its slug.
 */
export async function getRegionBySlug(regionSlug: string): Promise<string | null> {
  const regions = await getRegions();
  const possibleFormats = deSlugify(regionSlug);

  for (const format of possibleFormats) {
    const match = regions.find(
      (region) => region.toLowerCase() === format.toLowerCase()
    );
    if (match) return match;
  }

  return null;
}

/**
 * Find a state by its slug.
 */
export async function getStateBySlug(stateSlug: string): Promise<string | null> {
  const centers = await loadCentersFromFile();
  const states = new Set<string>();
  
  centers.forEach((center) => {
    if (center.state) {
      states.add(center.state);
    }
  });

  const possibleFormats = deSlugify(stateSlug);

  for (const format of possibleFormats) {
    const match = Array.from(states).find(
      (state) => state.toLowerCase() === format.toLowerCase()
    );
    if (match) return match;
  }

  return null;
}

/**
 * Find a district by its slug.
 */
export async function getDistrictBySlug(
  stateSlug: string,
  districtSlug: string
): Promise<string | null> {
  const state = await getStateBySlug(stateSlug);
  if (!state) return null;

  const districts = await getDistrictsByState(state);
  const possibleFormats = deSlugify(districtSlug);

  for (const format of possibleFormats) {
    const match = districts.find(
      (district) => district.toLowerCase() === format.toLowerCase()
    );
    if (match) return match;
  }

  return null;
}

/**
 * Get retreat centers.
 */
export async function getRetreatCenters(): Promise<Center[]> {
  const allCenters = await loadCentersFromFile();

  const retreatCenters = allCenters.filter(
    (center) =>
      center.branch_code && RETREAT_CENTER_BRANCH_CODES.includes(center.branch_code)
  );

  // Sort centers according to the order in RETREAT_CENTER_BRANCH_CODES
  return retreatCenters.sort((a, b) => {
    const indexA = RETREAT_CENTER_BRANCH_CODES.indexOf(a.branch_code);
    const indexB = RETREAT_CENTER_BRANCH_CODES.indexOf(b.branch_code);
    return indexA - indexB;
  });
}

