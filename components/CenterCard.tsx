'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Center } from '@/lib/types';
import { formatCenterUrl } from '@/lib/urlUtils';

interface CenterCardProps {
  center: Center;
  distance?: number;
  showDistance?: boolean;
  hideViewIcon?: boolean;
}

const CenterCard: React.FC<CenterCardProps> = ({ 
  center, 
  distance, 
  showDistance = false,
  hideViewIcon = false
}) => {
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showViewTooltip, setShowViewTooltip] = useState(false);
  const [showLocationTooltip, setShowLocationTooltip] = useState(false);
  
  const formatAddress = (center: Center) => {
    const { line1, line2, line3, city, pincode } = center.address;
    let addressParts = [];
    
    if (line1) addressParts.push(line1);
    if (line2) addressParts.push(line2);
    if (line3) addressParts.push(line3);
    if (city) addressParts.push(city);
    if (pincode) addressParts.push(pincode);
    if (center.state) addressParts.push(center.state);
    if (center.region) addressParts.push(center.region);
    
    return addressParts.join(', ');
  };
  
  const getGoogleMapsUrl = (center: Center) => {
    const formattedAddress = formatAddress(center);
    
    if (center.coords && center.coords.length === 2) {
      const [lat, lng] = center.coords;
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else {
      // If no coordinates, just use the address
      const address = encodeURIComponent(formattedAddress);
      return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    }
  };
  
  const handleShare = async () => {
    const centerName = center.name;
    const centerAddress = formatAddress(center);
    const shareUrl = `${window.location.origin}/centers${formatCenterUrl(center.region, center.state, center.district, center.name)}`;
    
    const shareData = {
      title: `${centerName} - Brahma Kumaris Meditation Center`,
      text: `Check out this Brahma Kumaris meditation center: ${centerName}, ${centerAddress}`,
      url: shareUrl
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing center:', error);
    }
  };
  
  const formattedAddress = formatAddress(center);
  const hasAddress = formattedAddress.length > 0;
  const fullUrl = formatCenterUrl(center.region, center.state, center.district, center.name);
  
  return (
    <div className="flex flex-col h-full bg-white p-3">
      <div className="mb-2">
        <Link href={fullUrl}>
          <h3 className="text-2xl font-bold spiritual-text-gradient">{center.name}</h3>
        </Link>
        {showDistance && distance && (
          <span className="text-sm font-bold spiritual-text-gradient">
            {distance.toFixed(1)} km away
          </span>
        )}
      </div>
      
      <p className="text-neutral-600 mt-1 mb-2 text-sm line-clamp-2">
        {formattedAddress}
      </p>
      
      <div className="contact-info text-sm flex-grow">
        {center.contact && (
          <div className="flex items-center text-neutral-600 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="flex items-center text-neutral-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a href={`mailto:${center.email}`} className="hover:underline truncate">
              {center.email}
            </a>
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-auto pt-2 border-t border-neutral-100">
        <div className="flex gap-4">
          {/* View Details Icon */}
          <Link 
            href={fullUrl}
            className="relative text-neutral-600 hover:text-spirit-purple-700 transition-colors"
            onMouseEnter={() => setShowViewTooltip(true)}
            onMouseLeave={() => setShowViewTooltip(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {showViewTooltip && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-neutral-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap">
                View Details
              </span>
            )}
          </Link>
          
          {/* Location Icon */}
          {hasAddress && (
            <a
              href={getGoogleMapsUrl(center)}
              target="_blank"
              rel="noopener noreferrer"
              className="relative text-neutral-600 hover:text-spirit-purple-700 transition-colors"
              onMouseEnter={() => setShowLocationTooltip(true)}
              onMouseLeave={() => setShowLocationTooltip(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {showLocationTooltip && (
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-neutral-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap">
                  Get Directions
                </span>
              )}
            </a>
          )}
          
          {/* Share Icon */}
          <button
            onClick={handleShare}
            className="relative text-neutral-600 hover:text-spirit-purple-700 transition-colors"
            onMouseEnter={() => setShowShareTooltip(true)}
            onMouseLeave={() => setShowShareTooltip(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {showShareTooltip && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-neutral-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap">
                {typeof navigator !== 'undefined' && 'share' in navigator ? "Share" : "Copy to Clipboard"}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CenterCard; 