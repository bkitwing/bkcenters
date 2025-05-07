import React from 'react';
import Link from 'next/link';
import { getRetreatCenters } from '@/lib/centerData';
import { Metadata } from 'next';
import { formatCenterUrl } from '@/lib/urlUtils';
import { Center } from '@/lib/types';
import MapSection from '@/components/MapSection';

export const metadata: Metadata = {
  title: 'Retreat Centers - Brahma Kumaris',
  description: 'Find and explore Brahma Kumaris retreat centers across India. View locations, contact information, and more.',
  keywords: 'Brahma Kumaris, retreat centers, spiritual retreats, meditation retreats, India',
};

export default async function RetreatCentersPage() {
  // Get all retreat centers
  const retreatCenters = await getRetreatCenters();
  
  // Get the order of branch codes from centerData.ts for sorting
  const orderFromFunction = ['90001','90007','90006','04543','01758','04195','03793','03724','03180','02755','02417','02284','01758','00858','00510','00386','00346','00182'];
  
  // Sort centers according to the order in retreatCenterBranchCodes
  const sortedCenters = [...retreatCenters].sort((a, b) => {
    const indexA = orderFromFunction.indexOf(a.branch_code);
    const indexB = orderFromFunction.indexOf(b.branch_code);
    return indexA - indexB;
  });
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
              Retreat Centers
            </span>
          </li>
        </ol>
      </nav>
      
      <h1 className="text-3xl font-bold spiritual-text-gradient mb-2">Brahma Kumaris Retreat Centers</h1>
      <p className="text-sm text-neutral-600 mb-6">
        {retreatCenters.length} dedicated retreat {retreatCenters.length === 1 ? 'center' : 'centers'} across India for spiritual renewal and meditation practice
      </p>
      
      {retreatCenters.length > 0 ? (
        <div>
          {/* Map Section - Focus on India */}
          <div className="mb-10">
            <div className="h-[500px] border border-neutral-200 rounded-lg overflow-hidden shadow-md mb-8">
              <MapSection 
                centers={sortedCenters} 
              />
            </div>
            
            {/* Centers Grid - Sorted by specified order */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCenters.map((center) => (
                <div key={center.branch_code} className="card hover:shadow-md transition-shadow border border-neutral-200 p-4 rounded-lg h-full flex flex-col">
                  <div className="mb-2">
                    <Link href={formatCenterUrl(center.region, center.state, center.district, center.name)}>
                      <h3 className="text-2xl font-bold mb-4 spiritual-text-gradient">{center.name}</h3>
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1 text-sm">
                      <Link 
                        href={formatCenterUrl(center.region, center.state, center.district)} 
                        className="bg-spirit-purple-50 text-spirit-purple-700 px-2 py-0.5 rounded-full hover:bg-spirit-purple-100"
                      >
                        {center.district}
                      </Link>
                      <span className="text-neutral-400">in</span>
                      <Link 
                        href={formatCenterUrl(center.region, center.state)} 
                        className="bg-spirit-blue-50 text-spirit-blue-700 px-2 py-0.5 rounded-full hover:bg-spirit-blue-100"
                      >
                        {center.state}
                      </Link>
                    </div>
                  </div>
                  
                  <p className="text-neutral-600 mt-2 mb-3 text-sm line-clamp-2">
                    {center.address && formatAddress(center)}
                  </p>
                  
                  <div className="contact-info text-sm flex-grow">
                    {center.contact && (
                      <div className="flex items-center text-neutral-600 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div>
                          {center.contact.split(',').map((number, index) => {
                            const cleanNumber = number.trim().replace(/[^0-9+]/g, '');
                            return (
                              <span key={index}>
                                <a href={`tel:${cleanNumber}`} className="hover:underline">
                                  {number.trim()}
                                </a>
                                {index < center.contact.split(',').length - 1 && <span className="mx-1">,</span>}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {center.mobile && (
                      <div className="flex items-center text-neutral-600 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div>
                          {center.mobile.split(',').map((number, index) => {
                            const cleanNumber = number.trim();
                            return (
                              <span key={index}>
                                <a href={`tel:${cleanNumber}`} className="hover:underline">
                                  {cleanNumber}
                                </a>
                                {index < center.mobile.split(',').length - 1 && <span className="mx-1">,</span>}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {center.email && (
                      <div className="flex items-center text-neutral-600 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${center.email}`} className="hover:underline truncate">
                          {center.email}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-5 flex justify-between mt-auto pt-3 border-t border-neutral-100">
                    <div className="flex gap-4">
                      {/* View Details Icon */}
                      <Link 
                        href={formatCenterUrl(center.region, center.state, center.district, center.name)}
                        className="text-neutral-600 hover:text-spirit-purple-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      
                      {/* Location Icon */}
                      <a
                        href={getGoogleMapsUrl(center)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-600 hover:text-spirit-purple-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-light p-8 rounded-lg shadow-md text-center border border-neutral-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold mb-4 text-neutral-700">No Retreat Centers Found</h2>
          <p className="text-neutral-600 mb-6">
            Please add your retreat center branch codes to the getRetreatCenters function.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/" className="btn-primary">
              View All Centers
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function formatAddress(center: Center) {
  if (!center.address) return 'Address not available';
  
  const { line1, line2, line3, city, pincode } = center.address;
  let addressParts = [];
  
  if (line1) addressParts.push(line1);
  if (line2) addressParts.push(line2);
  if (line3) addressParts.push(line3);
  if (city) addressParts.push(city);
  if (pincode) addressParts.push(pincode);
  
  return addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
}

function getGoogleMapsUrl(center: Center) {
  const formattedAddress = formatAddress(center);
  
  if (center.coords && center.coords.length === 2) {
    const [lat, lng] = center.coords;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  } else {
    // If no coordinates, just use the address
    const address = encodeURIComponent(formattedAddress);
    return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
  }
} 