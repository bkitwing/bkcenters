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

type StateSummary = {
  state: string;
  centerCount: number;
  districtCount: number;
};

type SortOption = 'alpha' | 'centers';
type ViewMode = 'list' | 'map';

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [nearestCenters, setNearestCenters] = useState<(Center & { distance?: number })[]>([]);
  const [allNearestCenters, setAllNearestCenters] = useState<(Center & { distance?: number })[]>([]);
  const [statesSummary, setStatesSummary] = useState<StateSummary[]>([]);
  const [allCenters, setAllCenters] = useState<Center[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [regionDetails, setRegionDetails] = useState<{name: string; stateCount: number; centerCount: number}[]>([]);
  const [regionToStates, setRegionToStates] = useState<RegionStateMapping>({});
  const [sortBy, setSortBy] = useState<SortOption>('centers');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [displayLimit, setDisplayLimit] = useState<number>(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

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
  
  // Get sorted states based on sort option
  const getSortedStates = (): StateSummary[] => {
    if (sortBy === 'alpha') {
      return [...statesSummary].sort((a, b) => a.state.localeCompare(b.state));
    } else {
      return [...statesSummary].sort((a, b) => b.centerCount - a.centerCount);
    }
  };
  
  // Handle search result from SearchBar component
  const handleSearchResult = (latitude: number, longitude: number, searchedAddress: string) => {
    setLat(latitude);
    setLng(longitude);
    setAddress(searchedAddress);
    
    // Update URL with search parameters
    router.push(`/?lat=${latitude}&lng=${longitude}&address=${encodeURIComponent(searchedAddress)}`);
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
    if (center.coords && center.coords.length === 2) {
      const [lat, lng] = center.coords.map(parseFloat);
      
      if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
        // Set selected center for highlighting
        setSelectedCenter(center);
        
        // Get the map instance - this depends on your map implementation
        // For Google Maps, you can use something like:
        // mapRef.current.panTo({ lat, lng });
        // mapRef.current.setZoom(14);
        
        // Scroll to the map if necessary
        mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      // Set total centers from all centers
      setTotalCenters(allCenters.length);
    }, [allCenters.length]);
    
    return (
      <div className="stats-bar bg-white p-4 rounded-lg shadow-md flex flex-wrap justify-around items-center gap-4 mb-6">
        <div className="stat text-center">
          <div className="stat-value text-primary text-xl">{totalCenters.toLocaleString()}</div>
          <div className="stat-label text-neutral-600">Total Centers</div>
        </div>
        <div className="stat text-center">
          <div className="stat-value text-secondary text-xl">{statesSummary.length}</div>
          <div className="stat-label text-neutral-600">States</div>
        </div>
        <div className="stat text-center">
          <div className="stat-value text-accent text-xl">{regionDetails.length}</div>
          <div className="stat-label text-neutral-600">Regions</div>
        </div>
        <div className="stat text-center">
          <div className="stat-value text-spirit-gold-500 text-xl">{retreatCenters}</div>
          <div className="stat-label text-neutral-600">
            <Link href="/retreat" className="hover:text-primary-focus hover:underline">
              Retreat Centers
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
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">Find Brahma Kumaris Meditation Centers</h1>
      
      <SearchBar onSearchResult={handleSearchResult} />
      
      {/* Stats summary bar */}
      <StatsSummary />
      
      {lat && lng ? (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Meditation Centers Near {address}</h2>
          
          <div className="mb-4">
            <label htmlFor="distance-slider" className="block mb-2 text-sm font-medium text-neutral-700">
              Maximum Distance: {maxDistance} km
            </label>
            <input
              id="distance-slider"
              type="range"
              min="5"
              max="100"
              step="5"
              value={maxDistance}
              onChange={handleDistanceChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/2 rounded-lg overflow-hidden bg-white p-2 shadow-md h-[500px]" ref={mapRef}>
              <CenterMap 
                centers={nearestCenters}
                onCenterSelect={handleCenterSelect}
                initialLat={lat}
                initialLng={lng}
                initialZoom={10}
                autoZoom={false}
                highlightCenter={true}
              />
            </div>
            
            <div className="lg:w-1/2 flex flex-col">
              <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">
                    {nearestCenters.length} centers found within {maxDistance}km
                  </h3>
                </div>
              </div>
              
              <div 
                className="flex-1 overflow-y-auto bg-white rounded-lg shadow-md p-2 h-[400px]"
                ref={resultsContainerRef}
              >
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : nearestCenters.length > 0 ? (
                  <>
                    <div className="grid gap-4">
                      {nearestCenters.map((center) => (
                        <div
                          key={center.branch_code}
                          id={`center-card-${center.branch_code}`}
                          className={`transition-colors duration-300 ${selectedCenter?.branch_code === center.branch_code ? 'bg-primary-50' : ''}`}
                          onClick={() => handleCardClick(center)}
                        >
                          <CenterCard 
                            center={center}
                            distance={center.distance}
                            showDistance={true}
                          />
                        </div>
                      ))}
                      {/* Sentinel element for lazy loading */}
                      {nearestCenters.length < allNearestCenters.filter(c => 
                        typeof c.distance === 'number' && c.distance <= maxDistance
                      ).length && (
                        <div id="lazy-load-sentinel" className="h-4">
                          {loadingMore && (
                            <div className="flex justify-center p-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <p className="text-lg text-neutral-600 mb-2">No centers found within {maxDistance}km</p>
                    <p className="text-sm text-neutral-500">Try increasing the distance or searching in a different location</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div className="view-controls mb-4 flex justify-end">
            <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
              <button 
                className={`px-3 py-1 rounded-md ${viewMode === 'list' ? 'bg-primary text-white' : 'text-primary'}`}
                onClick={() => handleViewModeChange('list')}
              >
                List
              </button>
              <button 
                className={`px-3 py-1 rounded-md ${viewMode === 'map' ? 'bg-primary text-white' : 'text-primary'}`}
                onClick={() => handleViewModeChange('map')}
              >
                Map
              </button>
            </div>
          </div>
          
          {viewMode === 'map' ? (
            <div className="rounded-lg overflow-hidden bg-white p-2 shadow-md h-[600px]" ref={mapRef}>
              <CenterMap 
                centers={stateMapMarkers}
                initialZoom={5}
                initialLat={20.5937}
                initialLng={78.9629}
                onCenterSelect={handleCenterSelect}
                autoZoom={true}
              />
            </div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Browse by Region and State</h3>
                  <div className="sort-controls inline-flex bg-gray-100 rounded-md p-1">
                    <button 
                      className={`px-3 py-1 text-sm rounded-md ${sortBy === 'centers' ? 'bg-white shadow-sm' : ''}`}
                      onClick={() => handleSortChange('centers')}
                    >
                      Most Centers
                    </button>
                    <button 
                      className={`px-3 py-1 text-sm rounded-md ${sortBy === 'alpha' ? 'bg-white shadow-sm' : ''}`}
                      onClick={() => handleSortChange('alpha')}
                    >
                      Alphabetical
                    </button>
                  </div>
                </div>
              </div>
              
              {regionDetails.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 text-neutral-700">Regions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {regionDetails
                      .sort((a, b) => b.centerCount - a.centerCount)
                      .map(region => (
                        <Link 
                          href={`/${region.name.toLowerCase()}`} 
                          key={region.name}
                          className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                          <h4 className="font-medium text-primary mb-1">{region.name}</h4>
                          <p className="text-sm text-neutral-600">
                            {region.centerCount.toLocaleString()} centers in {region.stateCount} states
                          </p>
                        </Link>
                      ))
                    }
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getSortedStates().map(state => {
                  const region = getRegionForStateLocal(state.state);
                  return (
                    <Link 
                      href={formatCenterUrl(region, state.state)}
                      key={state.state}
                      className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-primary">{state.state}</h3>
                          <p className="text-sm text-neutral-600">
                            {state.centerCount} centers, {state.districtCount} districts
                          </p>
                        </div>
                        <span className="bg-primary-50 text-primary text-xs px-2 py-1 rounded-full">
                          {region}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
