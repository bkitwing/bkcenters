import { Suspense } from "react";
import {
  getStatesSummary,
  getAllCenters,
  getRegionsWithDetails,
  getRegionToStateMapping,
  getRetreatCenters,
} from "@/lib/centerData";
import HomePageClient from "@/components/HomePageClient";
import { Center, RegionStateMapping } from "@/lib/types";
import { RETREAT_CENTER_BRANCH_CODES } from '@/lib/retreatCenters';
import path from 'path';
import fs from 'fs';

// ISR: Page will be generated at build time and cached until next build
// Since Center-Processed.json only changes during build, we can cache indefinitely
export const revalidate = false;

// Type for state summary
type StateSummary = {
  state: string;
  centerCount: number;
  districtCount: number;
};

// Helper function to load centers directly from file (for server-side)
async function loadCentersFromFile(): Promise<Center[]> {
  try {
    const publicFilePath = path.join(process.cwd(), 'public', 'Center-Processed.json');
    const rootFilePath = path.join(process.cwd(), 'Center-Processed.json');
    
    let filePath;
    if (fs.existsSync(publicFilePath)) {
      filePath = publicFilePath;
    } else if (fs.existsSync(rootFilePath)) {
      filePath = rootFilePath;
    } else {
      console.error('Centers data file not found');
      return [];
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    if (!data || !data.data || !Array.isArray(data.data)) {
      console.error('Invalid data structure in centers file');
      return [];
    }
    
    return data.data;
  } catch (error) {
    console.error('Error loading centers from file:', error);
    return [];
  }
}

// Helper function to build state summary from centers
function buildStatesSummary(centers: Center[]): StateSummary[] {
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

// Helper function to build region details from centers
function buildRegionDetails(centers: Center[]): { name: string; stateCount: number; centerCount: number }[] {
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

// Helper function to build region to states mapping from centers
function buildRegionToStatesMapping(centers: Center[]): RegionStateMapping {
  const regionMap: RegionStateMapping = {};

  centers.forEach((center) => {
    const region = center.region || "";
    const { state, district } = center;

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
        districtCount: 0,
      };
    }

    regionMap[region].centerCount++;

    if (state) {
      regionMap[region].states[state].centerCount++;
      
      // Count unique districts (simplified - counts each district mention once per state)
      // This is a simplification; for accurate district count, we'd need to track unique districts
    }
  });

  // Calculate district counts properly
  const stateDistrictMap = new Map<string, Set<string>>();
  centers.forEach((center) => {
    if (center.state && center.district) {
      if (!stateDistrictMap.has(center.state)) {
        stateDistrictMap.set(center.state, new Set());
      }
      stateDistrictMap.get(center.state)!.add(center.district);
    }
  });

  // Update district counts in region mapping
  Object.keys(regionMap).forEach((region) => {
    Object.keys(regionMap[region].states).forEach((state) => {
      const districts = stateDistrictMap.get(state);
      if (districts) {
        regionMap[region].states[state].districtCount = districts.size;
      }
    });
  });

  return regionMap;
}

// Type for lightweight state map marker (minimal data needed for map display)
type StateMapMarker = {
  name: string;
  state: string;
  region: string;
  coords: [string, string];
  description: string;
  summary: string;
  centerCount: number;
  districtCount: number;
};

// Helper function to build state map markers (one per state with valid coordinates)
function buildStateMapMarkers(
  centers: Center[],
  statesSummary: { state: string; centerCount: number; districtCount: number }[]
): StateMapMarker[] {
  return statesSummary
    .map((stateSummary) => {
      // Find a center in this state to use as reference point for the map marker
      const stateCenter = centers.find(
        (center) =>
          center.state === stateSummary.state &&
          center.coords &&
          Array.isArray(center.coords) &&
          center.coords.length === 2 &&
          center.coords[0] !== null &&
          center.coords[1] !== null &&
          !isNaN(parseFloat(center.coords[0])) &&
          !isNaN(parseFloat(center.coords[1]))
      );

      if (stateCenter && stateCenter.coords) {
        return {
          name: stateSummary.state,
          state: stateSummary.state,
          region: stateCenter.region || 'INDIA',
          coords: stateCenter.coords as [string, string],
          description: `${stateSummary.centerCount} meditation ${
            stateSummary.centerCount === 1 ? "center" : "centers"
          }`,
          summary: `${stateSummary.centerCount} ${
            stateSummary.centerCount === 1 ? "center" : "centers"
          } across ${stateSummary.districtCount} districts`,
          centerCount: stateSummary.centerCount,
          districtCount: stateSummary.districtCount,
        };
      }

      return null;
    })
    .filter((marker): marker is StateMapMarker => marker !== null);
}

export default async function HomePage() {
  // Load all data directly from file at build time
  const allCenters = await loadCentersFromFile();
  
  // Build derived data from centers
  const statesSummary = buildStatesSummary(allCenters);
  const regionDetails = buildRegionDetails(allCenters);
  const regionToStates = buildRegionToStatesMapping(allCenters);
  
  // Pre-compute state map markers (one lightweight marker per state for the map)
  // This avoids sending all 9000+ centers to the client
  const stateMapMarkers = buildStateMapMarkers(allCenters, statesSummary);
  
  // Calculate totals
  const totalCenters = allCenters.length;
  const uniqueStates = new Set(allCenters.map(center => center.state));
  const totalStates = uniqueStates.size;
  const totalDistricts = statesSummary.reduce((sum, state) => sum + state.districtCount, 0);
  
  // Count retreat centers
  const retreatCentersCount = allCenters.filter(
    center => center.branch_code && RETREAT_CENTER_BRANCH_CODES.includes(center.branch_code)
  ).length;

  return (
    <Suspense fallback={
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-8"></div>
          <div className="h-24 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </main>
    }>
      <HomePageClient
        initialStatesSummary={statesSummary}
        initialStateMapMarkers={stateMapMarkers}
        initialRegionDetails={regionDetails}
        initialRegionToStates={regionToStates}
        totalCenters={totalCenters}
        totalStates={totalStates}
        totalDistricts={totalDistricts}
        retreatCentersCount={retreatCentersCount}
      />
    </Suspense>
  );
}
