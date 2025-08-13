'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Google Analytics tracking ID
const GA_TRACKING_ID = 'G-CSYYGVHXN0';

// Google Analytics gtag function and dataLayer
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Initialize Google Analytics
export function initGA() {
  if (typeof window === 'undefined') return;
  
  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Load gtag script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_TRACKING_ID}', {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: true,
      anonymize_ip: true,
      allow_google_signals: true,
      allow_ad_personalization_signals: false
    });
  `;
  document.head.appendChild(script2);

  // Set gtag function globally
  window.gtag = function() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  };
}

// Track page views
export function trackPageView(url: string, title?: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
      page_title: title || document.title,
      page_location: window.location.href
    });
  }
}

// Track custom events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
}

// Track center searches
export function trackCenterSearch(searchTerm: string, resultsCount: number) {
  trackEvent('search', 'center_locator', searchTerm, resultsCount);
}

// Track center views
export function trackCenterView(centerName: string, centerLocation: string) {
  trackEvent('view_center', 'center_locator', `${centerName} - ${centerLocation}`);
}

// Track directions requests
export function trackDirectionsRequest(centerName: string, centerLocation: string) {
  trackEvent('get_directions', 'center_locator', `${centerName} - ${centerLocation}`);
}

// Track contact form submissions
export function trackContactForm(centerName: string, centerLocation: string) {
  trackEvent('contact_center', 'center_locator', `${centerName} - ${centerLocation}`);
}

// Track map interactions
export function trackMapInteraction(action: string, centerName?: string) {
  trackEvent(action, 'map_interaction', centerName);
}

// Track filter usage
export function trackFilterUsage(filterType: string, filterValue: string) {
  trackEvent('use_filter', 'center_locator', `${filterType}: ${filterValue}`);
}

// Track location sharing
export function trackLocationShare(centerName: string, shareMethod: string) {
  trackEvent('share_center', 'center_locator', `${centerName} via ${shareMethod}`);
}

// Main Google Analytics component
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize GA on component mount
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'undefined') {
      initGA();
    }
  }, []);

  useEffect(() => {
    // Track page views on route changes
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      trackPageView(url);
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}

// Enhanced tracking for center locator specific events
export const CenterLocatorAnalytics = {
  // Track when user searches for centers
  searchCenters: (query: string, resultsCount: number, searchType: 'text' | 'location' = 'text') => {
    trackEvent('search_centers', 'user_interaction', `${searchType}: ${query}`, resultsCount);
  },

  // Track when user views a specific center
  viewCenter: (center: { name?: string; state?: string; district?: string; branch_code?: string }) => {
    const centerLabel = `${center.name || 'Unknown'} - ${center.district}, ${center.state}`;
    trackEvent('view_center_details', 'center_interaction', centerLabel);
  },

  // Track when user gets directions to a center
  getDirections: (center: { name?: string; state?: string; district?: string }) => {
    const centerLabel = `${center.name || 'Unknown'} - ${center.district}, ${center.state}`;
    trackEvent('get_directions', 'center_interaction', centerLabel);
  },

  // Track when user contacts a center
  contactCenter: (center: { name?: string; state?: string; district?: string }) => {
    const centerLabel = `${center.name || 'Unknown'} - ${center.district}, ${center.state}`;
    trackEvent('contact_center', 'center_interaction', centerLabel);
  },

  // Track when user shares a center
  shareCenter: (center: { name?: string; state?: string; district?: string }, method: string) => {
    const centerLabel = `${center.name || 'Unknown'} - ${center.district}, ${center.state}`;
    trackEvent('share_center', 'center_interaction', `${centerLabel} via ${method}`);
  },

  // Track map interactions
  mapInteraction: (action: 'zoom_in' | 'zoom_out' | 'pan' | 'marker_click' | 'info_window_open' | 'distance_start_point' | 'distance_measured' | 'distance_mode_on' | 'distance_mode_off', centerName?: string) => {
    trackEvent('map_interaction', 'map_usage', centerName ? `${action} - ${centerName}` : action);
  },

  // Track filter usage
  useFilter: (filterType: 'region' | 'state' | 'district' | 'sort' | 'contact_type' | 'distance', filterValue: string) => {
    trackEvent('use_filter', 'navigation', `${filterType}: ${filterValue}`);
  },

  // Track location permission requests
  locationPermission: (granted: boolean) => {
    trackEvent('location_permission', 'user_interaction', granted ? 'granted' : 'denied');
  },

  // Track retreat center interactions
  retreatInteraction: (action: 'view' | 'contact' | 'directions', centerName: string) => {
    trackEvent('retreat_center', 'retreat_interaction', `${action} - ${centerName}`);
  }
};