'use client';

import { Center } from './types';

// Function to check if a center has valid coordinates
export function hasValidCoordinates(center: Center): boolean {
  const isValid = Boolean(
    center?.coords && 
    Array.isArray(center.coords) &&
    center.coords.length === 2 &&
    !isNaN(parseFloat(center.coords[0])) &&
    !isNaN(parseFloat(center.coords[1]))
  );
  
  if (!isValid && center?.coords) {
    console.warn(`Invalid coordinates detected for ${center.name}:`, center.coords);
  }
  
  return isValid;
}

// Stub for geocodeAddress - no longer needed since we do server-side geocoding
// Keep the function signature for backward compatibility in case there are references
export async function geocodeAddress(center: Center): Promise<[string, string] | null> {
  console.warn('Client-side geocoding has been disabled - coordinates should be provided by server-side processing');
  return null;
}

// Stub for geocodeState - no longer needed
export async function geocodeState(stateName: string, country: string = 'India'): Promise<[string, string] | null> {
  console.warn('Client-side state geocoding has been disabled - coordinates should be provided by server-side processing');
  return null;
} 