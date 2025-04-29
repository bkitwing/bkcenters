'use client';

import { useState, useEffect, useCallback } from 'react';
import { Center } from '@/lib/types';
import { useGoogleMaps } from '@/lib/useGoogleMaps';
import { geocodeAddress, hasValidCoordinates, geocodeState } from '@/lib/geocoding';
import { formatCenterUrl } from '@/lib/urlUtils';

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
  selectedCenter: externalSelectedCenter = null
}) => {
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [centerPosition, setCenterPosition] = useState<{lat: number, lng: number} | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [markersReady, setMarkersReady] = useState(false);
  const [geocodedCenters, setGeocodedCenters] = useState<Map<string, [string, string]>>(new Map());
  
  // Create a reference to store all markers for later access
  const [markers, setMarkers] = useState<Map<string, google.maps.Marker>>(new Map());
  
  // Use our custom Google Maps hook
  const { isLoaded, loadError, hasValidKey } = useGoogleMaps();
  const [GoogleMap, setGoogleMap] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [InfoWindow, setInfoWindow] = useState<any>(null);

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
        console.error('Error loading Google Maps components:', error);
      }
    }
  }, [isLoaded, loadError]);

  // Determine map center position
  useEffect(() => {
    try {
      if (initialLat && initialLng) {
        setCenterPosition({ lat: initialLat, lng: initialLng });
        console.log('Setting center from initialLat/initialLng:', initialLat, initialLng);
      } else if (centers.length > 0 && centers[0]?.coords && Array.isArray(centers[0].coords) && centers[0].coords.length === 2) {
        const lat = parseFloat(centers[0].coords[0]);
        const lng = parseFloat(centers[0].coords[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          setCenterPosition({ lat, lng });
          console.log('Setting center from first center coords:', lat, lng);
        } else {
          console.warn('Invalid coordinates in first center:', centers[0].coords);
          setCenterPosition({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
        }
      } else {
        // Default to center of India if no position available
        console.log('No valid coordinates found, using default center of India');
        setCenterPosition({ lat: 20.5937, lng: 78.9629 });
      }
    } catch (error) {
      console.error('Error setting center position:', error);
      setCenterPosition({ lat: 20.5937, lng: 78.9629 }); // Default to center of India
    }
  }, [centers, initialLat, initialLng]);

  // Geocode addresses for centers without coordinates when Google Maps is loaded
  useEffect(() => {
    async function geocodeCenters() {
      if (!isLoaded || !window.google?.maps?.Geocoder) {
        console.log('Cannot geocode yet - Google Maps not loaded');
        return;
      }
      
      console.log('Starting geocoding for centers without coordinates');
      const updatedGeocodedCenters = new Map(geocodedCenters);
      let hasNewGeocodedCenters = false;
      let processedCount = 0;

      // Process centers that don't have valid coordinates
      for (const center of centers) {
        // Skip if already geocoded 
        if (geocodedCenters.has(center.branch_code)) {
          continue;
        }
        
        // Skip if it has valid coordinates
        if (hasValidCoordinates(center)) {
          console.log(`Center ${center.name} already has valid coordinates: ${center.coords}`);
          continue;
        }

        processedCount++;
        console.log(`Geocoding center ${processedCount}/${centers.length}: ${center.name}`);
        
        try {
          let coords;
          
          // Use state-specific geocoding for state summary markers
          if (center.is_state_summary && center.state) {
            coords = await geocodeState(center.state);
            console.log(`Used state-specific geocoding for ${center.state}`);
          } else {
            coords = await geocodeAddress(center);
          }
          
          if (coords) {
            updatedGeocodedCenters.set(center.branch_code, coords);
            hasNewGeocodedCenters = true;
            console.log(`Successfully geocoded center ${center.name}: ${coords[0]}, ${coords[1]}`);
          } else {
            console.warn(`Failed to get coordinates for center ${center.name}`);
          }
        } catch (error) {
          console.error(`Failed to geocode center ${center.name}:`, error);
        }
        
        // Add a small delay between geocoding requests to avoid rate limits
        if (processedCount < centers.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      if (hasNewGeocodedCenters) {
        console.log(`Updated geocoded centers with ${updatedGeocodedCenters.size} entries`);
        setGeocodedCenters(updatedGeocodedCenters);
      } else {
        console.log('No new centers were geocoded');
      }
    }

    geocodeCenters();
  }, [isLoaded, centers, geocodedCenters]);

  // Helper function to get valid coordinates for a center (either original or geocoded)
  const getValidCoordinates = useCallback((center: Center): [string, string] | null => {
    // Use original coordinates if valid
    if (hasValidCoordinates(center)) {
      return center.coords as [string, string];
    }
    
    // Use geocoded coordinates as fallback
    const geocodedCoords = geocodedCenters.get(center.branch_code);
    if (geocodedCoords) {
      return geocodedCoords;
    }
    
    return null;
  }, [geocodedCenters]);

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
          console.error('Error adding point to bounds:', e);
        }
      }
    });

    if (hasValidCoords) {
      mapRef.fitBounds(bounds);
      
      // If we have a single marker, set a specific zoom level
      if (validCenterCount === 1) {
        setTimeout(() => {
          mapRef.setZoom(16); // Increased zoom level for single center
        }, 100);
      } else {
        // Add some padding for multiple markers
        setTimeout(() => {
          const currentZoom = mapRef.getZoom() || defaultZoom;
          // Increase zoom levels for better visibility
          const targetZoom = Math.min(currentZoom, validCenterCount <= 3 ? 14 : 13); 
          mapRef.setZoom(targetZoom);
        }, 200);
      }
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
    setSelectedCenter(center);
    
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
      
      // Calculate color intensity based on center count
      // Higher count = darker purple
      // Lower count = lighter purple
      let opacity = 0.4 + Math.min(count / 100, 0.6); // Scale opacity between 0.4 and 1.0
      let scale = 12 + Math.min(count / 10, 8); // Scale size between 12 and 20
      
      // For very small numbers, ensure they're still visible
      if (count <= 5) {
        opacity = 0.4;
        scale = 12;
      }
      
      return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#7E57C2', // Primary purple
        fillOpacity: opacity,
        scale: scale,
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
        </GoogleMap>
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