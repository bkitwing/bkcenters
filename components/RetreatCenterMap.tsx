'use client';

import { useState, useEffect } from 'react';
import { Center } from '@/lib/types';
import { hasValidCoordinates } from '@/lib/geocoding';
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
    // Process centers - no need for geocoding as it's now handled server-side
    function processCenters() {
      setIsLoading(true);
      
      // Add highlighting to all centers
      const highlightedCenters = centers.map(center => ({
        ...center,
        is_highlighted: true
      }));

      setProcessedCenters(highlightedCenters);
      setIsLoading(false);
    }

    processCenters();
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