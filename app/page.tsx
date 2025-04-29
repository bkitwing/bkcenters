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
      
      {/* Search Bar */}
      <div className="bg-light rounded-lg shadow-md p-8 border border-neutral-200 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center spiritual-text-gradient">Find a Center Near You</h2>
        <SearchBar onSearchResult={handleSearchResult} />
      </div>
      
      {lat && lng && (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold spiritual-text-gradient">Centers Near {address}</h2>
            <div className="flex items-center space-x-2">
              <label htmlFor="distance-filter" className="text-sm text-neutral-600">Distance:</label>
              <input 
                id="distance-filter"
                type="range" 
                min="5" 
                max="100" 
                step="5" 
                value={maxDistance} 
                onChange={handleDistanceChange}
                className="w-32"
              />
              <span className="text-sm text-neutral-600">{maxDistance} km</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-1 bg-light rounded-lg shadow-md border border-neutral-200 p-4">
              <div ref={resultsContainerRef} className="h-[600px] overflow-y-auto pr-2">
                {nearestCenters.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {nearestCenters.map((center) => (
                        <CenterCard 
                          key={center.branch_code} 
                          center={center} 
                          distance={center.distance}
                          showDistance={true}
                        />
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-2 text-neutral-600">No Centers Found</h3>
                    <p className="text-neutral-500">
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
            <div ref={mapRef} className="md:col-span-2 bg-light rounded-lg shadow-md border border-neutral-200 overflow-hidden">
              <div className="h-[600px]">
                <CenterMap 
                  centers={nearestCenters} 
                  autoZoom={nearestCenters.length > 0}
                  onCenterSelect={handleCenterSelect}
                  highlightCenter={true}
                  showInfoWindowOnLoad={selectedCenter !== null}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Regions Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold spiritual-text-gradient">Explore by Region</h2>
          <div className="flex space-x-2 bg-light rounded-md border border-neutral-200">
            <button 
              onClick={() => handleSortChange('centers')}
              className={`px-3 py-1 text-sm ${sortBy === 'centers' ? 'bg-primary text-white rounded-md' : 'text-neutral-600'}`}
            >
              By Centers
            </button>
            <button 
              onClick={() => handleSortChange('alpha')}
              className={`px-3 py-1 text-sm ${sortBy === 'alpha' ? 'bg-primary text-white rounded-md' : 'text-neutral-600'}`}
            >
              Alphabetical
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getSortedRegions().map(region => (
            <Link
              key={region.name}
              href={formatCenterUrl(region.name)}
              className="bg-light p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-neutral-200 block"
            >
              <h3 className="text-xl font-semibold mb-1 text-spirit-blue-700">{region.name}</h3>
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">States/UT:</span>
                  <span className="text-neutral-700 font-medium">{region.stateCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Centers:</span>
                  <span className="text-neutral-700 font-medium">{region.centerCount}</span>
                </div>
              </div>
              <div className="text-right mt-2">
                <span className="text-primary font-medium">Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Statistics Summary */}
      <StatsSummary />
    </main>
  );
}
