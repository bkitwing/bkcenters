'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Center } from '@/lib/types';
import { useGoogleMaps } from '@/lib/useGoogleMaps';
import { hasValidCoordinates } from '@/lib/geocoding';
import { formatCenterUrl } from '@/lib/urlUtils';
import { calculateCenterDistance, formatDistance } from '@/lib/distanceUtils';
import { logger } from '@/lib/logger';
import { CenterLocatorAnalytics } from './GoogleAnalytics';

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
  selectedCenter?: Center | null;
  userLocation?: { lat: number; lng: number; };
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
  showInfoWindowOnLoad = false,
  selectedCenter: externalSelectedCenter = null,
  userLocation
}) => {
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [centerPosition, setCenterPosition] = useState<{lat: number, lng: number} | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [markersReady, setMarkersReady] = useState(false);
  
  // Create a reference to store all markers for later access
  const [markers, setMarkers] = useState<Map<string, google.maps.Marker>>(new Map());
  
  // Use our custom Google Maps hook
  const { isLoaded, loadError, hasValidKey } = useGoogleMaps();
  const [GoogleMap, setGoogleMap] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [InfoWindow, setInfoWindow] = useState<any>(null);
  
  // Distance measurement state
  const [distanceMeasurementMode, setDistanceMeasurementMode] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<Center | null>(null);
  const [endPoint, setEndPoint] = useState<Center | null>(null);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);
  const distanceLineRef = useRef<google.maps.Polyline | null>(null);

  // Use external selectedCenter if provided
  useEffect(() => {
    if (externalSelectedCenter) {
      setSelectedCenter(externalSelectedCenter);
    }
  }, [externalSelectedCenter]);

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
        logger.error('Error loading Google Maps components:', error);
      }
    }
  }, [isLoaded, loadError]);

  // Determine map center position
  useEffect(() => {
    try {
      if (initialLat && initialLng) {
        setCenterPosition({ lat: initialLat, lng: initialLng });
        logger.trace('Setting center from initialLat/initialLng:', initialLat, initialLng);
      } else if (centers.length > 0 && centers[0]?.coords && Array.isArray(centers[0].coords) && centers[0].coords.length === 2) {
        const lat = parseFloat(centers[0].coords[0]);
        const lng = parseFloat(centers[0].coords[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          setCenterPosition({ lat, lng });
          logger.trace('Setting center from first center coords:', lat, lng);
        } else {
          logger.warn('Invalid coordinates in first center:', centers[0].coords);
          setCenterPosition({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
        }
      } else {
        // Default to center of India if no position available
        logger.debug('No valid coordinates found, using default center of India');
        setCenterPosition({ lat: 20.5937, lng: 78.9629 });
      }
    } catch (error) {
      logger.error('Error setting center position:', error);
      setCenterPosition({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
    }
  }, [centers, initialLat, initialLng]);

  // Helper function to get valid coordinates for a center
  const getValidCoordinates = useCallback((center: Center): [string, string] | null => {
    // Use original coordinates if valid - no need for fallback geocoding anymore
    if (hasValidCoordinates(center)) {
      return center.coords as [string, string];
    }
    
    return null;
  }, []);

  // Auto-zoom to fit all markers
  const fitBounds = useCallback(() => {
    if (!mapRef || !centers.length || !google?.maps) return;

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;
    let validCenterCount = 0;

    centers.forEach(center => {
      // Get coordinates using our helper function
      const coords = getValidCoordinates(center);
      
      if (coords) {
        try {
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend({ lat, lng });
            hasValidCoords = true;
            validCenterCount++;
          }
        } catch (e) {
          logger.error('Error adding point to bounds:', e);
        }
      }
    });

    if (hasValidCoords) {
      // Add padding to the bounds
      const padding = { 
        top: 50, 
        right: 50, 
        bottom: 50, 
        left: 50 
      };
      
      mapRef.fitBounds(bounds, padding);
      
      // Add a slight delay before adjusting zoom
      setTimeout(() => {
        // Get the current zoom level
        const currentZoom = mapRef.getZoom() || defaultZoom;
        
        // For single marker
        if (validCenterCount === 1) {
          mapRef.setZoom(16);
        }
        // For state view (when markers are state summaries)
        else if (centers.some(c => c.is_state_summary)) {
          const targetZoom = Math.min(currentZoom, 5);
          mapRef.setZoom(targetZoom);
        }
        // For district or nearby centers view
        else {
          const targetZoom = Math.min(currentZoom, validCenterCount <= 3 ? 14 : 13);
          mapRef.setZoom(targetZoom);
        }
      }, 100);
    }
  }, [mapRef, centers, defaultZoom, getValidCoordinates]);

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

  // Handle marker click to select a center
  const handleMarkerClick = (center: Center) => {
    // For distance measurement mode
    if (distanceMeasurementMode) {
      // If start point is not set, set it as start point
      if (!startPoint) {
        setStartPoint(center);
        CenterLocatorAnalytics.mapInteraction('distance_start_point', center.name);
        return;
      }
      
      // If end point is not set, set it as end point and calculate distance
      if (!endPoint) {
        setEndPoint(center);
        // Calculate and display the distance
        const distance = calculateCenterDistance(startPoint, center);
        setMeasuredDistance(distance);
        
        // Track distance measurement
        CenterLocatorAnalytics.mapInteraction('distance_measured', `${formatDistance(distance)} between ${startPoint.name} and ${center.name}`);
        
        // Draw a line between the two points if we have coordinates
        if (mapRef && window.google?.maps && startPoint.coords && center.coords) {
          // Remove existing line if any
          if (distanceLineRef.current) {
            distanceLineRef.current.setMap(null);
          }
          
          const startCoords = getValidCoordinates(startPoint);
          const endCoords = getValidCoordinates(center);
          
          if (startCoords && endCoords) {
            const startLat = parseFloat(startCoords[0]);
            const startLng = parseFloat(startCoords[1]);
            const endLat = parseFloat(endCoords[0]);
            const endLng = parseFloat(endCoords[1]);
            
            if (!isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng)) {
              // Create a polyline between the two points
              const line = new google.maps.Polyline({
                path: [
                  { lat: startLat, lng: startLng },
                  { lat: endLat, lng: endLng }
                ],
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                map: mapRef
              });
              
              distanceLineRef.current = line;
            }
          }
        }
        return;
      }
      
      // If both start and end points are set, reset and start with new start point
      setStartPoint(center);
      setEndPoint(null);
      setMeasuredDistance(null);
      
      // Remove existing line
      if (distanceLineRef.current) {
        distanceLineRef.current.setMap(null);
        distanceLineRef.current = null;
      }
      
      return;
    }
    
    // Regular center selection behavior (when not measuring)
    setSelectedCenter(center);
    
    // Track map marker click
    CenterLocatorAnalytics.mapInteraction('marker_click', center.name);
    
    // Find and highlight the corresponding card
    const centerElement = document.getElementById(`center-card-${center.branch_code}`);
    if (centerElement) {
      // First remove highlight from any previously highlighted cards
      document.querySelectorAll('.highlight-card').forEach(el => {
        el.classList.remove('highlight-card');
      });

      // Add a small delay to ensure the scroll completes before highlighting
      setTimeout(() => {
        // Scroll into view with smooth behavior
        centerElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
        
        // Add highlight class and ensure it's visible
        centerElement.classList.add('highlight-card');
        
        // Remove highlight after animation
        setTimeout(() => {
          centerElement.classList.remove('highlight-card');
        }, 1500);
      }, 100);
    }
    
    if (onCenterSelect) {
      onCenterSelect(center);
    }
  };
  
  // Toggle distance measurement mode
  const toggleDistanceMeasurementMode = () => {
    // Toggle the mode
    setDistanceMeasurementMode(!distanceMeasurementMode);
    
    // Track distance measurement mode toggle
    CenterLocatorAnalytics.mapInteraction(distanceMeasurementMode ? 'distance_mode_off' : 'distance_mode_on');
    
    // Reset measurement state when toggling off
    if (distanceMeasurementMode) {
      resetDistanceMeasurement();
    }
  };
  
  // Reset distance measurement state
  const resetDistanceMeasurement = () => {
    setStartPoint(null);
    setEndPoint(null);
    setMeasuredDistance(null);
    
    // Remove the line from the map
    if (distanceLineRef.current) {
      distanceLineRef.current.setMap(null);
      distanceLineRef.current = null;
    }
  };
  
  // Highlight a marker when its corresponding center is selected and center the map on it
  useEffect(() => {
    if (!mapRef || !selectedCenter) return;
    
    // Find the marker for the selected center
    const marker = markers.get(selectedCenter.branch_code);
    if (marker) {
      // Apply bounce animation to the marker
      marker.setAnimation(google.maps.Animation.BOUNCE);
      
      // Center the map on the selected marker with a slight zoom-in effect
      if (selectedCenter.coords && selectedCenter.coords.length === 2) {
        const [lat, lng] = selectedCenter.coords.map(parseFloat);
        if (!isNaN(lat) && !isNaN(lng)) {
          // Smoothly pan to the marker
          mapRef.panTo({ lat, lng });
          
          // Zoom in slightly if we're zoomed out too far
          const currentZoom = mapRef.getZoom() || defaultZoom;
          if (currentZoom < 13) {
            mapRef.setZoom(13);
          }
        }
      }
      
      // Stop animation after 1.5 seconds
      setTimeout(() => {
        if (marker) {
          marker.setAnimation(null);
        }
      }, 1500);
    }
  }, [selectedCenter, markers, mapRef, defaultZoom]);

  // Register each marker when created
  const registerMarker = useCallback((branchCode: string, marker: google.maps.Marker) => {
    setMarkers(prev => {
      const newMarkers = new Map(prev);
      newMarkers.set(branchCode, marker);
      return newMarkers;
    });
  }, []);

  const onMapLoad = (map: google.maps.Map) => {
    setMapRef(map);
    
    // Add zoom change listener for analytics
    map.addListener('zoom_changed', () => {
      const zoom = map.getZoom();
      if (zoom) {
        CenterLocatorAnalytics.mapInteraction(zoom > (map as any).previousZoom ? 'zoom_in' : 'zoom_out');
        (map as any).previousZoom = zoom;
      }
    });
    
    // Add drag listener for analytics
    map.addListener('dragend', () => {
      CenterLocatorAnalytics.mapInteraction('pan');
    });
    
    // Force redraw after map loads
    setTimeout(() => {
      const center = map.getCenter();
      if (center) {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(center);
      }
    }, 100);
  };

  // Customize marker icons for district view or highlighted center
  const getMarkerIcon = (center: Center) => {
    // For distance measurement mode
    if (distanceMeasurementMode) {
      if (startPoint?.branch_code === center.branch_code) {
        return {
          path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
          fillColor: '#FF0000', // Red for start point
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
          scale: 1.3
        };
      }
      
      if (endPoint?.branch_code === center.branch_code) {
        return {
          path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
          fillColor: '#00FF00', // Green for end point
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
          scale: 1.3
        };
      }
    }
    
    // For selected center (given higher priority)
    if (selectedCenter?.branch_code === center.branch_code) {
      return {
        path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
        fillColor: '#7E57C2', // Primary purple
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2.5,
        scale: 1.3
      };
    }
    
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
        scale: 15, // Fixed size for all markers
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        labelOrigin: new google.maps.Point(0, 0)
      };
    }
    
    // For state summary on homepage
    if (center.is_state_summary) {
      const count = center.district_total || 0;
      
      // Use fixed size for state markers
      return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#7E57C2', // Primary purple
        fillOpacity: 0.7, // Fixed opacity
        scale: 15, // Fixed size for all state markers
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

    // For nearby centers
    if ((center as any).is_nearby) {
      return {
        path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
        fillColor: '#4CAF50', // Green color for nearby centers
        fillOpacity: 0.9,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 0.9
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
    if (isDistrictView) {
      return {
        text: `${center.district_total || ''}`,
        color: 'white',
        fontSize: '11px',
        fontWeight: 'bold'
      };
    }
    
    // Add labels for state summary markers on homepage
    if (center.is_state_summary) {
      return {
        text: `${center.district_total || ''}`,
        color: 'white',
        fontSize: '11px',
        fontWeight: 'bold'
      };
    }
    
    return undefined;
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

  // Helper function to calculate InfoWindow offset based on center type
  const getInfoWindowOffset = useCallback((center: Center): google.maps.Size => {
    if (center.is_state_summary || center.is_district_summary) {
      // Larger offset for summary markers which are bigger
      return new google.maps.Size(0, -35);
    }
    
    // Standard offset for regular markers
    return new google.maps.Size(0, -25);
  }, []);

  const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem'
  };

  return (
    <div style={{ height }}>
      {isLoaded && centerPosition && GoogleMap && Marker && InfoWindow ? (
        <div className="relative h-full">
          {/* Distance measurement controls */}
          <div className="absolute top-2 right-2 z-10 bg-white rounded-lg shadow-md p-2">
            <button 
              onClick={toggleDistanceMeasurementMode}
              className={`flex items-center justify-center w-8 h-8 rounded-full ${distanceMeasurementMode ? 'bg-spirit-purple-700 text-white' : 'bg-white text-neutral-700 border border-neutral-300'}`}
              title={distanceMeasurementMode ? 'Exit Measure Mode' : 'Measure Distance'}
            >
              {distanceMeasurementMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {distanceMeasurementMode && (
              <div className="mt-2 w-48">
                {!startPoint && (
                  <p className="text-sm text-neutral-700">Click on any center</p>
                )}
                {startPoint && !endPoint && (
                  <p className="text-sm text-neutral-700">Click on another center</p>
                )}
                {startPoint && endPoint && measuredDistance !== null && (
                  <div className="p-2 bg-neutral-100 rounded text-sm">
                    <p className="font-bold">Distance:</p>
                    <p>{formatDistance(measuredDistance)}</p>
                    <p className="text-xs mt-1">From: {startPoint.name}</p>
                    <p className="text-xs">To: {endPoint.name}</p>
                    <button 
                      onClick={resetDistanceMeasurement}
                      className="mt-2 px-2 py-1 bg-neutral-200 text-neutral-700 rounded text-xs"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={centerPosition}
            zoom={initialLat && initialLng ? 14 : defaultZoom}
            options={{
              fullscreenControl: true,
              mapTypeControl: true,
              streetViewControl: true,
              zoomControl: true,
              maxZoom: 18,
              minZoom: 5,
            }}
            onLoad={onMapLoad}
          >
            {markersReady && centers.map((center) => {
              // Get coordinates (either original or geocoded)
              const coords = getValidCoordinates(center);
              
              // Skip centers without valid coordinates
              if (!coords) return null;
              
              const [lat, lng] = coords.map(parseFloat);
              if (isNaN(lat) || isNaN(lng)) return null;
              
              const isSelected = selectedCenter?.branch_code === center.branch_code;
              
              return (
                <Marker
                  key={center.branch_code}
                  position={{ lat, lng }}
                  onClick={() => handleMarkerClick(center)}
                  icon={getMarkerIcon(center)}
                  label={getMarkerLabel(center)}
                  title={center.name}
                  animation={isSelected ? google.maps.Animation.BOUNCE : null}
                  onLoad={(marker: google.maps.Marker) => registerMarker(center.branch_code, marker)}
                  zIndex={isSelected ? 1000 : undefined}
                >
                  {/* InfoWindow disabled as per requirements */}
                </Marker>
              );
            })}

            {/* Add user location marker */}
            {userLocation && markersReady && (
              <Marker
                position={userLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: '#4285F4', // Google Maps blue color
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2,
                  scale: 8
                }}
                title="Your Location"
                zIndex={2000} // Higher than other markers
              />
            )}
          </GoogleMap>
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          {loadError ? (
            <div className="text-center p-4">
              <p className="text-red-500 font-medium">Error loading Google Maps</p>
              <p className="text-sm text-gray-600 mt-2">Failed to load Google Maps</p>
            </div>
          ) : !hasValidKey ? (
            <div className="text-center p-4">
              <p className="text-yellow-600 font-medium">Google Maps API key not configured</p>
              <p className="text-sm text-gray-600 mt-2">Please add your API key in .env.local file</p>
            </div>
          ) : (
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-blue-200 rounded-full mb-2"></div>
              <p className="text-gray-500">Loading map...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CenterMap;