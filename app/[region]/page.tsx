import React from 'react';
import Link from 'next/link';
import { 
  getStatesByRegion, 
  getStatesSummary, 
  getAllCenters, 
  getRegions,
  getCentersByRegion,
  getStatesByRegionFast,
  getRegionBySlug
} from '@/lib/centerData';
import { Metadata } from 'next';
import CenterMap from '@/components/CenterMap';
import { Center } from '@/lib/types';
import { formatCenterUrl } from '@/lib/urlUtils';
import { generateOgImageUrl } from '@/lib/ogUtils';

// Define a unified type for state data
interface StateData {
  name: string;
  centerCount: number;
  districtCount: number;
}

interface RegionPageProps {
  params: {
    region: string;
  };
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const regionSlug = decodeURIComponent(params.region);
  const actualRegion = await getRegionBySlug(regionSlug) || regionSlug;
  
  // Get centers and states for this region
  const centers = await getCentersByRegion(actualRegion);
  const states = await getStatesByRegionFast(actualRegion);
  
  const title = `${actualRegion} - Brahma Kumaris Rajyog Meditation Centers`;
  const description = `Explore Brahma Kumaris Rajyog meditation centers in ${actualRegion}. ${centers.length} centers across ${states.length} states.`;

  // Calculate total districts
  const districts = states.reduce((sum, state) => sum + state.districtCount, 0);

  const pageTitle = `${actualRegion} Rajyoga Meditation Center`;
  const imageTitle = actualRegion;

  const ogImage = generateOgImageUrl({
    title: actualRegion,
    description: `${centers.length} Centers in ( ${states.length} States-Uts & ${districts} Districts)`,
    type: 'region',
    region: actualRegion,
  });

  return {
    title,
    description,
    keywords: `Brahma Kumaris, Rajyog Meditation Centers, ${actualRegion}, spiritual centers, meditation centers`,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Brahma Kumaris Centers in ${actualRegion}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function RegionPage({ params }: RegionPageProps) {
  const regionSlug = decodeURIComponent(params.region);
  const region = await getRegionBySlug(regionSlug) || regionSlug;
  
  // If the region is INDIA, show all states grouped by their regions
  let states;
  let statesByRegion: Record<string, StateData[]> = {};
  let totalCenters = 0;
  let totalDistricts = 0;
  let availableRegions: string[] = [];
  
  if (region === 'INDIA') {
    // Get all states with summary data
    const statesSummary = await getStatesSummary();
    
    // Get all centers to find region data - but filter out non-India centers
    const allCenters = await getAllCenters();
    const indiaCenters = allCenters.filter(c => c.country === 'INDIA' && (!c.region || c.region === 'INDIA'));
    
    // Get all available regions
    availableRegions = await getRegions();
    
    // Create a mapping of state to region
    const stateToRegion: Record<string, string> = {};
    allCenters.forEach(center => {
      if (center.state && center.region && center.country === 'INDIA') {
        stateToRegion[center.state] = center.region;
      }
    });
    
    // Group states by region - only for India-related regions
    availableRegions
      .filter(r => r === 'INDIA')
      .forEach(regionName => {
        statesByRegion[regionName] = [];
      });
    
    // Add states to their regions - only for INDIA region
    statesSummary.forEach(state => {
      // Only process states that belong to India region
      const centerInState = allCenters.find(c => c.state === state.state);
      if (!centerInState || centerInState.country !== 'INDIA') {
        return; // Skip non-India states
      }
      
      // Only include in INDIA region if explicitly set or missing
      const stateRegion = stateToRegion[state.state];
      if (stateRegion && stateRegion !== 'INDIA') {
        return; // Skip states that belong to other specific regions
      }
      
      const regionToUse = 'INDIA';
      
      if (!statesByRegion[regionToUse]) {
        statesByRegion[regionToUse] = [];
      }
      
      statesByRegion[regionToUse].push({
        name: state.state,
        centerCount: state.centerCount,
        districtCount: state.districtCount
      });
      
      totalCenters += state.centerCount;
      totalDistricts += state.districtCount;
    });
    
    // Use the same interface for both cases
    states = Object.values(statesByRegion).flat();
  } else {
    // For specific regions, just show states in that region
    // Use the faster function that works with our mapping
    const regionStates = await getStatesByRegionFast(region);
    
    // Filter centers to only include those from this specific region
    const regionCenters = await getCentersByRegion(region);
    console.log(`Found ${regionCenters.length} centers for region "${region}"`);
    
    states = regionStates;
    statesByRegion[region] = states;
    
    // Calculate totals
    totalCenters = states.reduce((sum, state) => sum + state.centerCount, 0);
    totalDistricts = states.reduce((sum, state) => sum + state.districtCount, 0);
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-neutral-500 hover:text-primary">
              Home
            </Link>
          </li>
          <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <span className="font-medium text-primary">
              {region}
            </span>
          </li>
        </ol>
      </nav>
      
      <h1 className="text-3xl font-bold mb-4 spiritual-text-gradient">{region} Centers</h1>
      
      {/* Statistics summary for the region */}
      <div className="bg-light rounded-lg shadow-md p-4 mb-6 border border-neutral-200">
        <h3 className="text-xl mb-3 font-bold spiritual-text-gradient">Centers Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-spirit-purple-50 p-3 rounded-lg border border-spirit-purple-100">
            <div className="text-primary text-2xl font-bold">{totalCenters}</div>
            <div className="text-neutral-600 text-sm">Total Centers</div>
          </div>
          <div className="bg-spirit-blue-50 p-3 rounded-lg border border-spirit-blue-100">
            <div className="text-secondary text-2xl font-bold">
              {region === 'INDIA' ? Object.keys(statesByRegion).reduce((sum, r) => sum + statesByRegion[r].length, 0) : states.length}
            </div>
            <div className="text-neutral-600 text-sm">States & UT</div>
          </div>
          <div className="bg-spirit-gold-50 p-3 rounded-lg border border-spirit-gold-100">
            <div className="text-accent text-2xl font-bold">{totalDistricts}</div>
            <div className="text-neutral-600 text-sm">Districts</div>
          </div>
        </div>
      </div>
      
      {/* Show states grouped by region if region is INDIA */}
      {region === 'INDIA' ? (
        // Display regions with their states
        Object.keys(statesByRegion)
          .filter(regionName => statesByRegion[regionName].length > 0)
          .sort()
          .map(regionName => (
            <div key={regionName} className="mb-10">
              <h2 className="text-2xl font-semibold mb-4 text-spirit-blue-700">
                <Link href={formatCenterUrl(regionName)} className="hover:underline">
                  {regionName}
                </Link>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {statesByRegion[regionName].map(state => (
                  <Link
                    key={state.name}
                    href={formatCenterUrl(regionName, state.name)}
                    className="bg-light p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-neutral-200 block"
                  >
                    <h3 className="text-xl font-semibold mb-2 text-spirit-purple-700">{state.name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">
                        {state.centerCount} {state.centerCount === 1 ? 'center' : 'centers'}
                      </span>
                      <span className="text-primary font-medium">View →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
      ) : (
        // For specific regions, show the states directly
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {states.map(state => (
            <Link
              key={state.name}
              href={formatCenterUrl(region, state.name)}
              className="bg-light p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-neutral-200 block"
            >
              <h2 className="text-xl font-semibold mb-2 text-spirit-purple-700">{state.name}</h2>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">
                  {state.centerCount} {state.centerCount === 1 ? 'center' : 'centers'}
                </span>
                <span className="text-primary font-medium">View →</span>
              </div>
            </Link>
          ))}
          
          {states.length === 0 && (
            <div className="col-span-full bg-light p-8 rounded-lg shadow-md text-center border border-neutral-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold mb-4 text-neutral-700">No States Found</h2>
              <p className="text-neutral-600 mb-6">
                We couldn't find any states in {region}.
              </p>
              
              <Link href="/" className="btn-primary">
                Explore All Centers
              </Link>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 pt-6 border-t border-neutral-200">
        <Link href="/" className="text-primary hover:underline inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
} 