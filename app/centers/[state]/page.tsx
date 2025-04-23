import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStateData, getStatesList, getCentersByDistrict } from '@/lib/centerData';
import CenterMap from '@/components/CenterMap';
import { Metadata } from 'next';
import { Center } from '@/lib/types';

interface StatePageProps {
  params: {
    state: string;
  };
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const decodedState = decodeURIComponent(params.state);
  
  return {
    title: `Brahma Kumaris Centers in ${decodedState}`,
    description: `Find Brahma Kumaris meditation centers in ${decodedState}. View all districts with meditation centers.`,
  };
}

export async function generateStaticParams() {
  try {
    const states = await getStatesList();
    
    return states.map((state) => ({
      state: state,
    }));
  } catch (error) {
    console.error('Error generating state params:', error);
    return [];
  }
}

export default async function StatePage({ params }: StatePageProps) {
  const decodedState = decodeURIComponent(params.state);
  
  try {
    const statesList = await getStatesList();
    
    // If no states found, show empty state instead of notFound
    if (!statesList || statesList.length === 0) {
      return (
        <EmptyStateView state={decodedState} />
      );
    }
    
    // Continue even if this state isn't in the list (don't call notFound)
    // This allows us to handle direct URL access gracefully
    const { stateName, districts } = await getStateData(decodedState);
    const totalCenters = districts.reduce((acc, district) => acc + district.centerCount, 0);
    
    // If no districts or centers, show empty state
    if (districts.length === 0) {
      return (
        <EmptyStateView state={decodedState} />
      );
    }
    
    // Get centers for each district to display on map
    const allStateCenters: Center[] = [];
    for (const district of districts) {
      const centers = await getCentersByDistrict(decodedState, district.name);
      allStateCenters.push(...centers);
    }
    
    // Create a single representative center for each district for the map
    const districtCenters = districts.map(district => {
      // Find the first center in this district to use its coordinates
      const districtCenters = allStateCenters.filter(c => c.district === district.name);
      const firstCenter = districtCenters.length > 0 ? districtCenters[0] : null;
      
      if (firstCenter && firstCenter.coords && firstCenter.coords.length === 2) {
        // Create a summary center object for the district
        return {
          ...firstCenter,
          name: `${district.name} District`,
          description: `${district.centerCount} meditation ${district.centerCount === 1 ? 'center' : 'centers'}`,
          summary: `${district.centerCount} ${district.centerCount === 1 ? 'center' : 'centers'} in ${district.name}`,
          district_total: district.centerCount,
          is_district_summary: true
        };
      }
      return null;
    }).filter(Boolean) as Center[];
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/centers" className="text-[#FF7F50] hover:underline">
            ← All States
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{stateName}</h1>
          <p className="text-gray-600">
            {totalCenters} Brahma Kumaris centers across {districts.length} districts
          </p>
        </div>
        
        {/* State Map */}
        {districtCenters.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Districts Map</h2>
            <div className="h-[400px] mb-4">
              <CenterMap 
                centers={districtCenters} 
                height="400px" 
                isDistrictView={true} 
                autoZoom={true}
              />
            </div>
            <p className="text-sm text-gray-500 text-center mt-2">
              Color intensity indicates number of centers in each district. Click on markers for details.
            </p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Districts in {stateName}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {districts.map((district) => (
              <Link
                key={district.name}
                href={`/centers/${encodeURIComponent(stateName)}/${encodeURIComponent(district.name)}`}
                className="flex justify-between items-center p-4 border border-gray-200 rounded-md hover:border-[#FF7F50] hover:shadow-md transition-all"
              >
                <span className="text-lg font-medium">{district.name}</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm">
                  {district.centerCount} {district.centerCount === 1 ? 'center' : 'centers'}
                </span>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">About Brahma Kumaris in {stateName}</h2>
          <p className="text-gray-700 mb-4">
            Brahma Kumaris has established a strong presence in {stateName} with {totalCenters} meditation centers
            spread across {districts.length} districts. These centers offer regular meditation classes, spiritual
            discussions, and various courses on self-development.
          </p>
          <p className="text-gray-700">
            Visit any center near you to experience peace, spiritual wisdom, and learn practical
            meditation techniques that can transform your life.
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in state page:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg">
          <h1 className="text-xl font-bold text-red-800 mb-3">Error Loading State Data</h1>
          <p className="text-red-700 mb-4">There was an error loading the data for this state. Please try again later.</p>
          <Link href="/centers" className="text-[#FF7F50] hover:underline">
            ← Return to Centers
          </Link>
        </div>
      </div>
    );
  }
}

// Helper component for empty state view
function EmptyStateView({ state }: { state: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/centers" className="text-[#FF7F50] hover:underline">
          ← All States
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{state}</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <h2 className="text-2xl font-semibold mb-2">No Centers Found</h2>
        <p className="text-gray-600 mb-6">
          We couldn't find any meditation centers in {state} at this time.
        </p>
        <Link href="/centers" className="bg-[#FF7F50] text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity inline-flex items-center">
          Browse Other States
        </Link>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">About Brahma Kumaris</h2>
        <p className="text-gray-700 mb-4">
          Brahma Kumaris is a spiritual organization that offers courses in meditation and spiritual knowledge.
          Our centers are places of spiritual learning and development where anyone can learn to meditate.
        </p>
        <p className="text-gray-700">
          We may not have centers in {state} yet, but you can explore other states or check back later
          as our database is regularly updated.
        </p>
      </div>
    </div>
  );
} 