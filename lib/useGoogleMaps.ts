'use client';

import { useState, useEffect } from 'react';

// Create global state to track loading status across components
let globalIsLoaded = false;
let globalLoadAttempted = false;
let globalLoadError: Error | undefined;

interface UseGoogleMapsResult {
  isLoaded: boolean;
  loadError: Error | undefined;
  hasValidKey: boolean;
}

export function useGoogleMaps(): UseGoogleMapsResult {
  const [isLoaded, setIsLoaded] = useState(globalIsLoaded);
  const [loadError, setLoadError] = useState<Error | undefined>(globalLoadError);
  const [hasValidKey, setHasValidKey] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Don't attempt to load if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      globalIsLoaded = true;
      setHasValidKey(true);
      return;
    }

    // Check if a valid Google Maps API key exists
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.warn('Google Maps API key is missing or empty');
      setHasValidKey(false);
      return;
    }
    
    setHasValidKey(true);

    // Skip if we've already attempted to load
    if (globalLoadAttempted) {
      setLoadError(globalLoadError);
      return;
    }

    globalLoadAttempted = true;

    // Load the Google Maps script
    const scriptId = 'google-maps-script';
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement;
    
    // Only create the script if it doesn't exist
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = scriptId;
      scriptElement.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      scriptElement.defer = true;
      scriptElement.async = true;
      
      // Add error handling
      scriptElement.onerror = (e) => {
        console.error('Error loading Google Maps:', e);
        const error = new Error('Failed to load Google Maps API');
        setLoadError(error);
        globalLoadError = error;
        // Do not remove the script tag on error to prevent multiple load attempts
      };

      // Add onload handling
      scriptElement.onload = () => {
        console.log('Google Maps loaded successfully');
        setIsLoaded(true);
        globalIsLoaded = true;
      };

      document.head.appendChild(scriptElement);
    }

    // We don't need to clean up the script in the return function
    // because we want the script to persist across component mounts
  }, []);

  return { isLoaded, loadError, hasValidKey };
} 