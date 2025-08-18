'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatCenterUrl } from '@/lib/urlUtils';
import { Center } from '@/lib/types';
import MapSection from '@/components/MapSection';
import ContactLink from '@/components/ContactLink';
import { CenterLocatorAnalytics } from '@/components/GoogleAnalytics';

interface RetreatPageClientProps {
  centers: Center[];
}

export default function RetreatPageClient({ centers }: RetreatPageClientProps) {
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const mapRef = React.useRef<HTMLDivElement>(null);

  // Handle marker click on map
  const handleCenterSelect = (center: Center) => {
    setSelectedCenter(center);
    
    // Track retreat center view from map
    CenterLocatorAnalytics.retreatInteraction('view', center.name || 'Unknown');
    
    // Find and highlight the corresponding card
    const centerElement = document.getElementById(`retreat-center-${center.branch_code}`);
    if (centerElement) {
      // First remove highlight from any previously highlighted cards
      document.querySelectorAll('.highlight-card').forEach(el => {
        el.classList.remove('highlight-card');
      });
      
      // Scroll the card into view
      centerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight class
      centerElement.classList.add('highlight-card');
      
      // Remove highlight after animation
      setTimeout(() => {
        centerElement.classList.remove('highlight-card');
      }, 1500);
    }
  };

  // Handle card click to highlight marker
  const handleCardClick = (center: Center) => {
    setSelectedCenter(center);
    
    // Track retreat center view from card click
    CenterLocatorAnalytics.retreatInteraction('view', center.name || 'Unknown');
    
    // If on mobile, scroll map into view
    if (window.innerWidth < 768 && mapRef.current) {
      mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Share functionality
  const handleShare = async (center: Center) => {
    const centerUrl = window.location.origin + '/centers' + formatCenterUrl(center.region, center.state, center.district, center.name);
    
    // Track retreat center share
    CenterLocatorAnalytics.retreatInteraction('contact', center.name || 'Unknown');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: center.name,
          text: `Check out ${center.name} - Brahma Kumaris Retreat Center`,
          url: centerUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(centerUrl);
        // You might want to show a toast notification here
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };
  
  // Handle directions click
  const handleDirectionsClick = (center: Center) => {
    // Track retreat center directions
    CenterLocatorAnalytics.retreatInteraction('directions', center.name || 'Unknown');
  };

  return (
    <div>
      {/* Map Section - Focus on India */}
      <div className="mb-10">
        <div ref={mapRef} className="h-[500px] border border-neutral-200 rounded-lg overflow-hidden shadow-md mb-8">
          <MapSection 
            centers={centers}
            selectedCenter={selectedCenter}
            onCenterSelect={handleCenterSelect}
          />
        </div>
        
        {/* Centers Grid - Sorted by specified order */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centers.map((center) => (
            <div 
              key={center.branch_code} 
              id={`retreat-center-${center.branch_code}`}
              className="card hover:shadow-md transition-shadow border border-neutral-200 p-4 rounded-lg h-full flex flex-col"
              onClick={() => handleCardClick(center)}
            >
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
                            <ContactLink 
                              href={`tel:${cleanNumber}`} 
                              className="hover:underline"
                              center={center}
                              analyticsType="retreat"
                            >
                              {cleanNumber}
                            </ContactLink>
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
                    <ContactLink 
                       href={`mailto:${center.email}`} 
                       className="hover:underline truncate"
                       center={center}
                       analyticsType="retreat"
                     >
                       {center.email}
                     </ContactLink>
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
                    onClick={() => handleDirectionsClick(center)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </a>

                  {/* Share Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(center);
                    }}
                    className="text-neutral-600 hover:text-spirit-purple-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
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
  if (center.state) addressParts.push(center.state);
  if (center.region) addressParts.push(center.region);
  
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