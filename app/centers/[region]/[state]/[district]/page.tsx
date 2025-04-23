import React from 'react';
import Link from 'next/link';
import { getCentersByDistrict, getDistrictsByState, getRegionForState } from '@/lib/centerData';
import CenterCard from '@/components/CenterCard';
import CenterMap from '@/components/CenterMap';
import { Metadata } from 'next';

interface DistrictPageProps {
  params: {
    region: string;
    state: string;
    district: string;
  };
}

export async function generateMetadata({ params }: DistrictPageProps): Promise<Metadata> {
  const state = decodeURIComponent(params.state);
  const district = decodeURIComponent(params.district);
  
  // Get all centers in this district to determine the correct region
  const centers = await getCentersByDistrict(state, district);
  const actualRegion = centers.length > 0 ? centers[0].region : decodeURIComponent(params.region);
  
  return {
    title: `${district} Meditation Centers - ${state}, ${actualRegion}`,
    description: `Find Brahma Kumaris meditation centers in ${district}, ${state}. View locations, contact information, and more.`,
    keywords: `Brahma Kumaris, meditation centers, ${district}, ${state}, spiritual centers, India`,
  };
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const urlRegion = decodeURIComponent(params.region);
  const state = decodeURIComponent(params.state);
  const district = decodeURIComponent(params.district);
  
  // Get the actual region for this state from our data
  const actualRegion = await getRegionForState(state);
  
  const centers = await getCentersByDistrict(state, district);
  
  // Check if the URL region matches the actual region
  if (urlRegion !== actualRegion && actualRegion !== 'INDIA') {
    // Redirect to the correct URL
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl mb-4">Redirecting to correct region...</h1>
        <p>The state {state} belongs to region {actualRegion}, not {urlRegion}.</p>
        <p className="mt-4">
          <Link href={`/centers/${encodeURIComponent(actualRegion)}/${encodeURIComponent(state)}/${encodeURIComponent(district)}`} className="text-primary">
            Click here if you are not redirected automatically.
          </Link>
        </p>
        <script dangerouslySetInnerHTML={{ __html: `window.location.href = "/centers/${encodeURIComponent(actualRegion)}/${encodeURIComponent(state)}/${encodeURIComponent(district)}";` }} />
      </div>
    );
  }
  
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
            <Link href={`/centers/${encodeURIComponent(actualRegion)}`} className="text-neutral-500 hover:text-primary">
              {actualRegion}
            </Link>
          </li>
          <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href={`/centers/${encodeURIComponent(actualRegion)}/${encodeURIComponent(state)}`} className="text-neutral-500 hover:text-primary">
              {state}
            </Link>
          </li>
          <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <span className="font-medium text-primary">
              {district}
            </span>
          </li>
        </ol>
      </nav>
      
      <h1 className="text-3xl font-bold mb-2 text-spirit-purple-700">{district} Centers</h1>
      <p className="text-neutral-600 mb-6">
        {centers.length} Brahma Kumaris meditation {centers.length === 1 ? 'center' : 'centers'} in {district}, {state}
      </p>
      
      {centers.length > 0 && (
        <div className="mb-10">
          <div className="h-[400px] border border-neutral-200 rounded-lg overflow-hidden shadow-md mb-8">
            <CenterMap centers={centers} autoZoom={true} />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {centers.map((center) => (
              <Link
                key={center.branch_code}
                href={`/centers/${encodeURIComponent(actualRegion)}/${encodeURIComponent(state)}/${encodeURIComponent(district)}/${encodeURIComponent(center.branch_code)}`}
                className="block"
              >
                <CenterCard center={center} />
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {centers.length === 0 && (
        <div className="bg-light p-8 rounded-lg shadow-md text-center border border-neutral-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold mb-4 text-neutral-700">No Centers Found</h2>
          <p className="text-neutral-600 mb-6">
            We couldn't find any meditation centers in {district}, {state}.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={`/centers/${encodeURIComponent(actualRegion)}/${encodeURIComponent(state)}`} className="btn-primary">
              View Other Districts in {state}
            </Link>
            <Link href="/centers" className="btn-secondary">
              Explore All Centers
            </Link>
          </div>
        </div>
      )}
      
      <div className="mt-8 pt-6 border-t border-neutral-200">
        <Link href={`/centers/${encodeURIComponent(actualRegion)}/${encodeURIComponent(state)}`} className="text-primary hover:underline inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {state} Districts
        </Link>
      </div>
    </div>
  );
} 