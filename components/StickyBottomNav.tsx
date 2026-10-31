'use client';

import React, { useState, useEffect } from 'react';
import { Center } from '@/lib/types';
import ShareCenter from '@/components/ShareCenter';
import CallNowButton from '@/components/CallNowButton';
import { callableNumbers, directionsUrl } from '@/lib/phone';

interface StickyBottomNavProps {
  center: Center;
  pageUrl: string;
}

export default function StickyBottomNav({ center, pageUrl }: StickyBottomNavProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Appear as soon as the hero's Call / Directions buttons scroll out of view
  // (falls back to the whole #info section on pages without them)
  useEffect(() => {
    const handleScroll = () => {
      const anchor =
        document.querySelector('[data-center-actions]') || document.getElementById('info');
      if (anchor) {
        setIsVisible(anchor.getBoundingClientRect().bottom <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatAddress = () => {
    const { line1, line2, line3, city, pincode } = center.address || {};
    const parts: string[] = [];
    if (line1) parts.push(line1);
    if (line2) parts.push(line2);
    if (line3) parts.push(line3);
    if (city) parts.push(city);
    if (pincode) parts.push(pincode);
    if (center.state) parts.push(center.state);
    if (center.region) parts.push(center.region);
    return parts.join(', ');
  };

  const getGoogleMapsUrl = () => directionsUrl(center?.coords, formatAddress());

  const hasNavigation = !!(center?.coords || formatAddress());
  const hasContact = callableNumbers(center.mobile, center.contact, center.region).length > 0;

  if (!isVisible || (!hasNavigation && !hasContact)) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="border-t border-spirit-purple-200 dark:border-neutral-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex">
          {hasNavigation && (
            <a
              href={getGoogleMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center py-3.5 px-3 bg-gradient-to-r from-spirit-purple-600 to-spirit-purple-700 dark:from-spirit-purple-700 dark:to-spirit-purple-800 text-white font-semibold transition-all duration-200 hover:from-spirit-purple-700 hover:to-spirit-purple-800 active:scale-95"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Directions</span>
            </a>
          )}

          {hasContact && (
            <CallNowButton
              mobile={center.mobile}
              contact={center.contact}
              region={center.region}
              center={{ name: center.name, state: center.state, district: center.district }}
              className="flex-1 flex items-center justify-center py-3.5 px-3 bg-gradient-to-r from-spirit-gold-500 to-spirit-gold-600 dark:from-spirit-gold-600 dark:to-spirit-gold-700 text-white font-semibold transition-all duration-200 hover:from-spirit-gold-600 hover:to-spirit-gold-700 active:scale-95"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Call Now</span>
            </CallNowButton>
          )}

          <ShareCenter center={center} pageUrl={pageUrl} variant="bar" />
        </div>
      </div>
    </div>
  );
}
