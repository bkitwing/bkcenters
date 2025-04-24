'use client';

import { useState, useEffect } from 'react';

// Create global state to track loading status across components
let globalIsLoaded = false;
let globalLoadAttempted = false;
let globalLoadError: Error | undefined;
let globalLoadPromise: Promise<void> | null = null;

interface UseGoogleMapsResult {
  isLoaded: boolean;
  loadError: Error | undefined;
  hasValidKey: boolean;
}

// Function to load Google Maps API just once
const loadGoogleMapsApi = (): Promise<void> => {
  // Return existing promise if already loading
  if (globalLoadPromise) return globalLoadPromise;
  
  console.log('Starting to load Google Maps API');
  
  globalLoadPromise = new Promise((resolve, reject) => {
    // Skip if we're not in a browser
    if (typeof window === 'undefined') {
      return resolve();
    }
    
    // Check if already loaded
    if (window.google?.maps) {
      console.log('Google Maps already loaded');
      globalIsLoaded = true;
      return resolve();
    }
    
    // Check if API key exists
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.warn('Google Maps API key is missing or empty');
      reject(new Error('Google Maps API key is missing'));
      return;
    }
    
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
        globalLoadError = error;
        reject(error);
      };
      
      // Add onload handling
      scriptElement.onload = () => {
        console.log('Google Maps loaded successfully');
        globalIsLoaded = true;
        resolve();
      };
      
      document.head.appendChild(scriptElement);
    } else {
      // Script tag exists, check if already loaded
      if (window.google?.maps) {
        console.log('Google Maps already loaded (script exists)');
        globalIsLoaded = true;
        resolve();
      } else {
        // Wait for the existing script to load
        console.log('Waiting for existing Google Maps script to load');
        const existingOnLoad = scriptElement.onload;
        scriptElement.onload = (e) => {
          if (existingOnLoad && typeof existingOnLoad === 'function') {
            existingOnLoad.call(scriptElement, e);
          }
          console.log('Google Maps loaded via existing script');
          globalIsLoaded = true;
          resolve();
        };
        
        const existingOnError = scriptElement.onerror;
        scriptElement.onerror = (e) => {
          if (existingOnError && typeof existingOnError === 'function') {
            existingOnError.call(scriptElement, e);
          }
          const error = new Error('Failed to load Google Maps API from existing script');
          globalLoadError = error;
          reject(error);
        };
      }
    }
  });
  
  // Clear promise reference on error so we can try again
  globalLoadPromise.catch(() => {
    globalLoadPromise = null;
  });
  
  return globalLoadPromise;
};

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

    // Load Google Maps API
    let isMounted = true;
    loadGoogleMapsApi()
      .then(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        if (isMounted) {
          setLoadError(error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { isLoaded, loadError, hasValidKey };
} 