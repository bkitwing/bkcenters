import { Center } from './types';

/**
 * Calculate distance between two sets of coordinates using the Haversine formula
 * @param lat1 First latitude
 * @param lon1 First longitude
 * @param lat2 Second latitude
 * @param lon2 Second longitude
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

/**
 * Calculate distance between two centers
 * @param center1 First center
 * @param center2 Second center
 * @returns Distance in kilometers, or null if either center is missing coordinates
 */
export const calculateCenterDistance = (
  center1: Center,
  center2: Center
): number | null => {
  // Check if both centers have valid coordinates
  if (
    !center1.coords || 
    !center2.coords || 
    !Array.isArray(center1.coords) || 
    !Array.isArray(center2.coords) ||
    center1.coords.length !== 2 ||
    center2.coords.length !== 2
  ) {
    return null;
  }
  
  // Parse coordinates
  const lat1 = parseFloat(center1.coords[0]);
  const lon1 = parseFloat(center1.coords[1]);
  const lat2 = parseFloat(center2.coords[0]);
  const lon2 = parseFloat(center2.coords[1]);
  
  // Validate coordinates
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return null;
  }
  
  return calculateDistance(lat1, lon1, lat2, lon2);
};

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number | null): string => {
  if (distance === null) {
    return 'Unknown distance';
  }
  
  return `${distance.toFixed(1)} km`;
}; 