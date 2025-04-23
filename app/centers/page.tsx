'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getStatesSummary, getNearestCenters, getAllCenters, getRegions, getRegionForState } from '@/lib/centerData';
import SearchBar from '@/components/SearchBar';
import CenterCard from '@/components/CenterCard';
import CenterMap from '@/components/CenterMap';
import { Center } from '@/lib/types';

type StateSummary = {
  state: string;
  centerCount: number;
  districtCount: number;
};

type SortOption = 'alpha' | 'centers';
type ViewMode = 'list' | 'map';

export default function CentersPage() {
  const searchParams = useSearchParams();
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [nearestCenters, setNearestCenters] = useState<(Center & { distance?: number })[]>([]);
  const [statesSummary, setStatesSummary] = useState<StateSummary[]>([]);
  const [allCenters, setAllCenters] = useState<Center[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('alpha');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);

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

        // Get states summary with counts
        const summary = await getStatesSummary();
        setStatesSummary(summary);
        
        // Get all centers for map markers
        const centers = await getAllCenters();
        setAllCenters(centers);
        
        // Get all available regions
        const availableRegions = await getRegions();
        setRegions(availableRegions);
        
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
          const centers = await getNearestCenters(lat, lng, 10);
          setNearestCenters(centers);
        } catch (error) {
          console.error('Error fetching nearest centers:', error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchCenters();
  }, [lat, lng]);
  
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
  };

  const handleCenterSelect = (center: Center) => {
    // Handle state selection from map
    if (center.is_state_summary) {
      // Use the center's actual region from data
      window.location.href = `/centers/${encodeURIComponent(center.region)}/${encodeURIComponent(center.state)}`;
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
  
  // Stats summary box
  const StatsSummary = () => {
    const totalCenters = statesSummary.reduce((sum, state) => sum + state.centerCount, 0);
    const totalStates = statesSummary.length;
    
    return (
      <div className="bg-light rounded-lg shadow-md p-4 mb-6 border border-neutral-200">
        <h3 className="font-semibold text-lg mb-3 text-primary">Meditation Centers Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-spirit-purple-50 p-3 rounded-lg border border-spirit-purple-100">
            <div className="text-primary text-2xl font-bold">{totalCenters}</div>
            <div className="text-neutral-600 text-sm">Total Centers</div>
          </div>
          <div className="bg-spirit-blue-50 p-3 rounded-lg border border-spirit-blue-100">
            <div className="text-secondary text-2xl font-bold">{totalStates}</div>
            <div className="text-neutral-600 text-sm">States</div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center spiritual-text-gradient">Find Meditation Centers</h1>
      
      <div className="mb-8 max-w-2xl mx-auto">
        <SearchBar onSearchResult={handleSearchResult} />
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {lat && lng && nearestCenters.length > 0 ? (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-4 text-spirit-teal-600">Nearest Centers to {address}</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <CenterMap 
                    centers={nearestCenters} 
                    initialLat={lat} 
                    initialLng={lng}
                    onCenterSelect={handleCenterSelect}
                  />
                </div>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {nearestCenters.map((center) => (
                    <div key={center.branch_code} id={`center-${center.branch_code}`} className="transition-colors duration-300">
                      <CenterCard center={center} distance={center.distance} showDistance={true} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-12">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-semibold text-spirit-purple-700">Browse by State</h2>
                
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
                      List View
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
                      Map View
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
                  {/* Display states grouped by region */}
                  {Object.keys(statesByRegion).map(region => (
                    <div key={region} className="mb-8">
                      <h2 className="text-xl font-semibold mb-4 text-spirit-blue-700">{region}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {statesByRegion[region].map((state) => (
                          <Link
                            key={state.state}
                            href={`/centers/${encodeURIComponent(region)}/${encodeURIComponent(state.state)}`}
                            className="bg-light p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-neutral-200 flex flex-col"
                          >
                            <h3 className="text-lg font-semibold mb-2 text-spirit-purple-700">{state.state}</h3>
                            <div className="text-neutral-600 text-sm">
                              {state.centerCount} {state.centerCount === 1 ? 'center' : 'centers'} in {state.districtCount} {state.districtCount === 1 ? 'district' : 'districts'}
                            </div>
                            <div className="mt-auto pt-3 text-primary text-sm font-medium">
                              View centers →
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 