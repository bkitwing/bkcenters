import React from 'react';
import Link from 'next/link';
import { 
  getDistrictsByState, 
  getCentersByState, 
  getRegionForState, 
  getRegionBySlug,
  getStateBySlug
} from '@/lib/centerData';
import { Metadata } from 'next';
import { formatCenterUrl } from '@/lib/urlUtils';
import StatePageClient from './StatePageClient';

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
    title: `${actualState} - Rajyog Meditation Centers - ${actualRegion}`,
    description: `Find Brahma Kumaris Rajyog meditation centers in ${actualState}, ${actualRegion}. View locations, contact information, and more.`,
    keywords: `Brahma Kumaris, Rajyog Meditation Centers, ${actualState}, ${actualRegion}, spiritual centers, 7 day courses, meditation retreats`,
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
          <Link href="/" className="text-primary">
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
  
  return (
    <StatePageClient 
      actualRegion={actualRegion}
      actualState={actualState}
      stateRegion={stateRegion}
      districts={districts}
      centers={centers}
      districtSummary={districtSummary}
    />
  );
}