'use client';

import { useState, useRef, useEffect, useId, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Building2, Clock, MapPin } from 'lucide-react';
import { useGoogleMaps } from '@/lib/useGoogleMaps';
import { CenterLocatorAnalytics } from './GoogleAnalytics';

// ----- Suggestions (centers from our data + places from Google) -----

type CenterOption = { kind: 'center'; name: string; area: string; url: string; strong: boolean };
type PlaceOption = { kind: 'place'; placeId: string; main: string; secondary: string };
type RecentSearch =
  | { type: 'center'; label: string; sub: string; url: string }
  | { type: 'place'; label: string; sub: string; lat: number; lng: number; address: string };
type RecentOption = { kind: 'recent'; entry: RecentSearch };
type SuggestionOption = CenterOption | PlaceOption | RecentOption;

const RECENT_KEY = 'bk-recent-searches';
const MAX_RECENT = 5;

function readRecent(): RecentSearch[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function writeRecent(list: RecentSearch[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    // Private mode / storage blocked — recent searches are a convenience only
  }
}

function apiBasePath(): string {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/centers') ? '/centers' : '';
}

/** Bold the parts of `text` that start with one of the typed words */
function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return <>{text}</>;
  return (
    <>
      {text.split(/(\s+)/).map((word, i) => {
        const token = tokens.find((t) => word.toLowerCase().startsWith(t));
        return token ? (
          <span key={i}>
            <strong className="font-semibold text-neutral-900 dark:text-white">{word.slice(0, token.length)}</strong>
            {word.slice(token.length)}
          </span>
        ) : (
          <span key={i}>{word}</span>
        );
      })}
    </>
  );
}

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
  placeholder = 'Area, city, pincode or center',
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
  const [searchError, setSearchError] = useState<string | null>(null);
  const { isLoaded, loadError } = useGoogleMaps();
  // Known at build time — avoids flashing "API key missing" before the Maps hook runs
  const keyConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());
  // Text submitted with Enter before Google Maps finished loading
  const pendingQueryRef = useRef<string | null>(null);
  const onSearchResultRef = useRef(onSearchResult);
  onSearchResultRef.current = onSearchResult;

  // Suggestions dropdown (not used for isLocalSearch filter boxes)
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [typedQuery, setTypedQuery] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [centerOptions, setCenterOptions] = useState<CenterOption[]>([]);
  const [placeOptions, setPlaceOptions] = useState<PlaceOption[]>([]);
  const [suggestionsQuery, setSuggestionsQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  // One Places "session" per search (predictions + details), billed as a single request
  const sessionTokenRef = useRef<any>(null);
  
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
              } else if (!isLocalSearch) {
                // Show center/place suggestions for what was spoken
                setTypedQuery(finalTranscript);
                setSuggestionsOpen(true);
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
  
  // Enter was pressed while Maps was still loading → search now
  useEffect(() => {
    if (isLoaded && !isLocalSearch && pendingQueryRef.current) {
      const pending = pendingQueryRef.current;
      pendingQueryRef.current = null;
      geocodeText(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isLocalSearch]);

  useEffect(() => {
    if (!isLocalSearch) setRecentSearches(readRecent());
  }, [isLocalSearch]);

  // Fetch suggestions as the user types: centers (our API, no Google needed) + places (Google)
  useEffect(() => {
    if (isLocalSearch) return;
    const query = typedQuery.trim();
    if (query.length < 2) {
      setCenterOptions([]);
      setPlaceOptions([]);
      setSuggestionsQuery('');
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`${apiBasePath()}/api/centers/search?q=${encodeURIComponent(query)}&limit=5`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : { data: [] }))
        .then((json) => {
          if (cancelled) return;
          setCenterOptions((json.data || []).map((c: any) => ({ kind: 'center', ...c })));
          setSuggestionsQuery(query);
        })
        .catch(() => {});

      const places = window.google?.maps?.places;
      if (places?.AutocompleteService) {
        autocompleteServiceRef.current ??= new places.AutocompleteService();
        sessionTokenRef.current ??= new places.AutocompleteSessionToken();
        autocompleteServiceRef.current.getPlacePredictions(
          { input: query, componentRestrictions: { country: ['in', 'np'] }, sessionToken: sessionTokenRef.current },
          (predictions: any[] | null, status: string) => {
            if (cancelled) return;
            setPlaceOptions(
              status === 'OK' && predictions
                ? predictions.slice(0, 5).map((p) => ({
                    kind: 'place' as const,
                    placeId: p.place_id,
                    main: p.structured_formatting?.main_text || p.description,
                    secondary: p.structured_formatting?.secondary_text || '',
                  }))
                : []
            );
            setSuggestionsQuery(query);
          }
        );
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [typedQuery, isLocalSearch, isLoaded]);
  
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
  
  const emitResult = (lat: number, lng: number, address: string) => {
    if (onSearchResultRef.current) {
      onSearchResultRef.current(lat, lng, address);
    } else {
      // Navigate to results page with query params
      router.push(`/centers?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`);

      // Also update URL for shareability without page reload
      const url = `/centers?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`;
      window.history.pushState({ path: url }, '', url);
    }
  };

  // Typed text submitted without picking a suggestion (Enter) → geocode it
  const geocodeText = (text: string) => {
    const query = text.trim();
    if (!query || !window.google?.maps?.Geocoder) return;
    new window.google.maps.Geocoder().geocode(
      { address: query, region: 'in' },
      (results: any[] | null, status: string) => {
        const location = status === 'OK' ? results?.[0]?.geometry?.location : null;
        if (!location) {
          setSearchError(`No match for “${query}”. Try a city, area or pincode.`);
          return;
        }
        const address = results![0].formatted_address;
        setInputValue(address);
        CenterLocatorAnalytics.searchCenters(query, 0, 'text');
        emitResult(location.lat(), location.lng(), address);
      }
    );
  };

  const rememberSearch = (entry: RecentSearch) => {
    const next = [
      entry,
      ...readRecent().filter((r) => !(r.type === entry.type && r.label === entry.label)),
    ].slice(0, MAX_RECENT);
    writeRecent(next);
    setRecentSearches(next);
  };

  const clearRecentSearches = () => {
    writeRecent([]);
    setRecentSearches([]);
  };

  const closeSuggestions = () => {
    setSuggestionsOpen(false);
    setActiveIndex(-1);
  };

  // Typed text submitted without a suggestion → geocode it (queued until Maps loads)
  const submitText = (text: string) => {
    const query = text.trim();
    if (!query) return;
    if (window.google?.maps?.Geocoder) geocodeText(query);
    else pendingQueryRef.current = query;
  };

  const selectOption = (option: SuggestionOption) => {
    closeSuggestions();
    setSearchError(null);

    if (option.kind === 'center') {
      setInputValue(option.name);
      CenterLocatorAnalytics.searchCenters(typedQuery || option.name, 1, 'text');
      CenterLocatorAnalytics.viewCenter({ name: option.name });
      rememberSearch({ type: 'center', label: option.name, sub: option.area, url: option.url });
      router.push(option.url);
      return;
    }

    if (option.kind === 'recent') {
      const entry = option.entry;
      if (entry.type === 'center') {
        setInputValue(entry.label);
        router.push(entry.url);
      } else {
        setInputValue(entry.address);
        CenterLocatorAnalytics.searchCenters(entry.address, 0, 'location');
        emitResult(entry.lat, entry.lng, entry.address);
      }
      rememberSearch(entry);
      return;
    }

    // Google place → look up its coordinates (same session as the predictions)
    const places = window.google?.maps?.places;
    if (!places) {
      submitText(`${option.main} ${option.secondary}`);
      return;
    }
    placesServiceRef.current ??= new places.PlacesService(document.createElement('div'));
    placesServiceRef.current.getDetails(
      { placeId: option.placeId, fields: ['geometry', 'formatted_address'], sessionToken: sessionTokenRef.current },
      (place: any, status: string) => {
        sessionTokenRef.current = null; // session ends with the details request
        const location = status === 'OK' ? place?.geometry?.location : null;
        if (!location) {
          geocodeText(`${option.main}, ${option.secondary}`);
          return;
        }
        const address = place.formatted_address || [option.main, option.secondary].filter(Boolean).join(', ');
        setInputValue(address);
        CenterLocatorAnalytics.searchCenters(address, 0, 'location');
        rememberSearch({
          type: 'place',
          label: option.main,
          sub: option.secondary,
          lat: location.lat(),
          lng: location.lng(),
          address,
        });
        emitResult(location.lat(), location.lng(), address);
      }
    );
  };

  // Build the dropdown: recent searches for an empty box; otherwise centers and
  // places, with centers first only when the name itself matched ("Sampangirama")
  const queryForOptions = typedQuery.trim();
  const showRecent = queryForOptions.length < 2;
  const suggestionsCurrent = suggestionsQuery === queryForOptions;
  const centersFirst = centerOptions[0]?.strong === true;
  const sections: { title: string; options: SuggestionOption[] }[] = isLocalSearch
    ? []
    : showRecent
      ? [{ title: 'Recent searches', options: recentSearches.map((entry) => ({ kind: 'recent' as const, entry })) }]
      : suggestionsCurrent
        ? (centersFirst
            ? [{ title: 'Centers', options: centerOptions }, { title: 'Places', options: placeOptions }]
            : [{ title: 'Places', options: placeOptions }, { title: 'Centers', options: centerOptions }]
          ).filter((section) => section.options.length > 0)
        : [];
  const flatOptions = sections.flatMap((section) => section.options);
  const noMatches = !showRecent && suggestionsCurrent && flatOptions.length === 0;
  const dropdownVisible = suggestionsOpen && !isListening && (flatOptions.length > 0 || noMatches);

  // Position the dropdown under the input. It's portaled to <body> so parents
  // with overflow:hidden (heroes) can't clip it.
  useLayoutEffect(() => {
    if (!dropdownVisible) return;
    const update = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) setDropdownRect({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [dropdownVisible]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isLocalSearch) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestionsOpen(true);
      setActiveIndex((i) => Math.min(i + 1, flatOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      // Search fields clear their text on Escape in WebKit; only close the list
      e.preventDefault();
      closeSuggestions();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (dropdownVisible && activeIndex >= 0 && flatOptions[activeIndex]) {
        selectOption(flatOptions[activeIndex]);
      } else if (!showRecent && suggestionsCurrent && flatOptions[0]) {
        // Enter without picking → take the top suggestion
        selectOption(flatOptions[0]);
      } else {
        closeSuggestions();
        submitText(inputRef.current?.value || '');
      }
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
    } else if (!isLocalSearch) {
      setTypedQuery(newValue);
      setSuggestionsOpen(true);
      setActiveIndex(-1);
    }

    // Clear any error messages when user starts typing
    if (voiceError) setVoiceError(null);
    if (locationError) setLocationError(null);
    if (searchError) setSearchError(null);
  };
  
  // Handle input focus to clear error states
  const handleInputFocus = () => {
    if (!isLocalSearch) {
      // Empty box shows recent searches; a typed box shows its suggestions again
      setTypedQuery(inputRef.current?.value === value ? '' : inputRef.current?.value || '');
      setSuggestionsOpen(true);
    }
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
      <div className="relative flex-grow" ref={wrapperRef}>
        <input
          ref={inputRef}
          // A search field (not a plain text box) so Safari/iCloud Keychain and
          // password managers don't offer to AutoFill credentials here
          type="search"
          name="center-search"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          autoCorrect="off"
          spellCheck={false}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={() => !isLocalSearch && closeSuggestions()}
          onKeyDown={handleKeyDown}
          aria-label={placeholder}
          {...(!isLocalSearch && {
            role: 'combobox',
            'aria-autocomplete': 'list' as const,
            'aria-expanded': dropdownVisible,
            'aria-controls': listboxId,
            'aria-activedescendant': dropdownVisible && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined,
          })}
          aria-invalid={Boolean(searchError || locationError || voiceError) || undefined}
          enterKeyHint="search"
          autoComplete="off"
          className={`bk-search-input w-full p-4 ${(!disableVoiceInput && voiceSupported) ? 'pr-24' : 'pr-10'} rounded-lg border ${locationError || voiceError || searchError ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-neutral-600'} bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FF7F50] focus:border-transparent ${isListening ? 'animate-pulse-light' : ''}`}
          placeholder={
            voiceError
              ? "Error recognizing speech"
              : locationError
                ? "Location error"
                : isListening
                  ? "Listening..."
                  : (!keyConfigured && !isLocalSearch
                    ? "Location search unavailable (API key missing)"
                    : placeholder)
          }
          // Typing is allowed while Google Maps loads; Enter is queued until it's ready
          disabled={(!keyConfigured || !!loadError) && !isLocalSearch}
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
                disabled={(isLoading || !keyConfigured || !!loadError) && !isLocalSearch}
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-gray-500 dark:text-neutral-400" 
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
      
      {searchError && !isLocalSearch && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          {searchError}
        </p>
      )}

      {dropdownVisible && dropdownRect && typeof document !== 'undefined' && createPortal(
        <div
          // Keep focus in the input while clicking an option
          onMouseDown={(e) => e.preventDefault()}
          style={{ position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}
          className="z-[60] overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-left shadow-2xl"
        >
          <ul id={listboxId} role="listbox" aria-label="Search suggestions" className="max-h-[min(60vh,26rem)] overflow-y-auto py-1.5">
            {sections.map((section) => {
              const offset = flatOptions.indexOf(section.options[0]);
              return (
                <li key={section.title} role="presentation">
                  <div className="flex items-center justify-between px-4 pt-2 pb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {section.title}
                    </span>
                    {section.title === 'Recent searches' && (
                      <button
                        type="button"
                        onClick={clearRecentSearches}
                        className="text-[11px] font-medium text-neutral-400 hover:text-spirit-purple-600 dark:hover:text-spirit-purple-300"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <ul role="presentation">
                    {section.options.map((option, i) => {
                      const index = offset + i;
                      const isActive = index === activeIndex;
                      const title =
                        option.kind === 'center' ? option.name : option.kind === 'place' ? option.main : option.entry.label;
                      const subtitle =
                        option.kind === 'center' ? option.area : option.kind === 'place' ? option.secondary : option.entry.sub;
                      const Icon =
                        option.kind === 'recent' ? Clock : option.kind === 'center' ? Building2 : MapPin;
                      const isCenter = option.kind === 'center' || (option.kind === 'recent' && option.entry.type === 'center');
                      return (
                        <li
                          key={`${option.kind}-${index}-${title}`}
                          id={`${listboxId}-${index}`}
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => selectOption(option)}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${
                            isActive ? 'bg-spirit-purple-50 dark:bg-neutral-700/60' : ''
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              isCenter
                                ? 'bg-spirit-purple-100 text-spirit-purple-700 dark:bg-spirit-purple-900/40 dark:text-spirit-purple-300'
                                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300'
                            }`}
                            aria-hidden
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-neutral-700 dark:text-neutral-200">
                              {option.kind === 'recent' ? title : <Highlight text={title} query={queryForOptions} />}
                            </span>
                            {subtitle && (
                              <span className="block truncate text-xs text-neutral-400 dark:text-neutral-500">{subtitle}</span>
                            )}
                          </span>
                          {isCenter && (
                            <span className="hidden sm:inline-block shrink-0 rounded-full bg-spirit-purple-50 dark:bg-spirit-purple-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-spirit-purple-700 dark:text-spirit-purple-300">
                              Center
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
            {noMatches && (
              <li role="presentation" className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                No matching centers or places. Press Enter to search for “{queryForOptions}”.
              </li>
            )}
          </ul>
          {placeOptions.length > 0 && !showRecent && (
            <div className="flex justify-end border-t border-neutral-100 dark:border-neutral-700 px-3 py-1.5">
              {/* Required attribution for Google place predictions */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png"
                alt="Powered by Google"
                className="h-[14px] w-auto dark:hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-non-white3_hdpi.png"
                alt="Powered by Google"
                className="hidden h-[14px] w-auto dark:block"
              />
            </div>
          )}
        </div>,
        document.body
      )}

      {!keyConfigured && !isLocalSearch && (
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