'use client';

import React, { useState, useEffect } from 'react';
import { Center } from '@/lib/types';

interface StickyBottomNavProps {
  center: Center;
}

export default function StickyBottomNav({ center }: StickyBottomNavProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const nearbyCentersSection = document.getElementById('nearby-centers-content');
      if (nearbyCentersSection) {
        const rect = nearbyCentersSection.getBoundingClientRect();
        // Show sticky nav when nearby centers section is in view or passed
        setIsVisible(rect.top <= window.innerHeight);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get all available phone numbers
  const getAllPhoneNumbers = () => {
    const numbers = [];
    if (center.mobile) {
      const mobileNums = center.mobile.split(',').map(num => num.trim());
      numbers.push(...mobileNums);
    }
    if (center.contact) {
      const contactNums = center.contact.split(',').map(num => num.trim());
      numbers.push(...contactNums);
    }
    
    // Remove duplicates and filter valid numbers
    const uniqueNumbers = Array.from(new Set(numbers))
      .filter(num => {
        const cleanNum = num.replace(/\D/g, '');
        return cleanNum.length >= 10;
      });
    
    return uniqueNumbers;
  };

  // Extract 10-digit mobile number (for backward compatibility)
  const getMobileNumber = () => {
    const allNumbers = getAllPhoneNumbers();
    
    // Find 10-digit number
    for (const num of allNumbers) {
      const cleanNum = num.replace(/\D/g, ''); // Remove non-digits
      if (cleanNum.length === 10) {
        return cleanNum;
      }
    }
    
    // Fallback to first available number
    return allNumbers[0]?.replace(/\D/g, '') || '';
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const allNumbers = getAllPhoneNumbers();
    
    if (allNumbers.length > 1) {
      setShowPhoneModal(true);
    } else if (allNumbers.length === 1) {
      const cleanNum = allNumbers[0].replace(/\D/g, '');
      window.location.href = `tel:+91${cleanNum}`;
    }
  };

  const handlePhoneSelect = (phoneNumber: string) => {
    const cleanNum = phoneNumber.replace(/\D/g, '');
    window.location.href = `tel:+91${cleanNum}`;
    setShowPhoneModal(false);
  };

  const formatAddress = () => {
    const { line1, line2, line3, city, pincode } = center.address || {};
    let parts = [];
    
    if (line1) parts.push(line1);
    if (line2) parts.push(line2);
    if (line3) parts.push(line3);
    if (city) parts.push(city);
    if (pincode) parts.push(pincode);
    if (center.state) parts.push(center.state);
    if (center.region) parts.push(center.region);
    
    return parts.join(', ');
  };

  const getGoogleMapsUrl = () => {
    if (center?.coords && Array.isArray(center.coords) && center.coords.length === 2) {
      const [lat, lng] = center.coords;
      const address = encodeURIComponent(formatAddress());
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${address}`;
    } else {
      const address = encodeURIComponent(formatAddress());
      return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    }
  };

  const mobileNumber = getMobileNumber();
  const hasNavigation = center?.coords || formatAddress();
  const hasContact = mobileNumber;

  if (!isVisible || !hasNavigation || !hasContact) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background with blur effect */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-spirit-purple-200 shadow-lg">
        <div className="flex">
          {/* Navigation Button */}
          <a
            href={getGoogleMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center py-4 px-4 bg-gradient-to-r from-spirit-blue-600 to-spirit-purple-600 text-white font-semibold transition-all duration-200 hover:from-spirit-blue-700 hover:to-spirit-purple-700 active:scale-95"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Get Directions</span>
          </a>
          
          {/* Call Button */}
          <button
            onClick={handleCallClick}
            className="flex-1 flex items-center justify-center py-4 px-4 bg-gradient-to-r from-spirit-purple-600 to-spirit-blue-600 text-white font-semibold transition-all duration-200 hover:from-spirit-purple-700 hover:to-spirit-blue-700 active:scale-95"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Call Now</span>
          </button>
        </div>
      </div>

      {/* Phone Selection Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Phone Number</h3>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {getAllPhoneNumbers().map((phoneNumber, index) => (
                <button
                  key={index}
                  onClick={() => handlePhoneSelect(phoneNumber)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-spirit-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-900 font-medium">{phoneNumber}</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}