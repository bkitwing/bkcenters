import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCentersByDistrict, getDistrictsByState, getStatesList } from '@/lib/centerData';
import CenterCard from '@/components/CenterCard';
import CenterMap from '@/components/CenterMap';
import { Metadata } from 'next';

interface DistrictPageProps {
  params: {
    state: string;
    district: string;
  };
}

export async function generateMetadata({ params }: DistrictPageProps): Promise<Metadata> {
  const state = decodeURIComponent(params.state);
  const district = decodeURIComponent(params.district);
  
  return {
    title: `Brahma Kumaris Centers in ${district}, ${state}`,
    description: `Find Brahma Kumaris meditation centers in ${district}, ${state}. View addresses, contact details, and directions.`,
  };
}

export async function generateStaticParams() {
  try {
    const states = await getStatesList();
    const paths = [];
    
    for (const state of states) {
      const districts = await getDistrictsByState(state);
      
      for (const district of districts) {
        paths.push({
          state: state,
          district: district,
        });
      }
    }
    
    return paths;
  } catch (error) {
    console.error('Error generating district params:', error);
    return [];
  }
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const state = decodeURIComponent(params.state);
  const district = decodeURIComponent(params.district);
  
  try {
    const centers = await getCentersByDistrict(state, district);
    
    // Show empty view instead of notFound when no centers
    if (centers.length === 0) {
      return (
        <EmptyDistrictView state={state} district={district} />
      );
    }
    
    // Enhance centers with location descriptions
    const enhancedCenters = centers.map(center => ({
      ...center,
      description: center.address 
        ? `${center.address.line1 || ''}, ${center.address.city || ''}` 
        : 'Address not available'
    }));
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/centers/${encodeURIComponent(state)}`} className="text-[#FF7F50] hover:underline">
            ← Back to {state}
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Brahma Kumaris Centers in {district}
          </h1>
          <p className="text-gray-600">
            {centers.length} meditation {centers.length === 1 ? 'center' : 'centers'} in {district}, {state}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-10">
          <h2 className="text-2xl font-semibold mb-4">Centers Map</h2>
          <div className="h-[400px]">
            <CenterMap 
              centers={enhancedCenters} 
              height="400px"
              autoZoom={true}
            />
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">
            Click on markers to see center details
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {centers.map(center => (
            <CenterCard key={center.branch_code} center={center} />
          ))}
        </div>
        
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">About Brahma Kumaris in {district}</h2>
          <p className="text-gray-700 mb-4">
            Brahma Kumaris offers various services at their centers in {district} including daily meditation
            sessions, spiritual courses, workshops, and personal consultations. All services are provided free of charge.
          </p>
          <p className="text-gray-700">
            Each center is staffed by dedicated practitioners who can guide you on your spiritual journey.
            Newcomers are always welcome to visit and learn about meditation and spiritual knowledge.
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in district page:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg">
          <h1 className="text-xl font-bold text-red-800 mb-3">Error Loading District Data</h1>
          <p className="text-red-700 mb-4">There was an error loading the centers for this district. Please try again later.</p>
          <Link href={`/centers/${encodeURIComponent(state)}`} className="text-[#FF7F50] hover:underline">
            ← Return to {state}
          </Link>
        </div>
      </div>
    );
  }
}

// Helper component for empty district view
function EmptyDistrictView({ state, district }: { state: string, district: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/centers/${encodeURIComponent(state)}`} className="text-[#FF7F50] hover:underline">
          ← Back to {state}
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Brahma Kumaris Centers in {district}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-8 mb-8 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h2 className="text-2xl font-semibold mb-2">No Centers Found</h2>
        <p className="text-gray-600 mb-6">
          We couldn't find any meditation centers in {district}, {state} at this time.
        </p>
        <Link href={`/centers/${encodeURIComponent(state)}`} className="bg-[#FF7F50] text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity inline-flex items-center">
          View Other Districts in {state}
        </Link>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">About Brahma Kumaris</h2>
        <p className="text-gray-700 mb-4">
          Brahma Kumaris is a spiritual organization that offers courses in meditation and spiritual knowledge.
          Our centers are places of spiritual learning and development where anyone can learn to meditate.
        </p>
        <p className="text-gray-700">
          We may not have centers in {district} yet, but you can explore other districts in {state} or
          check back later as our database is regularly updated.
        </p>
      </div>
    </div>
  );
} 