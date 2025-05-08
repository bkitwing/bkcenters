'use client';

import { useState, useRef, useEffect } from 'react';
import { Center } from '@/lib/types';
import { useGoogleMaps } from '@/lib/useGoogleMaps';

interface DirectionsButtonProps {
  center: Center;
  address: string;
  buttonStyle?: 'primary' | 'card';
}

const DirectionsButton: React.FC<DirectionsButtonProps> = ({ 
  center, 
  address,
  buttonStyle = 'primary'
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [startLocation, setStartLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isSelectingPlace, setIsSelectingPlace] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoaded, loadError } = useGoogleMaps();
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const goButtonRef = useRef<HTMLButtonElement>(null);

  // Only close search input when clicking outside if not in the autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't handle clicks when selecting from autocomplete
      if (isSelectingPlace) {
        return;
      }
      
      // Don't close if it's a Google autocomplete element
      if (event.target instanceof Element) {
        const pacContainer = document.querySelector('.pac-container');
        const pacItem = document.querySelector('.pac-item');
        
        // Prevent closing when clicking on autocomplete dropdown or its items
        if ((pacContainer && pacContainer.contains(event.target)) || 
            (pacItem && pacItem.contains(event.target)) ||
            (event.target as Element).classList.contains('pac-item') ||
            (event.target as Element).classList.contains('pac-item-query')) {
          setIsSelectingPlace(true);
          setTimeout(() => setIsSelectingPlace(false), 300);
          return;
        }
      }

      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSearchInput(false);
      }
    };

    if (showSearchInput) {
      // Delay adding the event to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchInput, isSelectingPlace]);

  // Init Google Places autocomplete when input is shown
  useEffect(() => {
    if (showSearchInput && isLoaded && inputRef.current && window.google?.maps?.places) {
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address'],
        });
        
        autocompleteRef.current = autocomplete;
        
        const placeChangedListener = autocomplete.addListener('place_changed', () => {
          setIsSelectingPlace(true);
          const place = autocomplete.getPlace();
          if (place && place.formatted_address) {
            setStartLocation(place.formatted_address);
            // Focus the Go button to make it easier for the user to submit
            setTimeout(() => {
              if (goButtonRef.current) {
                goButtonRef.current.focus();
              }
            }, 100);
          }
          setTimeout(() => setIsSelectingPlace(false), 300);
        });
        
        return () => {
          google.maps.event.removeListener(placeChangedListener);
          autocompleteRef.current = null;
        };
      } catch (error) {
        console.error("Error initializing Places autocomplete:", error);
      }
    }
  }, [showSearchInput, isLoaded]);

  // Auto-focus on the input when shown
  useEffect(() => {
    if (showSearchInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearchInput]);

  const getDestinationCoords = () => {
    if (center?.coords && Array.isArray(center.coords) && center.coords.length === 2) {
      return `${center.coords[0]},${center.coords[1]}`;
    } else {
      return encodeURIComponent(address);
    }
  };

  const getDirectionsFromCurrentLocation = () => {
    setIsLocationLoading(true);

    // Use browser's Geolocation API to get the user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Successfully got location
          const { latitude, longitude } = position.coords;
          const destination = getDestinationCoords();
          const url = `https://www.google.com/maps/dir/${latitude},${longitude}/${destination}`;
          window.open(url, '_blank');
          setIsLocationLoading(false);
        },
        (error) => {
          // Error getting location
          console.error("Error getting location:", error);
          
          // Fallback to Google's handling of Current Location
          const destination = getDestinationCoords();
          const url = `https://www.google.com/maps/dir/Current+Location/${destination}`;
          window.open(url, '_blank');
          setIsLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      // Geolocation not supported - fallback
      console.warn("Geolocation is not supported by this browser");
      const destination = getDestinationCoords();
      const url = `https://www.google.com/maps/dir/Current+Location/${destination}`;
      window.open(url, '_blank');
      setIsLocationLoading(false);
    }
  };

  const getDirectionsFromInput = (address: string) => {
    if (!address.trim()) return;
    
    setIsSubmitting(true);
    try {
      const origin = encodeURIComponent(address);
      const destination = getDestinationCoords();
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
      
      window.open(url, '_blank');
      // Only reset once the window is opened
      setTimeout(() => {
        setShowSearchInput(false);
        setStartLocation('');
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      console.error("Error opening directions:", error);
      setIsSubmitting(false);
    }
  };

  const handleManualPlaceSelection = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.formatted_address) {
        setStartLocation(place.formatted_address);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // First check if we have a place from autocomplete
      handleManualPlaceSelection();
      // Then use whatever is in the input field
      getDirectionsFromInput(startLocation);
    }
  };

  const primaryButtonClass = "bg-spirit-purple-600 text-white px-3 py-2 rounded-md text-sm hover:bg-spirit-purple-700 transition-colors flex items-center";
  const secondaryButtonClass = "bg-spirit-blue-50 text-spirit-blue-700 border border-spirit-blue-200 px-3 py-2 rounded-md text-sm hover:bg-spirit-blue-100 transition-colors flex items-center";
  
  const cardPrimaryButtonClass = "bg-spirit-purple-600 text-white px-2 py-1.5 rounded-md text-sm hover:bg-spirit-purple-700 transition-colors flex items-center";
  const cardSecondaryButtonClass = "bg-spirit-blue-50 text-spirit-blue-700 border border-spirit-blue-200 px-2 py-1.5 rounded-md text-sm hover:bg-spirit-blue-100 transition-colors flex items-center";
  
  // Select appropriate button classes based on style
  const primaryClass = buttonStyle === 'card' ? cardPrimaryButtonClass : primaryButtonClass;
  const secondaryClass = buttonStyle === 'card' ? cardSecondaryButtonClass : secondaryButtonClass;
  
  // Adjust icon size based on style
  const iconClass = buttonStyle === 'card' ? "h-4 w-4 mr-1" : "h-5 w-5 mr-2";

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={getDirectionsFromCurrentLocation}
          disabled={isLocationLoading}
          className={primaryClass}
          title="Get directions from your current location"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {isLocationLoading ? "Loading..." : "From My Location"}
        </button>
        
        <button
          onClick={() => setShowSearchInput(!showSearchInput)}
          className={secondaryClass}
          title="Enter a custom starting location"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Custom Location
        </button>
      </div>
      
      {showSearchInput && (
        <div className="pt-2 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter starting location"
            className="flex-grow p-2 border border-neutral-300 rounded text-sm"
          />
          <button
            ref={goButtonRef}
            onClick={() => getDirectionsFromInput(startLocation)}
            disabled={!startLocation.trim() || isSubmitting}
            className="bg-spirit-purple-600 text-white px-2 py-1 rounded text-sm disabled:opacity-50 whitespace-nowrap"
          >
            {isSubmitting ? 'Loading...' : 'Go'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DirectionsButton; 