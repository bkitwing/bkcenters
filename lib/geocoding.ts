'use client';

import { Center } from './types';

// Function to check if a center has valid coordinates
export function hasValidCoordinates(center: Center): boolean {
  const isValid = Boolean(
    center?.coords && 
    Array.isArray(center.coords) &&
    center.coords.length === 2 &&
    center.coords[0] !== null &&
    center.coords[1] !== null &&
    !isNaN(parseFloat(center.coords[0])) &&
    !isNaN(parseFloat(center.coords[1])) &&
    parseFloat(center.coords[0]) >= -90 && 
    parseFloat(center.coords[0]) <= 90 &&
    parseFloat(center.coords[1]) >= -180 && 
    parseFloat(center.coords[1]) <= 180
  );
  
  if (!isValid && center?.coords) {
    console.warn(`Invalid coordinates detected for ${center.name || 'Unknown Center'}:`, center.coords);
    if (center.coords[0] === null || center.coords[1] === null) {
      console.warn('Coordinates contain null values');
    } else if (!Array.isArray(center.coords)) {
      console.warn('Coordinates are not in array format');
    } else if (center.coords.length !== 2) {
      console.warn('Coordinates array does not have exactly 2 values');
    } else if (isNaN(parseFloat(center.coords[0])) || isNaN(parseFloat(center.coords[1]))) {
      console.warn('Coordinates contain non-numeric values');
    } else {
      const lat = parseFloat(center.coords[0]);
      const lng = parseFloat(center.coords[1]);
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn('Coordinates are outside valid range');
      }
    }
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