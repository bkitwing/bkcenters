'use client';

import { useState, useEffect, useCallback } from 'react';
import { Center } from '@/lib/types';
import { useGoogleMaps } from '@/lib/useGoogleMaps';

interface CenterMapProps {
  centers: Center[];
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  height?: string;
  onCenterSelect?: (center: Center) => void;
  isDistrictView?: boolean;
  autoZoom?: boolean;
  highlightCenter?: boolean;
  defaultZoom?: number;
  showInfoWindowOnLoad?: boolean;
}

const CenterMap: React.FC<CenterMapProps> = ({
  centers,
  initialLat,
  initialLng,
  initialZoom,
  height = '500px',
  onCenterSelect,
  isDistrictView = false,
  autoZoom = false,
  highlightCenter = false,
  defaultZoom = 5,
  showInfoWindowOnLoad = true
}) => {
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [centerPosition, setCenterPosition] = useState<{lat: number, lng: number} | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [markersReady, setMarkersReady] = useState(false);
  
  // Use our custom Google Maps hook
  const { isLoaded, loadError, hasValidKey } = useGoogleMaps();
  const [GoogleMap, setGoogleMap] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [InfoWindow, setInfoWindow] = useState<any>(null);

  // Lazy load the Google Maps components only when API is ready
  useEffect(() => {
    if (isLoaded && !loadError) {
      try {
        const { GoogleMap, Marker, InfoWindow } = require('@react-google-maps/api');
        setGoogleMap(() => GoogleMap);
        setMarker(() => Marker);
        setInfoWindow(() => InfoWindow);
        
        // Set a timeout to ensure markers are ready after components are loaded
        const timeout = setTimeout(() => {
          setMarkersReady(true);
        }, 100);
        
        return () => clearTimeout(timeout);
      } catch (error) {
        console.error('Error loading Google Maps components:', error);
      }
    }
  }, [isLoaded, loadError]);

  // Determine map center position
  useEffect(() => {
    try {
      if (initialLat && initialLng) {
        setCenterPosition({ lat: initialLat, lng: initialLng });
      } else if (centers.length > 0 && centers[0].coords && centers[0].coords.length === 2) {
        setCenterPosition({
          lat: parseFloat(centers[0].coords[0]),
          lng: parseFloat(centers[0].coords[1])
        });
      } else {
        // Default to center of India if no position available
        setCenterPosition({ lat: 20.5937, lng: 78.9629 });
      }
    } catch (error) {
      console.error('Error setting center position:', error);
      setCenterPosition({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
    }
  }, [centers, initialLat, initialLng]);

  // Auto-zoom to fit all markers
  const fitBounds = useCallback(() => {
    if (!mapRef || !centers.length || !google?.maps) return;

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;

    centers.forEach(center => {
      if (center.coords && center.coords.length === 2) {
        try {
          const lat = parseFloat(center.coords[0]);
          const lng = parseFloat(center.coords[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend({ lat, lng });
            hasValidCoords = true;
          }
        } catch (e) {
          console.error('Error adding point to bounds:', e);
        }
      }
    });

    if (hasValidCoords) {
      mapRef.fitBounds(bounds);
      
      // If we have a single marker, set a specific zoom level
      if (centers.length === 1 && highlightCenter) {
        setTimeout(() => {
          mapRef.setZoom(defaultZoom);
        }, 100);
      } else {
        // Add some padding for multiple markers
        const listener = google.maps.event.addListenerOnce(mapRef, 'bounds_changed', () => {
          mapRef.setZoom(Math.min(mapRef.getZoom() || 10, 12));
        });
        
        return () => {
          google.maps.event.removeListener(listener);
        };
      }
    }
  }, [mapRef, centers, defaultZoom, highlightCenter]);

  // Apply auto-zoom when map and centers are available
  useEffect(() => {
    if (autoZoom && mapRef && centers.length > 0 && markersReady) {
      // Add a slight delay to allow markers to fully render
      const timeout = setTimeout(() => {
        fitBounds();
      }, 200);
      
      return () => clearTimeout(timeout);
    }
  }, [autoZoom, mapRef, centers, fitBounds, markersReady]);

  // Auto-select center if we're in highlight mode and showInfoWindowOnLoad is true
  useEffect(() => {
    if (highlightCenter && centers.length === 1 && !selectedCenter && showInfoWindowOnLoad && markersReady) {
      // Add a slight delay to ensure the map is fully loaded
      const timeout = setTimeout(() => {
        setSelectedCenter(centers[0]);
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [highlightCenter, centers, selectedCenter, showInfoWindowOnLoad, markersReady]);

  // Apply zoom level from initialZoom prop if provided
  useEffect(() => {
    if (mapRef && initialZoom && !autoZoom) {
      mapRef.setZoom(initialZoom);
    }
  }, [mapRef, initialZoom, autoZoom]);

  const handleMarkerClick = (center: Center) => {
    setSelectedCenter(center);
    if (onCenterSelect) {
      onCenterSelect(center);
    }
  };

  const onMapLoad = (map: google.maps.Map) => {
    setMapRef(map);
    
    // Force redraw after map loads
    setTimeout(() => {
      const center = map.getCenter();
      if (center) {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(center);
      }
    }, 100);
  };

  // Show static map if Google Maps API key is missing or invalid
  if (!hasValidKey || loadError) {
    return (
      <div 
        style={{ height, position: 'relative' }} 
        className="bg-spirit-purple-50 rounded-lg flex flex-col items-center justify-center border border-spirit-purple-100"
      >
        <div className="text-center p-4">
          <p className="text-neutral-500 mb-2">Map unavailable</p>
          <p className="text-sm text-neutral-400 mb-4">Google Maps API key required</p>
          
          {centers.map(center => (
            <div 
              key={center.branch_code} 
              className="bg-light p-3 mb-2 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-neutral-200"
              onClick={() => handleMarkerClick(center)}
            >
              <p className="font-medium text-primary">{center.name}</p>
              <p className="text-sm text-neutral-500">
                {center.coords ? `${center.coords[0]}, ${center.coords[1]}` : 'No coordinates'}
              </p>
            </div>
          ))}
          
          <div className="mt-4 text-xs text-neutral-400">
            <p>To enable maps, add a Google Maps API key to your .env.local file:</p>
            <code className="bg-neutral-200 p-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here</code>
          </div>
        </div>
      </div>
    );
  }

  // Loading placeholder
  if (!isLoaded || !centerPosition || !GoogleMap || !Marker || !InfoWindow) {
    return <div className="animate-pulse bg-spirit-blue-100 rounded-lg" style={{ height }}></div>;
  }

  const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem'
  };

  // Customize marker icons for district view or highlighted center
  const getMarkerIcon = (center: Center) => {
    // For district markers, show markers with intensity based on count
    if (isDistrictView) {
      const count = center.district_total || 0;
      
      // Calculate color intensity based on center count
      // Higher count = more intense color (darker orange)
      // Lower count = lighter color
      const baseColor = '#7E57C2'; // Primary purple
      let opacity = 0.5 + Math.min(count / 50, 0.5); // Scale opacity between 0.5 and 1.0
      
      // For very small numbers, ensure they're still visible
      if (count <= 5) opacity = 0.5;
      
      return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: baseColor,
        fillOpacity: opacity,
        scale: 18, // Fixed size for all markers
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        labelOrigin: new google.maps.Point(0, 0)
      };
    }
    
    // For highlighted centers (individual center view)
    if (highlightCenter && center.is_highlighted) {
      return {
        path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
        fillColor: '#7E57C2', // Primary purple
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 1.2
      };
    }

    // Default marker
    return {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
      fillColor: center.is_district_summary ? '#4FC3F7' : '#7E57C2', // Secondary blue for districts, primary purple for centers
      fillOpacity: 0.9,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: center.is_district_summary ? 1 : 0.8
    };
  };

  // Custom label for district markers
  const getMarkerLabel = (center: Center) => {
    if (!isDistrictView) return undefined;
    
    return {
      text: `${center.district_total || ''}`,
      color: 'white',
      fontSize: '11px',
      fontWeight: 'bold'
    };
  };

  // Add a formatAddress helper function before the return statement
  const formatAddress = (center: Center) => {
    if (!center.address) return 'Address not available';
    
    const { line1, line2, line3, city, pincode } = center.address;
    let addressParts = [];
    
    if (line1) addressParts.push(line1);
    if (line2) addressParts.push(line2);
    if (line3) addressParts.push(line3);
    if (city) addressParts.push(city);
    if (pincode) addressParts.push(pincode);
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
  };

  return (
    <div style={{ height }}>
      {isLoaded && centerPosition && (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={centerPosition}
          zoom={initialLat && initialLng ? 13 : defaultZoom}
          options={{
            fullscreenControl: true,
            mapTypeControl: true,
            streetViewControl: true,
            zoomControl: true,
          }}
          onLoad={onMapLoad}
        >
          {markersReady && centers.map((center) => {
            if (!center.coords || center.coords.length !== 2) return null;
            
            try {
              const position = {
                lat: parseFloat(center.coords[0]),
                lng: parseFloat(center.coords[1])
              };
              
              if (isNaN(position.lat) || isNaN(position.lng)) {
                console.warn(`Invalid coordinates for center ${center.name}:`, center.coords);
                return null;
              }
              
              return (
                <Marker
                  key={center.branch_code}
                  position={position}
                  title={center.name}
                  onClick={() => handleMarkerClick(center)}
                  icon={getMarkerIcon(center)}
                  label={getMarkerLabel(center)}
                  animation={highlightCenter && center.is_highlighted ? 1 : undefined} // 1 = BOUNCE
                />
              );
            } catch (e) {
              console.error(`Error creating marker for center ${center.name}:`, e);
              return null;
            }
          })}

          {selectedCenter && selectedCenter.coords && selectedCenter.coords.length === 2 && (
            <InfoWindow
              position={{
                lat: parseFloat(selectedCenter.coords[0]),
                lng: parseFloat(selectedCenter.coords[1])
              }}
              onCloseClick={() => setSelectedCenter(null)}
            >
              <div className="max-w-xs">
                <h3 className="font-semibold text-base">{selectedCenter.name}</h3>
                {isDistrictView && selectedCenter.is_district_summary ? (
                  <div>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="inline-flex items-center justify-center bg-[#FF7F50] text-white font-semibold text-sm rounded-full w-8 h-8 mr-1">
                        {selectedCenter.district_total || 0}
                      </span>
                      meditation {selectedCenter.district_total === 1 ? 'center' : 'centers'} in this district
                    </p>
                    <div className="mt-2">
                      <a
                        href={`/centers/${encodeURIComponent(selectedCenter.state)}/${encodeURIComponent(selectedCenter.district)}`}
                        className="text-[#FF7F50] text-sm font-medium"
                      >
                        View Centers in {selectedCenter.district}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-700 mt-1">
                      {selectedCenter.description || formatAddress(selectedCenter)}
                    </p>
                    <div className="mt-2">
                      <a
                        href={`/centers/${encodeURIComponent(selectedCenter.state)}/${encodeURIComponent(selectedCenter.district)}/${encodeURIComponent(selectedCenter.branch_code)}`}
                        className="text-[#FF7F50] text-sm font-medium"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      )}
    </div>
  );
};

export default CenterMap; 