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
  reinitializeDataMappings
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

export default function CentersPage() {
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

  const handleSearchResult = (latitude: number, longitude: number, searchedAddress: string) => {
    setLat(latitude);
    setLng(longitude);
    setAddress(searchedAddress);
    
    // Update URL for shareability without page reload
    const url = `/centers?lat=${latitude}&lng=${longitude}&address=${encodeURIComponent(searchedAddress)}`;
    window.history.pushState({ path: url }, '', url);
  };

  const handleCenterSelect = (center: Center) => {
    // Handle state selection from map
    if (center.is_state_summary) {
      // Use the center's actual region from data
      window.location.href = formatCenterUrl(center.region, center.state);
      return;
    }
    
    // Scroll to the corresponding card in the list (for nearest centers)
    const element = document.getElementById(`center-${center.branch_code}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-yellow-50');
      setTimeout(() => {
        element.classList.remove('bg-yellow-50');
      }, 2000);
    }
  };
  
  // Get actual region for a state from centers data
  const getRegionForStateLocal = (stateName: string): string => {
    // Find a center in this state to get its region
    const stateCenter = allCenters.find(center => center.state === stateName);
    return stateCenter?.region || 'INDIA';
  };

  const sortedStates = getSortedStates();

  // Group states by region
  const statesByRegion: Record<string, StateSummary[]> = {};
  sortedStates.forEach(state => {
    const region = getRegionForStateLocal(state.state);
    if (!statesByRegion[region]) {
      statesByRegion[region] = [];
    }
    statesByRegion[region].push(state);
  });
  
  // Modify the Stats summary to show more accurate information
  const StatsSummary = () => {
    const totalCenters = regionDetails.reduce((sum, region) => sum + region.centerCount, 0);
    const totalStates = statesSummary.length;
    const totalRegions = regionDetails.length;
    
    return (
      <div className="bg-light rounded-lg shadow-md p-4 mb-6 border border-neutral-200">
        <h3 className="font-semibold text-lg mb-3 text-primary">Meditation Centers Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-spirit-purple-50 p-3 rounded-lg border border-spirit-purple-100">
            <div className="text-primary text-2xl font-bold">{totalCenters}</div>
            <div className="text-neutral-600 text-sm">Total Centers</div>
          </div>
          <div className="bg-spirit-blue-50 p-3 rounded-lg border border-spirit-blue-100">
            <div className="text-secondary text-2xl font-bold">{totalRegions}</div>
            <div className="text-neutral-600 text-sm">Country</div>
          </div>
          <div className="bg-spirit-teal-50 p-3 rounded-lg border border-spirit-teal-100">
            <div className="text-secondary text-2xl font-bold">{totalStates}</div>
            <div className="text-neutral-600 text-sm">States & UT</div>
          </div>
          <div className="bg-spirit-gold-50 p-3 rounded-lg border border-spirit-gold-100">
            <div className="text-accent text-2xl font-bold">
              {statesSummary.reduce((sum, state) => sum + state.districtCount, 0)}
            </div>
            <div className="text-neutral-600 text-sm">Districts</div>
          </div>
        </div>
      </div>
    );
  };

  // Handle distance filter change
  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDistance = Number(e.target.value);
    setMaxDistance(newDistance);
    
    // Apply the new distance filter smoothly
    const filteredCenters = allNearestCenters.filter(c => 
      typeof c.distance === 'number' && c.distance <= newDistance
    );
    
    // Preserve scroll position by keeping the same centers if possible
    if (filteredCenters.length > 0) {
      setNearestCenters(filteredCenters.slice(0, 10));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center spiritual-text-gradient">Find Meditation Centers</h1>
      
      <div className="mb-8 max-w-2xl mx-auto">
        <SearchBar onSearchResult={handleSearchResult} />
        
        {lat && lng && (
          <div className="mt-4 px-2">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="distance-slider" className="text-sm font-medium text-gray-700">
                Max Distance: {maxDistance} km
              </label>
              <span className="text-xs text-gray-500">
                {allNearestCenters.filter(c => typeof c.distance === 'number' && c.distance <= maxDistance).length} centers found
              </span>
            </div>
            <input 
              id="distance-slider"
              type="range" 
              min="5" 
              max="150" 
              step="5"
              value={maxDistance}
              onChange={handleDistanceChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {lat && lng && nearestCenters.length > 0 ? (
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-4 text-spirit-teal-600">Nearest Centers to {address}</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <CenterMap 
                    centers={nearestCenters} 
                    initialLat={lat} 
                    initialLng={lng}
                    onCenterSelect={handleCenterSelect}
                  />
                </div>
                
                <div 
                  ref={resultsContainerRef}
                  className="space-y-4 max-h-[500px] overflow-y-auto pr-2 relative"
                >
                  {nearestCenters.map((center) => (
                    <div key={center.branch_code} id={`center-${center.branch_code}`} className="transition-colors duration-300">
                      <CenterCard center={center} distance={center.distance} showDistance={true} />
                    </div>
                  ))}
                  
                  {/* Invisible sentinel that doesn't cause layout shifts */}
                  <div 
                    id="lazy-load-sentinel" 
                    className="h-1 opacity-0"
                    aria-hidden="true"
                  ></div>
                  
                  {/* Floating loading indicator that doesn't disrupt content */}
                  {loadingMore && (
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center py-2 bg-white/80">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-12">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex rounded-md overflow-hidden border border-neutral-300">
                    <button
                      onClick={() => handleViewModeChange('list')}
                      className={`px-3 py-1 text-sm flex items-center ${
                        viewMode === 'list' 
                          ? 'bg-primary text-white' 
                          : 'bg-light text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                     
                    </button>
                    <button
                      onClick={() => handleViewModeChange('map')}
                      className={`px-3 py-1 text-sm flex items-center ${
                        viewMode === 'map' 
                          ? 'bg-primary text-white' 
                          : 'bg-light text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                   
                    </button>
                  </div>

                  <div className="flex rounded-md overflow-hidden border border-neutral-300">
                    <button
                      onClick={() => handleSortChange('alpha')}
                      className={`px-3 py-1 text-sm ${
                        sortBy === 'alpha' 
                          ? 'bg-primary text-white' 
                          : 'bg-light text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      A-Z
                    </button>
                    <button
                      onClick={() => handleSortChange('centers')}
                      className={`px-3 py-1 text-sm ${
                        sortBy === 'centers' 
                          ? 'bg-primary text-white' 
                          : 'bg-light text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      Most Centers
                    </button>
                  </div>
                </div>
              </div>

              {/* Include the stats summary component */}
              <StatsSummary />

              {viewMode === 'map' ? (
                <div className="mb-8 border border-neutral-200 rounded-lg overflow-hidden shadow-md">
                  <CenterMap 
                    centers={stateMapMarkers} 
                    initialLat={20.5937} 
                    initialLng={78.9629} // Center of India
                    initialZoom={5}
                    onCenterSelect={handleCenterSelect}
                  />
                </div>
              ) : (
                <div>
                  {/* Display regions */}
                  {Object.keys(regionToStates).length > 0 ? (
                    Object.entries(regionToStates)
                      .sort(([regionA], [regionB]) => regionA.localeCompare(regionB))
                      .map(([region, regionData]) => (
                        <div key={region} className="mb-12">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-spirit-blue-700">{region}</h2>
                            <div className="text-sm text-neutral-500">
                              {Object.keys(regionData.states).length} states & UTs, {regionData.centerCount} centers
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {Object.entries(regionData.states)
                              .sort(([stateA], [stateB]) => 
                                sortBy === 'alpha' 
                                  ? stateA.localeCompare(stateB) 
                                  : regionData.states[stateB].centerCount - regionData.states[stateA].centerCount
                              )
                              .map(([state, stateData]) => (
                                <Link
                                  key={state}
                                  href={formatCenterUrl(region, state)}
                                  className="bg-light p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-neutral-200 flex flex-col"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-base font-semibold text-spirit-purple-700 truncate pr-1">{state}</h3>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-spirit-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </div>
                                  <div className="text-neutral-600 text-xs flex flex-col gap-1">
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-spirit-purple-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                      <span>{stateData.centerCount} {stateData.centerCount === 1 ? 'center' : 'centers'}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-spirit-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      <span>{stateData.districtCount} {stateData.districtCount === 1 ? 'district' : 'districts'}</span>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center text-neutral-500">
                      No regions found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}