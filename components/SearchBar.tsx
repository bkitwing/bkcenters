'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleMaps } from '@/lib/useGoogleMaps';
import { CenterLocatorAnalytics } from './GoogleAnalytics';

declare global {
  interface Window {
    google: any;
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SearchBarProps {
  onSearchResult?: (lat: number, lng: number, address: string) => void;
  placeholder?: string;
  value?: string;
  onClear?: () => void;
  showClearButton?: boolean;
  disableVoiceInput?: boolean;
  isLocalSearch?: boolean;
  onTextChange?: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearchResult,
  placeholder = 'Enter your location to find centers near you...',
  value,
  onClear,
  showClearButton = false,
  disableVoiceInput = false,
  isLocalSearch = false,
  onTextChange
}) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { isLoaded, loadError, hasValidKey } = useGoogleMaps();
  
  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  
  // Initialize speech recognition only if not disabled
  useEffect(() => {
    if (typeof window !== 'undefined' && !disableVoiceInput) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-IN'; // Set to Indian English by default
          
          // Setup recognition event handlers
          recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }
            
            // Update the interim transcript for display
            setInterimTranscript(interimTranscript);
            
            // If we have a final result, update the input value
            if (finalTranscript) {
              setInputValue(finalTranscript);
              if (inputRef.current) {
                inputRef.current.value = finalTranscript;
              }
              
              // If local search, just update the parent component
              if (isLocalSearch && onTextChange) {
                onTextChange(finalTranscript);
              }
            }
          };
          
          recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event);
            setVoiceError('Error recognizing speech. Please try again.');
            stopListening();
          };
          
          recognition.onend = () => {
            setIsListening(false);
            // If there was an interim transcript when ended, finalize it
            if (interimTranscript) {
              setInputValue(prev => prev || interimTranscript);
              setInterimTranscript('');
              
              // If local search, just update the parent component
              if (isLocalSearch && onTextChange) {
                onTextChange(interimTranscript);
              }
            }
          };
          
          setSpeechRecognition(recognition);
          setVoiceSupported(true);
        } catch (error) {
          console.error('Error initializing speech recognition:', error);
          setVoiceSupported(false);
        }
      } else {
        setVoiceSupported(false);
      }
    }
  }, [disableVoiceInput, isLocalSearch, onTextChange]);
  
  const startListening = () => {
    setVoiceError(null);
    setInterimTranscript('');
    if (speechRecognition) {
      try {
        speechRecognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setVoiceError('Could not start voice input. Please try again.');
      }
    }
  };
  
  const stopListening = () => {
    if (speechRecognition) {
      try {
        speechRecognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    setIsListening(false);
    // Clear interim transcript when stopping
    setInterimTranscript('');
  };
  
  useEffect(() => {
    // Only initialize autocomplete after Google Maps is loaded and if not in local search mode
    if (isLoaded && inputRef.current && !isLocalSearch) {
      initAutocomplete();
    }
  }, [isLoaded, isLocalSearch]);
  
  useEffect(() => {
    // Initialize from URL parameters only if not in local search mode
    if (typeof window !== "undefined" && !isLocalSearch) {
      const params = new URLSearchParams(window.location.search);
      const addressParam = params.get('address');
      
      if (addressParam) {
        setInputValue(decodeURIComponent(addressParam));
      }
    }
  }, [isLocalSearch]);
  
  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);
  
  const initAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    
    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'in' },
        fields: ['geometry', 'formatted_address'],
      });
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          console.error('No details available for the place you searched');
          return;
        }
        
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address;
        
        // Update input value to match selected place
        setInputValue(address);
        
        // Track the search event
        CenterLocatorAnalytics.searchCenters(address, 0, 'location');
        
        if (onSearchResult) {
          onSearchResult(lat, lng, address);
        } else {
          // Navigate to results page with query params
          router.push(`/centers?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`);
          
          // Also update URL for shareability without page reload
          const url = `/centers?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`;
          window.history.pushState({ path: url }, '', url);
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  };
  
  const handleGetCurrentLocation = () => {
    if (isLocalSearch) return; // Skip for local search mode
    
    setIsLocating(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Try to get address from coordinates using Google's Geocoding API
          let address = "Current Location";
          
          if (window.google?.maps?.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            const response = await new Promise((resolve, reject) => {
              geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any, status: any) => {
                if (status === "OK" && results[0]) {
                  resolve(results[0].formatted_address);
                } else {
                  reject("Unable to find address for this location");
                }
              });
            });
            
            address = response as string;
            
            // Update the input field with the resolved address
            if (inputRef.current) {
              inputRef.current.value = address;
              setInputValue(address);
            }
          }
          
          // Track current location usage
          CenterLocatorAnalytics.locationPermission(true);
          CenterLocatorAnalytics.searchCenters(address, 0, 'location');
          
          if (onSearchResult) {
            onSearchResult(latitude, longitude, address);
          } else {
            // Navigate to results page with query params
            router.push(`/centers?lat=${latitude}&lng=${longitude}&address=${encodeURIComponent(address)}`);
            
            // Also update URL for shareability without page reload
            const url = `/centers?lat=${latitude}&lng=${longitude}&address=${encodeURIComponent(address)}`;
            window.history.pushState({ path: url }, '', url);
          }
          
          setIsLocating(false);
        } catch (error) {
          console.error("Error getting location address:", error);
          setLocationError("Could not determine your address");
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Failed to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please allow location access in your browser.";
            CenterLocatorAnalytics.locationPermission(false);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        
        setLocationError(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // For local search, pass the value to parent immediately
    if (isLocalSearch && onTextChange) {
      onTextChange(newValue);
    }
    
    // Clear any error messages when user starts typing
    if (voiceError) setVoiceError(null);
    if (locationError) setLocationError(null);
  };
  
  // Handle input focus to clear error states
  const handleInputFocus = () => {
    // Clear error messages when user clicks in the search box
    if (voiceError) setVoiceError(null);
    if (locationError) setLocationError(null);
  };
  
  // Show loading state while Google Maps is loading
  useEffect(() => {
    // Only show loading if we're not in local search mode
    setIsLoading(!isLoaded && !isLocalSearch);
  }, [isLoaded, isLocalSearch]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (speechRecognition && isListening) {
        speechRecognition.stop();
      }
    };
  }, [speechRecognition, isListening]);
  
  // Combine inputValue and interimTranscript for display
  const displayValue = isListening && interimTranscript ? interimTranscript : inputValue;
  
  return (
    <div className="w-full relative">
      <div className="relative flex-grow">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className={`w-full p-4 ${(!disableVoiceInput && voiceSupported) ? 'pr-24' : 'pr-10'} rounded-lg border ${locationError || voiceError ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#FF7F50] focus:border-transparent ${isListening ? 'animate-pulse-light' : ''}`}
          placeholder={
            voiceError 
              ? "Error recognizing speech" 
              : locationError
                ? "Location error"
                : isListening 
                  ? "Listening..." 
                  : (!hasValidKey && !isLocalSearch 
                    ? "Location search unavailable (API key missing)" 
                    : placeholder)
          }
          disabled={(isLoading || !hasValidKey || !!loadError) && !isLocalSearch}
          readOnly={isListening}
        />
        
        <div className="absolute right-3 top-4 flex items-center space-x-2">
          {!disableVoiceInput && voiceSupported && (
            <div className="flex items-center">
              {isListening && (
                <span className="text-spirit-purple-600 text-xs mr-2 flex items-center">
                  <span className="flex space-x-1 mr-1">
                    <span className="h-2 w-2 bg-spirit-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 bg-spirit-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 bg-spirit-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </span>
              )}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={(isLoading || !hasValidKey || !!loadError) && !isLocalSearch}
                className={`rounded-full p-1 focus:outline-none ${isListening ? 'bg-red-500 text-white' : voiceError ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
                title={voiceError ? 'Try again' : isListening ? 'Stop voice input' : 'Start voice input'}
                aria-label={voiceError ? 'Try again' : isListening ? 'Stop voice input' : 'Start voice input'}
              >
                {isListening ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            </div>
          )}
          
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF7F50]"></div>
          ) : showClearButton && inputValue ? (
            <button 
              onClick={onClear}
              className="focus:outline-none"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-gray-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          )}
        </div>
      </div>
      
      {!hasValidKey && !isLocalSearch && (
        <p className="mt-2 text-xs text-red-500">
          Google Maps API key is missing or invalid. Please add a valid key to enable location search.
        </p>
      )}
      
      {loadError && !isLocalSearch && (
        <p className="mt-2 text-xs text-red-500">
          Failed to load Google Maps. Please try again later.
        </p>
      )}
    </div>
  );
};

export default SearchBar;