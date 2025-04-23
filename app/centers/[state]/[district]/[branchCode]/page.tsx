import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCenterByCode, getCentersByDistrict, getDistrictsByState, getStatesList } from '@/lib/centerData';
import CenterMap from '@/components/CenterMap';
import { Metadata } from 'next';

interface CenterPageProps {
  params: {
    state: string;
    district: string;
    branchCode: string;
  };
}

export async function generateMetadata({ params }: CenterPageProps): Promise<Metadata> {
  try {
    const center = await getCenterByCode(params.branchCode);
    
    if (!center) {
      return {
        title: 'Center Not Found',
        description: 'The meditation center you are looking for could not be found.',
      };
    }
    
    const address = center.address ? 
      `${center.address.line1 || ''}, ${center.address.city || ''}, ${center.address.pincode || ''}` : 
      'Address not available';
    
    return {
      title: `${center.name} - Brahma Kumaris Meditation Center`,
      description: `Visit the Brahma Kumaris meditation center at ${address}. Contact information, directions, and more.`,
      keywords: `Brahma Kumaris, meditation, ${center.name}, ${center.address?.city || ''}, ${center.state}, spiritual center`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Brahma Kumaris Meditation Center',
      description: 'Find a Brahma Kumaris meditation center near you.',
    };
  }
}

export async function generateStaticParams() {
  try {
    const states = await getStatesList();
    const paths = [];
    
    // Limit the number of centers we pre-generate to avoid build timeouts
    const MAX_CENTERS_PER_DISTRICT = 10;
    
    for (const state of states) {
      const districts = await getDistrictsByState(state);
      
      for (const district of districts) {
        const centers = await getCentersByDistrict(state, district);
        
        // Only pre-generate a limited number of centers per district
        const limitedCenters = centers.slice(0, MAX_CENTERS_PER_DISTRICT);
        
        for (const center of limitedCenters) {
          paths.push({
            state: state,
            district: district,
            branchCode: center.branch_code,
          });
        }
      }
    }
    
    return paths;
  } catch (error) {
    console.error('Error generating center params:', error);
    return [];
  }
}

export default async function CenterPage({ params }: CenterPageProps) {
  const state = decodeURIComponent(params.state);
  const district = decodeURIComponent(params.district);
  const branchCode = decodeURIComponent(params.branchCode);

  try {
    const center = await getCenterByCode(branchCode);
    
    // Show empty view instead of notFound when center not found
    if (!center) {
      return (
        <EmptyCenterView state={state} district={district} branchCode={branchCode} />
      );
    }
    
    const formatAddress = () => {
      const { line1, line2, line3, city, pincode } = center.address || {};
      let parts = [];
      
      if (line1) parts.push(line1);
      if (line2) parts.push(line2);
      if (line3) parts.push(line3);
      if (city) parts.push(city);
      if (pincode) parts.push(pincode);
      
      return parts.join(', ');
    };
    
    const getGoogleMapsUrl = () => {
      if (!center.coords || center.coords.length !== 2) return '';
      
      const [lat, lng] = center.coords;
      const address = encodeURIComponent(formatAddress());
      
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${address}`;
    };
    
    const hasMobileOrContact = center.mobile || center.contact;

    // Prepare center with highlighted flag for map
    const centerForMap = {
      ...center,
      is_highlighted: true,
      description: formatAddress()
    };
    
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex mb-6 text-sm">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/centers" className="text-gray-500 hover:text-[#FF7F50]">
                Centers
              </Link>
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <Link href={`/centers/${encodeURIComponent(center.state)}`} className="text-gray-500 hover:text-[#FF7F50]">
                {center.state}
              </Link>
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <Link href={`/centers/${encodeURIComponent(center.state)}/${encodeURIComponent(center.district)}`} className="text-gray-500 hover:text-[#FF7F50]">
                {center.district}
              </Link>
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <span className="font-medium text-[#FF7F50]">
                {center.name}
              </span>
            </li>
          </ol>
        </nav>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-2">{center.name}</h1>
            <p className="text-gray-600 text-lg">
              Brahma Kumaris Meditation Center
            </p>
            
            <div className="mt-6 grid md:grid-cols-2 gap-8">
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Address</h2>
                  <p className="text-gray-700">{formatAddress()}</p>
                </div>
                
                {hasMobileOrContact && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">Contact</h2>
                    
                    {center.contact && (
                      <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${center.contact.replace(/[^0-9+]/g, '')}`} className="text-[#FF7F50] hover:underline">
                          {center.contact}
                        </a>
                      </div>
                    )}
                    
                    {center.mobile && (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <a href={`tel:${center.mobile}`} className="text-[#FF7F50] hover:underline">
                          {center.mobile}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {center.email && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">Email</h2>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${center.email}`} className="text-[#FF7F50] hover:underline">
                        {center.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {center.coords && center.coords.length === 2 && (
                  <div className="mt-8">
                    <a
                      href={getGoogleMapsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#FF7F50] text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity inline-flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Get Directions
                    </a>
                  </div>
                )}
              </div>
              
              <div>
                {center.coords && center.coords.length === 2 ? (
                  <div className="h-[300px] md:h-[400px] lg:h-[450px]">
                    <CenterMap 
                      centers={[centerForMap]} 
                      height="100%" 
                      autoZoom={true}
                      defaultZoom={13}
                      highlightCenter={true}
                      showInfoWindowOnLoad={false}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 h-[300px] md:h-[400px] lg:h-[450px] rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Location coordinates not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">About This Center</h2>
          <p className="text-gray-700 mb-4">
            This Brahma Kumaris meditation center offers a peaceful and welcoming environment for
            spiritual growth and self-development.
          </p>
          <p className="text-gray-700 mb-4">
            Regular activities include meditation classes, spiritual discussions, and courses on 
            positive thinking, stress management, and self-transformation.
          </p>
          <p className="text-gray-700">
            All services are provided free of charge, and newcomers are always welcome to visit and learn
            about the benefits of meditation and spiritual knowledge.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Regular Activities</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="text-lg font-medium mb-2">Morning Meditation</h3>
              <p className="text-gray-600">Daily 6:00 AM - 7:00 AM</p>
            </div>
            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="text-lg font-medium mb-2">Evening Meditation</h3>
              <p className="text-gray-600">Daily 6:30 PM - 7:30 PM</p>
            </div>
            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="text-lg font-medium mb-2">Spiritual Class</h3>
              <p className="text-gray-600">Sundays 10:00 AM - 11:30 AM</p>
            </div>
            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="text-lg font-medium mb-2">Personal Consultation</h3>
              <p className="text-gray-600">By appointment</p>
            </div>
          </div>
          <div className="mt-6 text-center text-gray-600 text-sm">
            <p>* Please call to confirm current timings and activities</p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in center page:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg">
          <h1 className="text-xl font-bold text-red-800 mb-3">Error Loading Center Data</h1>
          <p className="text-red-700 mb-4">There was an error loading the data for this center. Please try again later.</p>
          <Link href="/centers" className="text-[#FF7F50] hover:underline">
            ← Return to Centers
          </Link>
        </div>
      </div>
    );
  }
}

// Helper component for empty center view
function EmptyCenterView({ state, district, branchCode }: { state: string, district: string, branchCode: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/centers" className="text-gray-500 hover:text-[#FF7F50]">
              Centers
            </Link>
          </li>
          <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href={`/centers/${encodeURIComponent(state)}`} className="text-gray-500 hover:text-[#FF7F50]">
              {state}
            </Link>
          </li>
          <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href={`/centers/${encodeURIComponent(state)}/${encodeURIComponent(district)}`} className="text-gray-500 hover:text-[#FF7F50]">
              {district}
            </Link>
          </li>
          <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <span className="font-medium text-[#FF7F50]">
              Center {branchCode}
            </span>
          </li>
        </ol>
      </nav>
      
      <div className="bg-white rounded-lg shadow-md p-8 mb-8 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <h2 className="text-2xl font-semibold mb-2">Center Not Found</h2>
        <p className="text-gray-600 mb-6">
          We couldn't find the meditation center with code {branchCode} in {district}, {state}.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href={`/centers/${encodeURIComponent(state)}/${encodeURIComponent(district)}`} className="bg-[#FF7F50] text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity inline-flex items-center justify-center">
            View All Centers in {district}
          </Link>
          <Link href="/centers" className="border border-[#FF7F50] text-[#FF7F50] py-2 px-4 rounded-md hover:bg-orange-50 transition-colors inline-flex items-center justify-center">
            Browse All States
          </Link>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">About Brahma Kumaris</h2>
        <p className="text-gray-700 mb-4">
          Brahma Kumaris is a spiritual organization that offers courses in meditation and spiritual knowledge.
          Our centers are places of spiritual learning and development where anyone can learn to meditate.
        </p>
        <p className="text-gray-700">
          The center you're looking for may have moved or been temporarily closed. 
          Please check other centers in {district} or contact our main office for more information.
        </p>
      </div>
    </div>
  );
} 