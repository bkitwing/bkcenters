'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getStatesSummary, getNearestCenters, getAllCenters } from '@/lib/centerData';
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
          is_state_summary: true
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
      window.location.href = `/centers/${encodeURIComponent(center.state)}`;
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

  const sortedStates = getSortedStates();
  
  // Stats summary box
  const StatsSummary = () => {
    const totalCenters = statesSummary.reduce((sum, state) => sum + state.centerCount, 0);
    const totalStates = statesSummary.length;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="font-semibold text-lg mb-3">Meditation Centers Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-[#FF7F50] text-2xl font-bold">{totalCenters}</div>
            <div className="text-gray-600 text-sm">Total Centers</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-[#FF7F50] text-2xl font-bold">{totalStates}</div>
            <div className="text-gray-600 text-sm">States</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-[#FF7F50] text-2xl font-bold">
              {statesSummary.reduce((sum, state) => sum + state.districtCount, 0)}
            </div>
            <div className="text-gray-600 text-sm">Districts</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Find Meditation Centers</h1>
      
      <div className="mb-8 max-w-2xl mx-auto">
        <SearchBar onSearchResult={handleSearchResult} />
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7F50]"></div>
        </div>
      ) : (
        <>
          {lat && lng && nearestCenters.length > 0 ? (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Nearest Centers to {address}</h2>
              
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
                <h2 className="text-2xl font-semibold">Browse by State</h2>
                
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex rounded-md overflow-hidden border border-gray-300">
                    <button
                      onClick={() => handleViewModeChange('list')}
                      className={`px-3 py-1 text-sm flex items-center ${
                        viewMode === 'list' 
                          ? 'bg-[#FF7F50] text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-100'
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
                          ? 'bg-[#FF7F50] text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Map View
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Sort by:</span>
                    <div className="flex rounded-md overflow-hidden border border-gray-300">
                      <button
                        onClick={() => handleSortChange('alpha')}
                        className={`px-3 py-1 text-sm ${
                          sortBy === 'alpha' 
                            ? 'bg-[#FF7F50] text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        A-Z
                      </button>
                      <button
                        onClick={() => handleSortChange('centers')}
                        className={`px-3 py-1 text-sm ${
                          sortBy === 'centers' 
                            ? 'bg-[#FF7F50] text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Center Count
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {viewMode === 'map' ? (
                <div className="grid md:grid-cols-5 gap-6">
                  <div className="md:col-span-3">
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                      <h3 className="font-semibold text-lg mb-3">States Map</h3>
                      <div className="h-[400px] mb-2">
                        <CenterMap 
                          centers={stateMapMarkers}
                          height="100%"
                          isDistrictView={true}
                          autoZoom={true}
                          onCenterSelect={handleCenterSelect}
                        />
                      </div>
                      <p className="text-sm text-gray-500 text-center mt-2">
                        Color intensity indicates number of centers in each state. Click on markers for details.
                      </p>
                    </div>
                    
                    <StatsSummary />
                  </div>
                  
                  <div className="md:col-span-2 h-[700px] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 gap-4">
                      {sortedStates.map((state) => (
                        <Link 
                          key={state.state} 
                          href={`/centers/${encodeURIComponent(state.state)}`}
                          className="card hover:shadow-md transition-shadow border border-gray-200 p-4 rounded-lg hover:border-[#FF7F50]"
                        >
                          <h3 className="text-lg font-medium mb-2">{state.state}</h3>
                          <div className="flex justify-between text-sm text-gray-600 mt-2">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#FF7F50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>{state.centerCount} Centers</span>
                            </div>
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#FF7F50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              <span>{state.districtCount} Districts</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sortedStates.map((state) => (
                    <Link 
                      key={state.state} 
                      href={`/centers/${encodeURIComponent(state.state)}`}
                      className="card hover:shadow-md transition-shadow border border-gray-200 p-4 rounded-lg hover:border-[#FF7F50]"
                    >
                      <h3 className="text-lg font-medium mb-2 text-center">{state.state}</h3>
                      <div className="flex justify-between text-sm text-gray-600 mt-2">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#FF7F50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>{state.centerCount} Centers</span>
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#FF7F50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span>{state.districtCount} Districts</span>
                        </div>
                      </div>
                    </Link>
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