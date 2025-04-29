'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  getStatesSummary, 
  getNearestCenters, 
  getAllCenters, 
  getRegions, 
  getRegionForState,
  getRegionsWithDetails,
  getRegionToStateMapping,
  getStatesByRegionFast,
  reinitializeDataMappings,
  getRetreatCenters
} from '@/lib/centerData';
import SearchBar from '@/components/SearchBar';
import CenterCard from '@/components/CenterCard';
import CenterMap from '@/components/CenterMap';
import { Center, RegionStateMapping } from '@/lib/types';
import { formatCenterUrl } from '@/lib/urlUtils';
import { Loader } from '@googlemaps/js-api-loader';

// Declare the google namespace globally
declare global {
  interface Window {
    google: any; // Using any since we can't reference google namespace before it's loaded
  }
}

type StateSummary = {
  state: string;
  centerCount: number;
  districtCount: number;
};

type SortOption = 'alpha' | 'centers';
type ViewMode = 'list' | 'map';

interface MapRef extends HTMLDivElement {
  map?: google.maps.Map;
}

const defaultZoom = 12;
const markers = new Map<string, google.maps.Marker>();

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; } | undefined>(undefined);
  const [nearestCenters, setNearestCenters] = useState<(Center & { distance?: number })[]>([]);
  const [allNearestCenters, setAllNearestCenters] = useState<(Center & { distance?: number })[]>([]);
  const [statesSummary, setStatesSummary] = useState<StateSummary[]>([]);
  const [allCenters, setAllCenters] = useState<Center[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [regionDetails, setRegionDetails] = useState<{name: string; stateCount: number; centerCount: number}[]>([]);
  const [regionToStates, setRegionToStates] = useState<RegionStateMapping>({});
  const [sortBy, setSortBy] = useState<SortOption>('centers');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [regionViewMode, setRegionViewMode] = useState<ViewMode>('list');
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [displayLimit, setDisplayLimit] = useState<number>(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const mapRef = useRef<MapRef>(null);
  const regionMapRef = useRef<HTMLDivElement>(null);

  // Get summarized center data for map markers
  const stateMapMarkers = useMemo(() => {
    return statesSummary.map(state => {
      // Find a center in this state to use as reference point
      const stateCenter = allCenters.find(center => center.state === state.state);
      
      if (stateCenter && stateCenter.coords && stateCenter.coords.length === 2) {
        // Create a summary center object for the state
        return {
          ...stateCenter,
          name: state.state,
          description: `${state.centerCount} meditation ${state.centerCount === 1 ? 'center' : 'centers'}`,
          summary: `${state.centerCount} ${state.centerCount === 1 ? 'center' : 'centers'} across ${state.districtCount} districts`,
          district_total: state.centerCount,
          is_district_summary: true,
          is_state_summary: true,
          // Keep the actual region from the center data
          region: stateCenter.region
        };
      }
      return null;
    }).filter(Boolean) as Center[];
  }, [statesSummary, allCenters]);

  useEffect(() => {
    async function fetchStates() {
      try {
        // Set URL parameters if available
        const latParam = searchParams.get('lat');
        const lngParam = searchParams.get('lng');
        const addressParam = searchParams.get('address');

        if (latParam && lngParam) {
          setLat(parseFloat(latParam));
          setLng(parseFloat(lngParam));
        }

        if (addressParam) {
          setAddress(addressParam);
        }

        // Load data using the new optimized mapping structure
        const [
          summary, 
          centers, 
          availableRegions, 
          regionsWithDetails,
          regionStateMapping
        ] = await Promise.all([
          getStatesSummary(),
          getAllCenters(),
          getRegions(),
          getRegionsWithDetails(),
          getRegionToStateMapping()
        ]);
        
        setStatesSummary(summary);
        setAllCenters(centers);
        setRegions(availableRegions);
        setRegionDetails(regionsWithDetails);
        setRegionToStates(regionStateMapping);
        
        // If no regions found or empty regions, reinitialize the data
        if (regionsWithDetails.length === 0 || Object.keys(regionStateMapping).length === 0) {
          console.log("No regions found, attempting to reinitialize data mappings...");
          const success = await reinitializeDataMappings();
          
          if (success) {
            // Load the data again after reinitialization
            const [
              updatedRegionsWithDetails,
              updatedRegionStateMapping
            ] = await Promise.all([
              getRegionsWithDetails(),
              getRegionToStateMapping()
            ]);
            
            setRegionDetails(updatedRegionsWithDetails);
            setRegionToStates(updatedRegionStateMapping);
            console.log(`Data reinitialized. Found ${Object.keys(updatedRegionStateMapping).length} regions`);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching states:', error);
        setLoading(false);
      }
    }

    fetchStates();
  }, [searchParams]);

  // Fetch nearest centers when lat/lng change
  useEffect(() => {
    async function fetchCenters() {
      if (lat && lng) {
        setLoading(true);
        try {
          // Fetch up to 150 centers instead of 100
          const centers = await getNearestCenters(lat, lng, 150);
          setAllNearestCenters(centers);
          
          // Apply distance filter
          const filteredCenters = centers.filter(c => 
            typeof c.distance === 'number' && c.distance <= maxDistance
          );
          
          // Initial set of centers
          setNearestCenters(filteredCenters.slice(0, 10));
          setDisplayLimit(10);
        } catch (error) {
          console.error('Error fetching nearest centers:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchCenters();
  }, [lat, lng, maxDistance]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!resultsContainerRef.current) return;
    
    const options = {
      root: resultsContainerRef.current,
      rootMargin: '100px',
      threshold: 0.1
    };
    
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loadingMore) {
        const filteredCenters = allNearestCenters.filter(c => 
          typeof c.distance === 'number' && c.distance <= maxDistance
        );
        
        if (nearestCenters.length < filteredCenters.length) {
          setLoadingMore(true);
          
          // Save the current scroll position
          const scrollContainer = resultsContainerRef.current;
          const scrollPosition = scrollContainer?.scrollTop;
          
          // Pre-calculate the next batch of centers to prevent flickering
          const nextBatchSize = 10;
          const nextCenters = [...nearestCenters, ...filteredCenters.slice(nearestCenters.length, nearestCenters.length + nextBatchSize)];
          
          // Update centers with the combined array to prevent re-renders
          setNearestCenters(nextCenters);
          
          // Restore scroll position after state update
          requestAnimationFrame(() => {
            if (scrollContainer && scrollPosition !== undefined) {
              scrollContainer.scrollTop = scrollPosition;
            }
            setLoadingMore(false);
          });
        }
      }
    };
    
    const observer = new IntersectionObserver(handleIntersect, options);
    
    // Target the sentinel element
    const sentinel = document.getElementById('lazy-load-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }
    
    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
      observer.disconnect();
    };
  }, [nearestCenters, allNearestCenters, maxDistance, loadingMore]);

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
  };
  
  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };
  
  // Handle region view mode change
  const handleRegionViewModeChange = (mode: ViewMode) => {
    setRegionViewMode(mode);
  };
  
  // Handle region selection
  const handleRegionSelect = (regionName: string) => {
    setActiveRegion(activeRegion === regionName ? null : regionName);
  };
  
  // Get sorted states based on sort option
  const getSortedStates = (): StateSummary[] => {
    if (sortBy === 'alpha') {
      return [...statesSummary].sort((a, b) => a.state.localeCompare(b.state));
    } else {
      return [...statesSummary].sort((a, b) => b.centerCount - a.centerCount);
    }
  };
  
  // Function to scroll to search results
  const scrollToSearchResults = useCallback(() => {
    if (searchResultsRef.current) {
      searchResultsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  // Handle search result from SearchBar component
  const handleSearchResult = (latitude: number, longitude: number, searchedAddress: string) => {
    setLat(latitude);
    setLng(longitude);
    setAddress(searchedAddress);
    
    // Set user location if the search is from current location
    if (searchedAddress === "Your Current Location") {
      setUserLocation({ lat: latitude, lng: longitude });
    } else {
      setUserLocation(undefined);
    }
    
    // Update URL with search parameters
    router.push(`/?lat=${latitude}&lng=${longitude}&address=${encodeURIComponent(searchedAddress)}`);

    // Add a small delay to ensure the search results are rendered before scrolling
    setTimeout(scrollToSearchResults, 100);
  };
  
  // Handle location button click
  const handleCurrentLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleSearchResult(latitude, longitude, "Your Current Location");
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your current location. Please try the search box instead.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser. Please use the search box.");
    }
  };
  
  // Handle clear search
  const handleClearSearch = () => {
    setLat(null);
    setLng(null);
    setAddress('');
    setUserLocation(undefined);
    setNearestCenters([]);
    setAllNearestCenters([]);
    router.push('/');
  };
  
  // Handle center selection on map
  const handleCenterSelect = (center: Center) => {
    setSelectedCenter(center);
    
    // Scroll to the center in the list of results if possible
    if (resultsContainerRef.current && nearestCenters.some(c => c.branch_code === center.branch_code)) {
      const centerElement = document.getElementById(`center-card-${center.branch_code}`);
      if (centerElement) {
        resultsContainerRef.current.scrollTop = centerElement.offsetTop - 100;
        centerElement.classList.add('highlight-card');
        setTimeout(() => {
          centerElement.classList.remove('highlight-card');
        }, 2000);
      }
    }
    
    // If this is a state summary marker, navigate to state page
    if (center.is_state_summary && center.name) {
      // Get the region for this state (using the center's region directly)
      const region = center.region || 'INDIA';
      router.push(formatCenterUrl(region, center.name));
    }
  };
  
  // Handle card click to center map
  const handleCardClick = (center: Center) => {
    // Set selected center for highlighting
    setSelectedCenter(center);
    
    if (center.coords && center.coords.length === 2) {
      const [lat, lng] = center.coords.map(parseFloat);
      
      if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
        // If map element available, scroll it into view on mobile
        if (window.innerWidth < 768 && mapRef.current) {
          mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Add visual feedback to the clicked card
        const centerElement = document.getElementById(`center-card-${center.branch_code}`);
        if (centerElement) {
          // Add highlight effect temporarily
          centerElement.classList.add('highlight-card');
          
          // Remove the highlight after animation completes
          setTimeout(() => {
            centerElement.classList.remove('highlight-card');
          }, 1500);
        }
        
        // Center the map on the selected marker with animation
        const marker = markers.get(center.branch_code);
        if (marker) {
          // Apply bounce animation to the marker
          marker.setAnimation(google.maps.Animation.BOUNCE);
          
          // Stop animation after 1.5 seconds
          setTimeout(() => {
            marker.setAnimation(null);
          }, 1500);
          
          // Pan to marker location
          mapRef.current.map?.panTo({ lat, lng });
          
          // Zoom in slightly if we're zoomed out too far
          const currentZoom = mapRef.current.map?.getZoom() || defaultZoom;
          if (currentZoom < 14) {
            mapRef.current.map?.setZoom(14);
          }
        }
      }
    }
  };
  
  // Helper function to get region for a state from loaded data
  const getRegionForStateLocal = (stateName: string): string => {
    // First try to find in region to state mapping
    for (const [region, data] of Object.entries(regionToStates)) {
      if (data.states[stateName]) {
        return region;
      }
    }
    
    // Fallback to individual lookup
    const center = allCenters.find(c => c.state === stateName);
    if (center?.region) {
      return center.region;
    }
    
    return 'INDIA';
  };
  
  // Component for displaying statistics summary
  const StatsSummary = () => {
    const [totalCenters, setTotalCenters] = useState<number>(0);
    const [retreatCenters, setRetreatCenters] = useState<number>(0);
    
    // Fetch retreat centers count on component mount
    useEffect(() => {
      async function fetchRetreatCentersCount() {
        try {
          const centers = await getRetreatCenters();
          setRetreatCenters(centers.length);
        } catch (err) {
          console.error("Failed to load retreat centers:", err);
        }
      }
      
      fetchRetreatCentersCount();
      setTotalCenters(allCenters.length);
    }, [allCenters.length]);
    
    return (
      <div className="stats-bar bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="stat bg-neutral-50 p-3 rounded-lg text-center flex flex-col justify-center items-center min-h-[80px]">
            <div className="stat-value text-primary text-lg sm:text-xl font-bold">{totalCenters.toLocaleString()}</div>
            <div className="stat-label text-neutral-600 text-xs sm:text-sm">Total Centers</div>
          </div>
          <div className="stat bg-neutral-50 p-3 rounded-lg text-center flex flex-col justify-center items-center min-h-[80px]">
            <div className="stat-value text-secondary text-lg sm:text-xl font-bold">{statesSummary.length}</div>
            <div className="stat-label text-neutral-600 text-xs sm:text-sm">States</div>
          </div>
          <div className="stat bg-neutral-50 p-3 rounded-lg text-center flex flex-col justify-center items-center min-h-[80px]">
            <div className="stat-value text-accent text-lg sm:text-xl font-bold">{regionDetails.length}</div>
            <div className="stat-label text-neutral-600 text-xs sm:text-sm">Regions</div>
          </div>
          <div className="stat bg-neutral-50 p-3 rounded-lg text-center flex flex-col justify-center items-center min-h-[80px]">
            <Link href="/retreat" className="hover:opacity-90 transition-opacity">
              <div className="stat-value text-spirit-gold-500 text-lg sm:text-xl font-bold">{retreatCenters}</div>
              <div className="stat-label text-neutral-600 text-xs sm:text-sm hover:text-primary-focus">
                Retreat Centers
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  };
  
  // Handle distance slider change
  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setMaxDistance(value);
    }
  };
  
  // Get sorted regions based on sort option
  const getSortedRegions = (): {name: string; stateCount: number; centerCount: number}[] => {
    if (sortBy === 'alpha') {
      return [...regionDetails].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return [...regionDetails].sort((a, b) => b.centerCount - a.centerCount);
    }
  };
  
  return (
    <main className="container mx-auto px-4 py-8">
      
      {/* Search Bar - First on the page */}
      <div className="bg-light rounded-lg shadow-md p-4 sm:p-8 border border-neutral-200 mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center spiritual-text-gradient">Find a Center Near You</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <SearchBar 
              onSearchResult={handleSearchResult} 
              value={address}
              onClear={handleClearSearch}
              showClearButton={!!lat && !!lng}
            />
          </div>
          <button 
            onClick={handleCurrentLocationClick}
            className="bg-primary hover:bg-primary-focus text-white font-medium px-4 py-2 rounded-md text-sm sm:text-base flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Current Location
          </button>
        </div>
      </div>
      
      {/* Only show Statistics Summary when not searching */}
      {!lat || !lng ? <StatsSummary /> : null}
      
      {/* Search Results (if user has searched) */}
      {lat && lng ? (
        <div ref={searchResultsRef} className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <div className="flex items-center">
              <h2 className="text-sm font-medium mb-4 text-spirit-blue-700">Centers Near {address}</h2>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="flex items-center flex-1 sm:flex-auto">
                <label htmlFor="distance-filter" className="text-sm text-neutral-600 mr-2">Distance:</label>
                <input 
                  id="distance-filter"
                  type="range" 
                  min="5" 
                  max="100" 
                  step="5" 
                  value={maxDistance} 
                  onChange={handleDistanceChange}
                  className="w-full sm:w-32"
                />
                <span className="text-sm text-neutral-600 ml-2 whitespace-nowrap">{maxDistance} km</span>
              </div>
            </div>
          </div>
          
          {/* Modified layout - Map first on both mobile and desktop */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 mb-6">
            {/* Map container - full width on mobile with 40% height, sticky on desktop */}
            <div className="order-1 md:col-span-6 md:sticky md:top-4 md:self-start h-[40vh] sm:h-[45vh] md:h-[calc(100vh-32px)]">
              <div ref={mapRef} className="bg-light rounded-lg shadow-md border border-neutral-200 overflow-hidden h-full">
                <div className="h-full w-full">
                  <CenterMap 
                    centers={nearestCenters} 
                    autoZoom={nearestCenters.length > 0}
                    onCenterSelect={handleCenterSelect}
                    highlightCenter={true}
                    showInfoWindowOnLoad={false}
                    height="100%"
                    selectedCenter={selectedCenter}
                    userLocation={userLocation}
                  />
                </div>
              </div>
            </div>
            
            {/* Centers list - full width on mobile, 6 columns on desktop */}
            <div className="order-2 md:col-span-6 bg-light rounded-lg shadow-md border border-neutral-200 p-4 centers-list-container">
              <div ref={resultsContainerRef} className="h-[50vh] sm:h-[55vh] md:h-[calc(100vh-64px)] overflow-y-auto pr-2">
                {nearestCenters.length > 0 ? (
                  <>
                    <h3 className="text-xl font-medium mb-4 text-spirit-blue-700">Found {nearestCenters.length} centers near you</h3>
                    <div className="space-y-3">
                      {nearestCenters.map((center) => (
                        <div 
                          key={center.branch_code}
                          id={`center-card-${center.branch_code}`}
                          onClick={() => handleCardClick(center)}
                          className={`cursor-pointer rounded-lg transition-all duration-200 ${
                            selectedCenter?.branch_code === center.branch_code 
                              ? 'shadow-md bg-spirit-blue-50' 
                              : 'hover:shadow-sm hover:bg-neutral-50'
                          }`}
                        >
                          <CenterCard 
                            center={center} 
                            distance={center.distance}
                            showDistance={true}
                          />
                        </div>
                      ))}
                    </div>
                    {/* Sentinel element for intersection observer */}
                    <div id="lazy-load-sentinel" className="h-4"></div>
                    {/* Loading indicator */}
                    {loadingMore && (
                      <div className="text-center py-4">
                        <div className="animate-pulse text-neutral-400">Loading more centers...</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-neutral-600">No Centers Found</h3>
                    <p className="text-sm sm:text-base text-neutral-500">
                      We couldn't find any meditation centers within {maxDistance} km of your location.
                    </p>
                    <button 
                      onClick={() => setMaxDistance(prev => Math.min(prev + 20, 100))}
                      className="mt-4 text-primary hover:underline"
                    >
                      Try increasing the distance filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Regions Section with State Cards - Only shown when not searching */
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <div className="flex flex-wrap gap-2">
              <div className="flex space-x-1 bg-light rounded-md border border-neutral-200">
                <button 
                  onClick={() => handleSortChange('centers')}
                  className={`px-2 py-1 text-xs sm:text-sm ${sortBy === 'centers' ? 'bg-primary text-white rounded-md' : 'text-neutral-600'}`}
                >
                  By Centers
                </button>
                <button 
                  onClick={() => handleSortChange('alpha')}
                  className={`px-2 py-1 text-xs sm:text-sm ${sortBy === 'alpha' ? 'bg-primary text-white rounded-md' : 'text-neutral-600'}`}
                >
                  Alphabetical
                </button>
              </div>
              
              <div className="flex space-x-1 bg-light rounded-md border border-neutral-200">
                <button 
                  onClick={() => handleRegionViewModeChange('list')}
                  className={`px-2 py-1 text-xs sm:text-sm flex items-center ${regionViewMode === 'list' ? 'bg-primary text-white rounded-md' : 'text-neutral-600'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  List
                </button>
                <button 
                  onClick={() => handleRegionViewModeChange('map')}
                  className={`px-2 py-1 text-xs sm:text-sm flex items-center ${regionViewMode === 'map' ? 'bg-primary text-white rounded-md' : 'text-neutral-600'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Map
                </button>
              </div>
            </div>
          </div>
          
          {regionViewMode === 'list' ? (
            <>
              {getSortedRegions().map(region => (
                <div key={region.name} className="mb-8">
                  <div className="flex items-center mb-4">
                    <h3 className="text-xl font-bold text-spirit-blue-700">{region.name}</h3>
                    <div className="ml-3 bg-spirit-blue-100 text-spirit-blue-800 text-xs font-medium rounded-full px-2.5 py-0.5">
                      {region.stateCount} States/UT
                    </div>
                    <div className="ml-2 bg-primary text-white text-xs font-medium rounded-full px-2.5 py-0.5">
                      {region.centerCount} Centers
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {regionToStates[region.name] && Object.keys(regionToStates[region.name].states)
                      .sort((a, b) => {
                        if (sortBy === 'alpha') {
                          return a.localeCompare(b);
                        } else {
                          const stateA = statesSummary.find(s => s.state === a);
                          const stateB = statesSummary.find(s => s.state === b);
                          return (stateB?.centerCount || 0) - (stateA?.centerCount || 0);
                        }
                      })
                      .map(stateName => {
                        const stateData = statesSummary.find(s => s.state === stateName);
                        return (
                          <Link
                            key={stateName}
                            href={formatCenterUrl(region.name, stateName)}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-neutral-200 p-3 sm:p-4 block"
                          >
                            <h4 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 text-neutral-800 line-clamp-2">{stateName}</h4>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-spirit-blue-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span className="text-neutral-700">{stateData?.districtCount || 0} Districts</span>
                              </div>
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-neutral-700">{stateData?.centerCount || 0} Centers</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="bg-light rounded-lg shadow-md border border-neutral-200 overflow-hidden">
              <div ref={regionMapRef} className="h-[500px] sm:h-[600px]">
                <CenterMap 
                  centers={stateMapMarkers} 
                  autoZoom={false}
                  onCenterSelect={handleCenterSelect}
                  height="100%"
                  defaultZoom={5}
                  initialLat={20.5937}
                  initialLng={78.9629}
                  initialZoom={5}
                />
              </div>
              <div className="p-4 bg-white border-t border-neutral-200">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {getSortedRegions().map(region => (
                    <div key={region.name} className="border border-neutral-200 rounded-md overflow-hidden">
                      <div className="bg-spirit-blue-700 text-white text-sm font-medium p-2 text-center">
                        {region.name}
                      </div>
                      <div className="p-2">
                        <div className="grid grid-cols-2 gap-1 text-center">
                          {Object.keys(regionToStates[region.name]?.states || {}).slice(0, 4).map(state => (
                            <Link 
                              key={state} 
                              href={formatCenterUrl(region.name, state)}
                              className="text-xs truncate hover:text-primary hover:underline"
                              title={state}
                            >
                              {state.length > 10 ? state.substring(0, 9) + '...' : state}
                            </Link>
                          ))}
                          {Object.keys(regionToStates[region.name]?.states || {}).length > 4 && (
                            <Link
                              href={formatCenterUrl(region.name)}
                              className="text-xs text-primary col-span-2 hover:underline"
                            >
                              + {Object.keys(regionToStates[region.name]?.states || {}).length - 4} more
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
