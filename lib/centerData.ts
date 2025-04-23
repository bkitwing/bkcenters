// Data service for center information - client-side only
import { Center, CentersData } from './types';

// Cache for data
let centersData: CentersData | null = null;
const stateCentersCache: Record<string, Center[]> = {};
const districtCentersCache: Record<string, Record<string, Center[]>> = {};

// Function to fetch data from API only
async function fetchCentersData(): Promise<CentersData> {
  // Return cached data if available
  if (centersData !== null) return centersData;
  
  // Get the origin for absolute URLs
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  try {
    // Try to load from API endpoint with absolute URL - with lightweight parameter to reduce response size
    const response = await fetch(`${origin}/api/centers?lightweight=true`);
    
    if (response.ok) {
      const data = await response.json() as CentersData;
      centersData = data;
      return data;
    }
  } catch (apiError) {
    console.error('API data loading error:', apiError);
    
    // Fallback: Try to load mock data directly
    try {
      console.log('Attempting to load mock data...');
      const mockResponse = await fetch(`${origin}/mock-centers.json`);
      
      if (mockResponse.ok) {
        const mockData = await mockResponse.json() as CentersData;
        centersData = mockData;
        return mockData;
      }
    } catch (fallbackError) {
      console.error('Mock data loading failed:', fallbackError);
    }
  }
  
  // Return empty data structure as last resort
  console.warn('Using empty centers data as fallback');
  return { total: 0, zone: '', subzone: '', country: '', state: '', city: '', data: [] };
}

// Get centers for a specific state
async function fetchCentersByState(state: string): Promise<Center[]> {
  // Check cache first
  if (stateCentersCache[state]) {
    return stateCentersCache[state];
  }
  
  // Get the origin for absolute URLs
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  try {
    // Load directly from API with state filter
    const response = await fetch(`${origin}/api/centers?state=${encodeURIComponent(state)}`);
    
    if (response.ok) {
      const data = await response.json() as CentersData;
      // Cache the response
      stateCentersCache[state] = data.data || [];
      return data.data || [];
    }
  } catch (error) {
    console.error(`Error fetching centers for state ${state}:`, error);
  }
  
  // If direct state API fails, fall back to full data
  const allCenters = await getAllCenters();
  const filtered = allCenters.filter(center => center.state === state);
  stateCentersCache[state] = filtered;
  return filtered;
}

// Get centers for a specific district
async function fetchCentersByDistrict(state: string, district: string): Promise<Center[]> {
  // Check cache first
  if (districtCentersCache[state]?.[district]) {
    return districtCentersCache[state][district];
  }
  
  // Initialize state cache if needed
  if (!districtCentersCache[state]) {
    districtCentersCache[state] = {};
  }
  
  // Get the origin for absolute URLs
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  try {
    // Load directly from API with state and district filter
    const response = await fetch(
      `${origin}/api/centers?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`
    );
    
    if (response.ok) {
      const data = await response.json() as CentersData;
      // Cache the response
      districtCentersCache[state][district] = data.data || [];
      return data.data || [];
    }
  } catch (error) {
    console.error(`Error fetching centers for ${district}, ${state}:`, error);
  }
  
  // If direct district API fails, fall back to state data
  const stateCenters = await fetchCentersByState(state);
  const filtered = stateCenters.filter(center => center.district === district);
  districtCentersCache[state][district] = filtered;
  return filtered;
}

export async function getAllCenters(): Promise<Center[]> {
  const data = await fetchCentersData();
  return data.data || [];
}

export async function getStatesList(): Promise<string[]> {
  const centers = await getAllCenters();
  const states = new Set<string>();
  
  centers.forEach(center => {
    if (center.state) {
      states.add(center.state);
    }
  });
  
  return Array.from(states).sort();
}

export async function getDistrictsByState(state: string): Promise<string[]> {
  const centers = await fetchCentersByState(state);
  const districts = new Set<string>();
  
  centers.forEach(center => {
    if (center.district) {
      districts.add(center.district);
    }
  });
  
  return Array.from(districts).sort();
}

export async function getCentersByDistrict(state: string, district: string): Promise<Center[]> {
  return fetchCentersByDistrict(state, district);
}

export async function getCenterByCode(branchCode: string): Promise<Center | undefined> {
  // This is a relatively rare operation, so just use the full dataset
  const centers = await getAllCenters();
  return centers.find(center => center.branch_code === branchCode);
}

export async function getCentersByCityName(cityName: string): Promise<Center[]> {
  const centers = await getAllCenters();
  return centers.filter(center => 
    center.address?.city?.toLowerCase() === cityName.toLowerCase()
  );
}

export async function getNearestCenters(latitude: number, longitude: number, limit: number = 5): Promise<Center[]> {
  const centers = await getAllCenters();
  
  // Calculate distance between two points using Haversine formula
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Add distance to each center and sort by distance
  const centersWithDistance = centers
    .filter(center => center.coords && center.coords.length === 2)
    .map(center => {
      const lat = parseFloat(center.coords[0]);
      const lng = parseFloat(center.coords[1]);
      const distance = getDistance(latitude, longitude, lat, lng);
      return { ...center, distance };
    })
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

  return centersWithDistance.slice(0, limit);
}

export async function getStateData(state: string): Promise<{ 
  stateName: string;
  districts: { 
    name: string; 
    centerCount: number;
  }[] 
}> {
  const centers = await getAllCenters();
  const stateData = centers.filter(center => center.state === state);
  
  if (stateData.length === 0) {
    console.warn(`No centers found for state: ${state}`);
  }
  
  const districts = new Map<string, number>();
  
  stateData.forEach(center => {
    if (center.district) {
      const count = districts.get(center.district) || 0;
      districts.set(center.district, count + 1);
    }
  });
  
  return {
    stateName: state,
    districts: Array.from(districts.entries()).map(([name, centerCount]) => ({
      name,
      centerCount
    })).sort((a, b) => a.name.localeCompare(b.name))
  };
}

// Add this function to get state summaries with counts

export async function getStatesSummary(): Promise<{
  state: string;
  centerCount: number;
  districtCount: number;
}[]> {
  const centers = await getAllCenters();
  const stateMap = new Map<string, {
    centerCount: number;
    districts: Set<string>;
  }>();
  
  // Count centers and districts per state
  centers.forEach(center => {
    if (center.state) {
      const stateData = stateMap.get(center.state) || { centerCount: 0, districts: new Set<string>() };
      
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
    districtCount: data.districts.size
  }));
} 