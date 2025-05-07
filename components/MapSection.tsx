'use client';

import { useState, useEffect } from 'react';
import { Center } from '@/lib/types';
import { hasValidCoordinates } from '@/lib/geocoding';
import CenterMap from './CenterMap';

interface MapSectionProps {
  centers: Center[];
  initialLat?: number;
  initialLng?: number;
  defaultZoom?: number;
  selectedCenter?: Center | null;
  onCenterSelect?: (center: Center) => void;
}

export default function MapSection({ 
  centers, 
  initialLat, 
  initialLng, 
  defaultZoom = 5,
  selectedCenter,
  onCenterSelect
}: MapSectionProps) {
  const [processedCenters, setProcessedCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Process centers - no need for geocoding as it's now handled server-side
    function processCenters() {
      setIsLoading(true);
      
      // Add highlighting to all centers
      const highlightedCenters = centers.map(center => ({
        ...center,
        is_highlighted: selectedCenter ? center.branch_code === selectedCenter.branch_code : true
      }));

      setProcessedCenters(highlightedCenters);
      setIsLoading(false);
    }

    processCenters();
  }, [centers, selectedCenter]);

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
      onCenterSelect={onCenterSelect}
      selectedCenter={selectedCenter}
    />
  );
} 