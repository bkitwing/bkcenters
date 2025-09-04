'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface GlobalStickyBottomNavProps {}

export default function GlobalStickyBottomNav({}: GlobalStickyBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show on center detail pages (pages with 5 path segments like /region/state/district/branchCode)
  const pathSegments = pathname.split('/').filter(segment => segment !== '');
  const isCenterDetailPage = pathSegments.length === 4;

  if (isCenterDetailPage) {
    return null;
  }

  const handleNearbyClick = () => {
    // Navigate to home page and trigger location search
    router.push('/');
    
    // After navigation, trigger the nearby me functionality
    setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            router.push(`/?lat=${latitude}&lng=${longitude}&address=Your Current Location`);
          },
          (error) => {
            console.error('Error getting location:', error);
            // Fallback to just going to home page
            router.push('/');
          }
        );
      } else {
        // Geolocation not supported, just go to home
        router.push('/');
      }
    }, 100);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background with blur effect */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-spirit-purple-200 shadow-lg">
        <div className="flex">
          {/* Nearby Centers Button */}
          <button
            onClick={handleNearbyClick}
            className="flex-1 flex items-center justify-center py-4 px-4 bg-gradient-to-r from-spirit-blue-600 to-spirit-purple-600 text-white font-semibold transition-all duration-200 hover:from-spirit-blue-700 hover:to-spirit-purple-700 active:scale-95"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Nearby Centers</span>
          </button>
        </div>
      </div>
    </div>
  );
}