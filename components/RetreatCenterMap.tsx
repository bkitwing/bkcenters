'use client';

import { useState, useEffect } from 'react';
import { Center } from '@/lib/types';
import { geocodeAddress, hasValidCoordinates } from '@/lib/geocoding';
import CenterMap from './CenterMap';

interface RetreatCenterMapProps {
  centers: Center[];
  initialLat?: number;
  initialLng?: number;
  defaultZoom?: number;
}

export default function RetreatCenterMap({ 
  centers, 
  initialLat, 
  initialLng, 
  defaultZoom = 5 
}: RetreatCenterMapProps) {
  const [processedCenters, setProcessedCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function processCentersWithGeocode() {
      setIsLoading(true);
      
      // Create a copy of centers to modify
      const centersToProcess = [...centers];

      // Process each center to add missing coordinates if needed
      for (let i = 0; i < centersToProcess.length; i++) {
        const center = centersToProcess[i];
        if (!hasValidCoordinates(center)) {
          try {
            const coordinates = await geocodeAddress(center);
            if (coordinates) {
              centersToProcess[i] = {
                ...center,
                coords: coordinates
              };
            }
          } catch (error) {
            console.error(`Failed to geocode address for center ${center.name}:`, error);
          }
        }
      }

      // Add highlighting to all centers
      const highlightedCenters = centersToProcess.map(center => ({
        ...center,
        is_highlighted: true
      }));

      setProcessedCenters(highlightedCenters);
      setIsLoading(false);
    }

    processCentersWithGeocode();
  }, [centers]);

  if (isLoading) {
    return <div className="animate-pulse bg-spirit-blue-100 rounded-lg h-full"></div>;
  }

  return (
    <CenterMap
      centers={processedCenters}
      initialLat={initialLat}
      initialLng={initialLng}
      defaultZoom={defaultZoom}
      autoZoom={true}
      highlightCenter={true}
    />
  );
} 