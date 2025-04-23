'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Center } from '@/lib/types';

interface CenterCardProps {
  center: Center;
  distance?: number;
  showDistance?: boolean;
}

const CenterCard: React.FC<CenterCardProps> = ({ 
  center, 
  distance, 
  showDistance = false 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  
  const formatAddress = (center: Center) => {
    const { line1, line2, line3, city, pincode } = center.address;
    let addressParts = [];
    
    if (line1) addressParts.push(line1);
    if (line2) addressParts.push(line2);
    if (line3) addressParts.push(line3);
    if (city) addressParts.push(city);
    if (pincode) addressParts.push(pincode);
    
    return addressParts.join(', ');
  };
  
  const getGoogleMapsUrl = (center: Center) => {
    if (!center.coords || center.coords.length !== 2) return '';
    
    const [lat, lng] = center.coords;
    const address = encodeURIComponent(formatAddress(center));
    
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${address}`;
  };
  
  const handleShare = async () => {
    const centerName = center.name;
    const centerAddress = formatAddress(center);
    const shareUrl = `${window.location.origin}/centers/${encodeURIComponent(center.state)}/${encodeURIComponent(center.district)}/${encodeURIComponent(center.branch_code)}`;
    
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
  const fullUrl = `/centers/${encodeURIComponent(center.state)}/${encodeURIComponent(center.district)}/${encodeURIComponent(center.branch_code)}`;
  const hasContactInfo = center.contact || center.mobile || center.email;
  
  return (
    <div className="card hover:shadow-md transition-shadow border border-gray-200 p-4 rounded-lg">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold">{center.name}</h3>
          {showDistance && distance && (
            <span className="text-sm text-gray-500">
              {distance.toFixed(1)} km away
            </span>
          )}
        </div>
        {hasContactInfo && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-[#FF7F50] text-sm font-medium hover:underline"
          >
            {expanded ? 'Less info' : 'More info'}
          </button>
        )}
      </div>
      
      <p className="text-gray-600 mt-2 mb-3 text-sm line-clamp-2">
        {formattedAddress}
      </p>
      
      {expanded && (
        <div className="mt-3 space-y-2 text-sm border-t border-gray-100 pt-3">
          {center.contact && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href={`tel:${center.contact.replace(/[^0-9+]/g, '')}`} className="text-[#FF7F50] hover:underline">
                {center.contact}
              </a>
            </div>
          )}
          
          {center.mobile && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <a href={`tel:${center.mobile}`} className="text-[#FF7F50] hover:underline">
                {center.mobile}
              </a>
            </div>
          )}
          
          {center.email && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href={`mailto:${center.email}`} className="text-[#FF7F50] hover:underline">
                {center.email}
              </a>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 flex flex-wrap gap-2">
        <Link 
          href={fullUrl}
          className="bg-[#FF7F50] text-white px-3 py-1.5 rounded-md text-sm hover:opacity-90 transition-opacity flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </Link>
        
        <a 
          href={getGoogleMapsUrl(center)} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-200 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Directions
        </a>
        
        <button
          onClick={handleShare}
          className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-200 transition-colors flex items-center relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
          
          {showShareTooltip && (
            <span className="absolute bottom-full left-0 mb-2 bg-gray-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap">
              Copied to clipboard!
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default CenterCard; 