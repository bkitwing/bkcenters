import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CentersData, Center } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    // Check if we need to just return keys for a single state or district
    const state = url.searchParams.get('state');
    const district = url.searchParams.get('district');
    const lightweight = url.searchParams.get('lightweight') === 'true';
    
    // Get raw data
    const centersData = await loadCentersData();
    
    // Return filtered and optimized data based on query params
    if (state) {
      // Filter by state
      const filtered = centersData.data.filter(center => center.state === state);
      
      if (district) {
        // Further filter by district
        const districtCenters = filtered.filter(center => center.district === district);
        
        return createResponse({
          ...centersData,
          total: districtCenters.length,
          state,
          data: districtCenters.map(center => optimizeCenter(center, lightweight))
        });
      }
      
      return createResponse({
        ...centersData,
        total: filtered.length,
        state,
        data: filtered.map(center => optimizeCenter(center, lightweight))
      });
    }
    
    // Return all centers but optimize data size
    return createResponse({
      ...centersData,
      data: centersData.data.map(center => optimizeCenter(center, lightweight))
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to load centers data' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }
}

// Helper to create a response with appropriate headers
function createResponse(data: any) {
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}

// Optimize center object size by removing unnecessary fields
function optimizeCenter(center: Center, lightweight: boolean): Center {
  if (lightweight) {
    // Return only essential fields for listing and maps
    return {
      name: center.name,
      branch_code: center.branch_code,
      district: center.district,
      state: center.state,
      coords: center.coords,
      // Include complete address
      address: {
        city: center.address.city || '',
        line1: center.address.line1 || '',
        line2: center.address.line2 || '',
        line3: center.address.line3 || '',
        pincode: center.address.pincode || ''
      },
      // Keep contact information for the cards
      email: center.email || '',
      contact: center.contact || '',
      mobile: center.mobile || '',
      country: center.country,
      // These fields can be empty but maintain type compatibility
      zone: '',
      sub_zone: '',
      section: '',
      region: '',
      district_id: '',
      state_id: '',
      country_id: ''
    };
  }
  
  // Return full center data
  return center;
}

// Load centers data from file system
async function loadCentersData(): Promise<CentersData> {
  // Try to load the main data file first
  const mainFilePath = path.join(process.cwd(), 'Center Locatore.json');
  if (fs.existsSync(mainFilePath)) {
    try {
      const fileContents = fs.readFileSync(mainFilePath, 'utf8');
      return JSON.parse(fileContents) as CentersData;
    } catch (error) {
      console.error('Error reading main centers data:', error);
      // Continue to fallback if main file fails
    }
  }

  // Fallback to mock data
  const mockFilePath = path.join(process.cwd(), 'public/mock-centers.json');
  if (fs.existsSync(mockFilePath)) {
    try {
      const mockContents = fs.readFileSync(mockFilePath, 'utf8');
      return JSON.parse(mockContents) as CentersData;
    } catch (mockError) {
      console.error('Error reading mock centers data:', mockError);
    }
  }

  // If both fail, return an empty data structure
  return { 
    total: 0, 
    zone: '', 
    subzone: '', 
    country: 'INDIA', 
    state: '', 
    city: '', 
    data: [] 
  };
} 