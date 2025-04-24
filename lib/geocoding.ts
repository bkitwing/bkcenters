'use client';

import { Center } from './types';

// Function to geocode an address using Google Maps Geocoding API
export async function geocodeAddress(center: Center): Promise<[string, string] | null> {
  // Skip if Google Maps API is not loaded
  if (!window.google?.maps?.Geocoder) {
    console.warn('Google Maps API not loaded, cannot geocode address - waiting for API to load');
    
    // Try again after a short delay if we're still loading
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!window.google?.maps?.Geocoder) {
        console.error('Google Maps API still not loaded after waiting');
        return null;
      }
    } catch (error) {
      console.error('Error during geocoding retry wait:', error);
      return null;
    }
  }

  // Skip if address is missing
  if (!center.address) {
    console.warn(`Center ${center.name} (${center.branch_code}) has no address to geocode`);
    return null;
  }

  try {
    // Format the address as a single string
    const { line1, line2, line3, city, pincode } = center.address;
    const addressParts = [];
    
    if (line1) addressParts.push(line1);
    if (line2) addressParts.push(line2);
    if (line3) addressParts.push(line3);
    if (city) addressParts.push(city);
    if (pincode) addressParts.push(pincode);
    
    // Add state and country for better accuracy
    if (center.state) addressParts.push(center.state);
    if (center.country) addressParts.push(center.country);
    
    const addressString = addressParts.join(', ');
    
    if (!addressString) {
      console.warn(`Center ${center.name} (${center.branch_code}) has empty address components`);
      return null;
    }

    console.log(`Geocoding address for ${center.name}: ${addressString}`);

    // Create a new geocoder instance
    const geocoder = new window.google.maps.Geocoder();
    
    // Return a promise to handle the asynchronous geocoding request
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address: addressString }, (results: any, status: any) => {
        if (status === "OK" && results && results.length > 0) {
          const location = results[0].geometry.location;
          const coords: [string, string] = [
            location.lat().toString(),
            location.lng().toString()
          ];
          console.log(`Successfully geocoded ${center.name}: ${coords[0]}, ${coords[1]}`);
          resolve(coords);
        } else {
          console.warn(`Geocoding failed for address: ${addressString}`, status);
          reject(null);
        }
      });
    });
  } catch (error) {
    console.error('Error during geocoding:', error);
    return null;
  }
}

// Function to check if a center has valid coordinates
export function hasValidCoordinates(center: Center): boolean {
  const isValid = Boolean(
    center.coords && 
    center.coords.length === 2 &&
    !isNaN(parseFloat(center.coords[0])) &&
    !isNaN(parseFloat(center.coords[1]))
  );
  
  if (!isValid && center.coords) {
    console.warn(`Invalid coordinates detected for ${center.name}:`, center.coords);
  }
  
  return isValid;
} 