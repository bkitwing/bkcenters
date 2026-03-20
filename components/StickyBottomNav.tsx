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
      const infoSection = document.getElementById('info');
      if (infoSection) {
        const rect = infoSection.getBoundingClientRect();
        // Show sticky nav once the user has scrolled past the info/map section
        setIsVisible(rect.bottom <= 0);
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
      <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm border-t border-spirit-purple-200 dark:border-neutral-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {/* Quick-scroll section links */}
        <div className="flex items-center justify-center gap-1 px-3 pt-2 pb-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
          <a
            href="#guided-meditation"
            onClick={(e) => { e.preventDefault(); document.getElementById('guided-meditation')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-spirit-purple-50 dark:bg-spirit-purple-900/20 text-spirit-purple-700 dark:text-spirit-purple-300 hover:bg-spirit-purple-100 dark:hover:bg-spirit-purple-900/40 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Meditation
          </a>
          <a
            href="#seven-day-course"
            onClick={(e) => { e.preventDefault(); document.getElementById('seven-day-course')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-spirit-gold-50 dark:bg-spirit-gold-900/20 text-spirit-gold-700 dark:text-spirit-gold-300 hover:bg-spirit-gold-100 dark:hover:bg-spirit-gold-900/40 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            7-Day Course
          </a>
          <a
            href="#nearby"
            onClick={(e) => { e.preventDefault(); document.getElementById('nearby')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Nearby
          </a>
        </div>

        {/* Action buttons */}
        <div className="flex">
          {/* Navigation Button */}
          <a
            href={getGoogleMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-spirit-purple-600 to-spirit-purple-700 dark:from-spirit-purple-700 dark:to-spirit-purple-800 text-white font-semibold transition-all duration-200 hover:from-spirit-purple-700 hover:to-spirit-purple-800 active:scale-95"
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
            <span>Directions</span>
          </a>
          
          {/* Call Button */}
          <button
            onClick={handleCallClick}
            className="flex-1 flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-spirit-gold-500 to-spirit-gold-600 dark:from-spirit-gold-600 dark:to-spirit-gold-700 text-white font-semibold transition-all duration-200 hover:from-spirit-gold-600 hover:to-spirit-gold-700 active:scale-95"
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[60] flex items-end" onClick={() => setShowPhoneModal(false)}>
          <div className="bg-white dark:bg-neutral-800 w-full rounded-t-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Select Phone Number</h3>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors text-neutral-500 dark:text-neutral-400"
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
                  className="w-full flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 hover:bg-spirit-purple-50 dark:hover:bg-neutral-600 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-600"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-spirit-purple-100 dark:bg-spirit-purple-900/30 flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-spirit-purple-600 dark:text-spirit-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span className="text-neutral-900 dark:text-neutral-100 font-medium">{phoneNumber}</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setShowPhoneModal(false)}
                className="w-full py-3 text-center text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}