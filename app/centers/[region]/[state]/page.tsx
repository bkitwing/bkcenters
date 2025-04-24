import React from 'react';
import Link from 'next/link';
import { 
  getDistrictsByState, 
  getCentersByState, 
  getRegionForState, 
  getRegionBySlug,
  getStateBySlug
} from '@/lib/centerData';
import CenterMap from '@/components/CenterMap';
import { Metadata } from 'next';
import { Center } from '@/lib/types';
import { formatCenterUrl } from '@/lib/urlUtils';

interface StatePageProps {
  params: {
    region: string;
    state: string;
  };
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const stateSlug = decodeURIComponent(params.state);
  const actualState = await getStateBySlug(stateSlug) || stateSlug;
  
  // Get all centers in this state to determine the correct region
  const centers = await getCentersByState(actualState);
  const actualRegion = centers.length > 0 ? centers[0].region : decodeURIComponent(params.region);
  
  return {
    title: `${actualState} Meditation Centers - ${actualRegion}`,
    description: `Find Brahma Kumaris meditation centers in ${actualState}, ${actualRegion}. View locations, contact information, and more.`,
    keywords: `Brahma Kumaris, meditation centers, ${actualState}, ${actualRegion}, spiritual centers, India`,
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const regionSlug = decodeURIComponent(params.region);
  const stateSlug = decodeURIComponent(params.state);
  
  // Get actual region and state names from slugs
  const actualRegion = await getRegionBySlug(regionSlug) || regionSlug;
  const actualState = await getStateBySlug(stateSlug) || stateSlug;
  
  // Get the actual region for this state from our data
  const stateRegion = await getRegionForState(actualState);
  
  const districts = await getDistrictsByState(actualState);
  const centers = await getCentersByState(actualState);
  
  // Check if the URL region matches the actual region
  if (actualRegion !== stateRegion && stateRegion !== 'INDIA') {
    // Redirect to the correct URL
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl mb-4">Redirecting to correct region...</h1>
        <p>The state {actualState} belongs to region {stateRegion}, not {actualRegion}.</p>
        <p className="mt-4">
          <Link href={formatCenterUrl(stateRegion, actualState)} className="text-primary">
            Click here if you are not redirected automatically.
          </Link>
        </p>
        <script dangerouslySetInnerHTML={{ __html: `window.location.href = "${formatCenterUrl(stateRegion, actualState)}";` }} />
      </div>
    );
  }
  
  // Summarize centers by district
  const districtSummary = districts.map(district => {
    const centersInDistrict = centers.filter(center => center.district === district);
    return {
      district,
      centerCount: centersInDistrict.length,
      // Use the first center's coordinates for the district marker
      coords: centersInDistrict.length > 0 ? centersInDistrict[0].coords : null
    };
  }).sort((a, b) => b.centerCount - a.centerCount); // Sort by number of centers (most first)

  // Prepare district map markers
  const districtMarkers = districtSummary.map(item => {
    if (!item.coords) return null;
    
    // Find a center to use as the base for the marker
    const sampleCenter = centers.find(center => center.district === item.district);
    if (!sampleCenter) return null;
    
    return {
      ...sampleCenter,
      name: item.district,
      description: `${item.centerCount} meditation ${item.centerCount === 1 ? 'center' : 'centers'}`,
      district_total: item.centerCount,
      is_district_summary: true
    };
  }).filter(Boolean) as Center[];
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/centers" className="text-neutral-500 hover:text-primary">
              Centers
            </Link>
          </li>
          <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href={formatCenterUrl(stateRegion)} className="text-neutral-500 hover:text-primary">
              {stateRegion}
            </Link>
          </li>
          <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <span className="font-medium text-primary">
              {actualState}
            </span>
          </li>
        </ol>
      </nav>
      
      <h1 className="text-3xl font-bold mb-2 text-spirit-purple-700">{actualState} Centers</h1>
      <p className="text-neutral-600 mb-6">
        {centers.length} Brahma Kumaris meditation {centers.length === 1 ? 'center' : 'centers'} across {districts.length} {districts.length === 1 ? 'district' : 'districts'} in {actualState}, {stateRegion}
      </p>
      
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="md:col-span-3">
          <div className="bg-light rounded-lg shadow-md border border-neutral-200 overflow-hidden">
            <div className="h-[500px]">
              <CenterMap 
                centers={districtMarkers} 
                isDistrictView={true}
                autoZoom={true} 
              />
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-light rounded-lg shadow-md p-4 border border-neutral-200 h-full">
            <h2 className="text-xl font-semibold mb-4 text-spirit-blue-700">Districts in {actualState}</h2>
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
              {districtSummary.map(item => (
                <Link 
                  key={item.district} 
                  href={formatCenterUrl(stateRegion, actualState, item.district)}
                  className="block p-4 rounded-lg border border-neutral-200 hover:border-primary hover:shadow-md transition-all"
                >
                  <h3 className="text-lg font-medium text-spirit-purple-700">{item.district}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-neutral-600 text-sm">
                      {item.centerCount} {item.centerCount === 1 ? 'center' : 'centers'}
                    </span>
                    <span className="text-primary text-sm font-medium">View →</span>
                  </div>
                </Link>
              ))}

              {districtSummary.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-neutral-500">No districts found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-neutral-200">
        <Link href={formatCenterUrl(stateRegion)} className="text-primary hover:underline inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {stateRegion} States
        </Link>
      </div>
    </div>
  );
} 