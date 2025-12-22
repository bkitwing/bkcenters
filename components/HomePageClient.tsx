"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getNearestCenters,
  getRetreatCenters,
} from "@/lib/centerData";
import SearchBar from "@/components/SearchBar";
import CenterCard from "@/components/CenterCard";
import CenterMap from "@/components/CenterMap";
import { Center, RegionStateMapping } from "@/lib/types";
import { formatCenterUrl } from "@/lib/urlUtils";
import { CenterLocatorAnalytics } from '@/components/GoogleAnalytics';

// Declare the google namespace globally
declare global {
  interface Window {
    google: any;
  }
}

type StateSummary = {
  state: string;
  centerCount: number;
  districtCount: number;
};

type SortOption = "alpha" | "centers";
type ViewMode = "list" | "map";

interface MapRef extends HTMLDivElement {
  map?: google.maps.Map;
}

const defaultZoom = 12;
const markers = new Map<string, google.maps.Marker>();

// Props passed from Server Component
interface HomePageClientProps {
  initialStatesSummary: StateSummary[];
  initialAllCenters: Center[];
  initialRegionDetails: { name: string; stateCount: number; centerCount: number }[];
  initialRegionToStates: RegionStateMapping;
  totalCenters: number;
  totalStates: number;
  totalDistricts: number;
  retreatCentersCount: number;
}

export default function HomePageClient({
  initialStatesSummary,
  initialAllCenters,
  initialRegionDetails,
  initialRegionToStates,
  totalCenters,
  totalStates,
  totalDistricts,
  retreatCentersCount,
}: HomePageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("");
  const [userLocation, setUserLocation] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);
  const [nearestCenters, setNearestCenters] = useState<
    (Center & { distance?: number })[]
  >([]);
  const [allNearestCenters, setAllNearestCenters] = useState<
    (Center & { distance?: number })[]
  >([]);
  
  // Use initial data from server
  const [statesSummary] = useState<StateSummary[]>(initialStatesSummary);
  const [allCenters] = useState<Center[]>(initialAllCenters);
  const [regionDetails] = useState<{ name: string; stateCount: number; centerCount: number }[]>(initialRegionDetails);
  const [regionToStates] = useState<RegionStateMapping>(initialRegionToStates);
  
  const [sortBy, setSortBy] = useState<SortOption>("centers");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [regionViewMode, setRegionViewMode] = useState<ViewMode>("list");
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
    return statesSummary
      .map((state) => {
        // Find a center in this state to use as reference point
        const stateCenter = allCenters.find(
          (center) => center.state === state.state && 
          center.coords && 
          Array.isArray(center.coords) && 
          center.coords.length === 2 &&
          center.coords[0] !== null &&
          center.coords[1] !== null &&
          !isNaN(parseFloat(center.coords[0])) &&
          !isNaN(parseFloat(center.coords[1]))
        );

        if (stateCenter) {
          return {
            ...stateCenter,
            name: state.state,
            description: `${state.centerCount} meditation ${
              state.centerCount === 1 ? "center" : "centers"
            }`,
            summary: `${state.centerCount} ${
              state.centerCount === 1 ? "center" : "centers"
            } across ${state.districtCount} districts`,
            district_total: state.centerCount,
            is_district_summary: true,
            is_state_summary: true,
            region: stateCenter.region,
          };
        }

        console.warn(`No center with valid coordinates found for state: ${state.state}`);
        return null;
      })
      .filter(Boolean) as Center[];
  }, [statesSummary, allCenters]);

  // Handle URL params on mount
  useEffect(() => {
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const addressParam = searchParams.get("address");

    if (latParam && lngParam) {
      setLat(parseFloat(latParam));
      setLng(parseFloat(lngParam));
    }

    if (addressParam) {
      setAddress(addressParam);
    }
  }, [searchParams]);

  // Fetch nearest centers when lat/lng change
  useEffect(() => {
    async function fetchCenters() {
      if (lat && lng && allCenters.length > 0) {
        setLoading(true);
        try {
          const centers = await getNearestCenters(lat, lng, 150, allCenters);
          setAllNearestCenters(centers);

          const filteredCenters = centers.filter(
            (c) => typeof c.distance === "number" && c.distance <= maxDistance
          );

          setNearestCenters(filteredCenters.slice(0, 10));
          setDisplayLimit(10);
        } catch (error) {
          console.error("Error fetching nearest centers:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchCenters();
  }, [lat, lng, maxDistance, allCenters]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!resultsContainerRef.current) return;

    const options = {
      root: resultsContainerRef.current,
      rootMargin: "100px",
      threshold: 0.1,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loadingMore) {
        const filteredCenters = allNearestCenters.filter(
          (c) => typeof c.distance === "number" && c.distance <= maxDistance
        );

        if (nearestCenters.length < filteredCenters.length) {
          setLoadingMore(true);

          const scrollContainer = resultsContainerRef.current;
          const scrollPosition = scrollContainer?.scrollTop;

          const nextBatchSize = 10;
          const nextCenters = [
            ...nearestCenters,
            ...filteredCenters.slice(
              nearestCenters.length,
              nearestCenters.length + nextBatchSize
            ),
          ];

          setNearestCenters(nextCenters);

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

    const sentinel = document.getElementById("lazy-load-sentinel");
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
    CenterLocatorAnalytics.useFilter('sort', option);
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
    const newActiveRegion = activeRegion === regionName ? null : regionName;
    setActiveRegion(newActiveRegion);
    
    if (newActiveRegion) {
      CenterLocatorAnalytics.useFilter('region', regionName);
    }
  };

  // Get sorted states based on sort option
  const getSortedStates = (): StateSummary[] => {
    if (sortBy === "alpha") {
      return [...statesSummary].sort((a, b) => a.state.localeCompare(b.state));
    } else {
      return [...statesSummary].sort((a, b) => b.centerCount - a.centerCount);
    }
  };

  // Function to scroll to search results
  const scrollToSearchResults = useCallback(() => {
    if (searchResultsRef.current) {
      searchResultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  // Handle search result from SearchBar component
  const handleSearchResult = (
    latitude: number,
    longitude: number,
    searchedAddress: string
  ) => {
    setLat(latitude);
    setLng(longitude);
    setAddress(searchedAddress);

    if (searchedAddress === "Your Current Location") {
      setUserLocation({ lat: latitude, lng: longitude });
    } else {
      setUserLocation(undefined);
    }

    router.push(
      `/?lat=${latitude}&lng=${longitude}&address=${encodeURIComponent(
        searchedAddress
      )}`
    );

    setTimeout(scrollToSearchResults, 100);
  };

  // Handle location button click
  const handleCurrentLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            
            if (data.results && data.results[0]) {
              const locationName = data.results[0].formatted_address;
              handleSearchResult(latitude, longitude, locationName);
            } else {
              handleSearchResult(latitude, longitude, "Your Current Location");
            }
          } catch (error) {
            console.error('Error getting location name:', error);
            handleSearchResult(latitude, longitude, "Your Current Location");
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Could not get your current location. Please try the search box instead."
          );
        },
        {
          enableHighAccuracy: false, // Use network location for faster response
          timeout: 15000,
          maximumAge: 60000, // Allow cached position up to 1 minute old
        }
      );
    } else {
      alert(
        "Geolocation is not supported by your browser. Please use the search box."
      );
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setLat(null);
    setLng(null);
    setAddress("");
    setUserLocation(undefined);
    setNearestCenters([]);
    setAllNearestCenters([]);
    router.push("/");
  };

  // Handle center selection on map
  const handleCenterSelect = (center: Center) => {
    setSelectedCenter(center);
    
    CenterLocatorAnalytics.viewCenter(center);

    if (
      resultsContainerRef.current &&
      nearestCenters.some((c) => c.branch_code === center.branch_code)
    ) {
      const centerElement = document.getElementById(
        `center-card-${center.branch_code}`
      );
      if (centerElement) {
        resultsContainerRef.current.scrollTop = centerElement.offsetTop - 100;
        centerElement.classList.add("highlight-card");
        setTimeout(() => {
          centerElement.classList.remove("highlight-card");
        }, 2000);
      }
    }

    if (center.is_state_summary && center.name) {
      const region = center.region || "INDIA";
      router.push(formatCenterUrl(region, center.name));
    }
  };

  // Handle card click to center map
  const handleCardClick = (center: Center) => {
    setSelectedCenter(center);
    
    CenterLocatorAnalytics.viewCenter(center);

    if (center.coords && center.coords.length === 2) {
      const [lat, lng] = center.coords.map(parseFloat);

      if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
        if (window.innerWidth < 768 && mapRef.current) {
          mapRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        const centerElement = document.getElementById(
          `center-card-${center.branch_code}`
        );
        if (centerElement) {
          centerElement.classList.add("highlight-card");

          setTimeout(() => {
            centerElement.classList.remove("highlight-card");
          }, 1500);
        }

        const marker = markers.get(center.branch_code);
        if (marker) {
          marker.setAnimation(google.maps.Animation.BOUNCE);

          setTimeout(() => {
            marker.setAnimation(null);
          }, 1500);

          mapRef.current.map?.panTo({ lat, lng });

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
    for (const [region, data] of Object.entries(regionToStates)) {
      if (data.states[stateName]) {
        return region;
      }
    }

    const center = allCenters.find((c) => c.state === stateName);
    if (center?.region) {
      return center.region;
    }

    return "INDIA";
  };

  // Component for displaying statistics summary
  const StatsSummary = () => {
    return (
      <div className="stats-bar bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="stat bg-neutral-50 p-3 rounded-lg text-center flex flex-col justify-center items-center min-h-[80px]">
            <div className="stat-value text-primary text-lg sm:text-xl font-bold">
              {totalCenters.toLocaleString()}
            </div>
            <div className="stat-label text-neutral-600 text-xs sm:text-sm">
              Meditation Centers
            </div>
          </div>
          <div className="stat bg-neutral-50 p-3 rounded-lg text-center flex flex-col justify-center items-center min-h-[80px]">
            <div className="stat-value text-secondary text-lg sm:text-xl font-bold">
              {totalDistricts.toLocaleString()}
            </div>
            <div className="stat-label text-neutral-600 text-xs sm:text-sm">
              In Districts
            </div>
          </div>
          <div className="stat bg-neutral-50 p-3 rounded-lg text-center flex flex-col justify-center items-center min-h-[80px]">
            <div className="stat-value text-accent text-lg sm:text-xl font-bold">
              {totalStates}
            </div>
            <div className="stat-label text-neutral-600 text-xs sm:text-sm">
              In States & UTs
            </div>
          </div>
          <div className="stat bg-neutral-50 p-3 rounded-lg text-center flex flex-col justify-center items-center min-h-[80px]">
            <Link
              href="/retreat"
              className="hover:opacity-90 transition-opacity"
            >
              <div className="stat-value text-spirit-gold-500 text-lg sm:text-xl font-bold">
                {retreatCentersCount}
              </div>
              <div className="stat-label text-neutral-600 text-xs sm:text-sm hover:text-primary-focus">
                HQ & Retreat Centers
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
      CenterLocatorAnalytics.useFilter('distance', `${value}km`);
    }
  };

  // Get sorted regions based on sort option
  const getSortedRegions = (): {
    name: string;
    stateCount: number;
    centerCount: number;
  }[] => {
    if (sortBy === "alpha") {
      return [...regionDetails].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return [...regionDetails].sort((a, b) => b.centerCount - a.centerCount);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Search Bar - First on the page */}
      <div className="bg-light rounded-lg shadow-md p-4 sm:p-8 border border-neutral-200 mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center spiritual-text-gradient">
          Find a Center Near You
        </h2>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Current Location
          </button>
        </div>
      </div>

      {/* Statistics Summary - Only show when not searching */}
      {!lat && !lng && <StatsSummary />}

      {lat && lng ? (
        <div ref={searchResultsRef} className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <div className="flex items-center">
              <h2 className="text-sm font-medium mb-4 text-spirit-blue-700">
                Centers Near {address}
              </h2>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="flex items-center flex-1 sm:flex-auto">
                <label
                  htmlFor="distance-filter"
                  className="text-sm text-neutral-600 mr-2"
                >
                  Distance:
                </label>
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
                <span className="text-sm text-neutral-600 ml-2 whitespace-nowrap">
                  {maxDistance} km
                </span>
              </div>
            </div>
          </div>

          {/* Modified layout - Map first on both mobile and desktop */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 mb-6">
            {/* Map container - full width on mobile with 40% height, sticky on desktop */}
            <div className="order-1 md:col-span-6 md:sticky md:top-4 md:self-start h-[40vh] sm:h-[45vh] md:h-[calc(100vh-32px)]">
              <div
                ref={mapRef}
                className="bg-light rounded-lg shadow-md border border-neutral-200 overflow-hidden h-full"
              >
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
              <div
                ref={resultsContainerRef}
                className="h-[50vh] sm:h-[55vh] md:h-[calc(100vh-64px)] overflow-y-auto pr-2"
              >
                {nearestCenters.length > 0 ? (
                  <>
                    <h3 className="text-xl font-medium mb-4 text-spirit-blue-700">
                      Found {nearestCenters.length} centers near you
                    </h3>
                    <div className="space-y-3">
                      {nearestCenters.map((center) => (
                        <div
                          key={center.branch_code}
                          id={`center-card-${center.branch_code}`}
                          onClick={() => handleCardClick(center)}
                          className={`cursor-pointer rounded-lg transition-all duration-200 ${
                            selectedCenter?.branch_code === center.branch_code
                              ? "shadow-md bg-spirit-blue-50"
                              : "hover:shadow-sm hover:bg-neutral-50"
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
                        <div className="animate-pulse text-neutral-400">
                          Loading more centers...
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-neutral-300 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-neutral-600">
                      No Centers Found
                    </h3>
                    <p className="text-sm sm:text-base text-neutral-500">
                      We couldn't find any meditation centers within{" "}
                      {maxDistance} km of your location.
                    </p>
                    <button
                      onClick={() =>
                        setMaxDistance((prev) => Math.min(prev + 20, 100))
                      }
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
        /* Regions and States Section - Only shown when not searching */
        <>
          {/* India map for regions */}
          <div className="bg-light rounded-lg shadow-md border border-neutral-200 overflow-hidden mb-8">
            <div ref={regionMapRef} className="h-[500px] sm:h-[600px]">
              <CenterMap
                centers={stateMapMarkers}
                autoZoom={true}
                onCenterSelect={handleCenterSelect}
                height="100%"
                defaultZoom={5}
              />
            </div>
          </div>

          {/* By Count/Alphabetical switcher */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-1 bg-light rounded-md border border-neutral-200">
              <button
                onClick={() => handleSortChange("centers")}
                className={`px-4 py-2 text-sm ${
                  sortBy === "centers"
                    ? "bg-primary text-white rounded-md"
                    : "text-neutral-600"
                }`}
              >
                By Count
              </button>
              <button
                onClick={() => handleSortChange("alpha")}
                className={`px-4 py-2 text-sm ${
                  sortBy === "alpha"
                    ? "bg-primary text-white rounded-md"
                    : "text-neutral-600"
                }`}
              >
                In Alphabetical
              </button>
            </div>
          </div>

          {/* Region and state cards */}
          {getSortedRegions().map((region) => (
            <div key={region.name} className="mb-8">
              <div className="flex items-center mb-4">
                <h3 className="text-xl font-bold text-spirit-blue-700">
                  {region.name}
                </h3>
                <div className="ml-3 bg-spirit-blue-100 text-spirit-blue-800 text-xs font-medium rounded-full px-2.5 py-0.5">
                  {region.stateCount} States/UT
                </div>
                <div className="ml-2 bg-primary text-white text-xs font-medium rounded-full px-2.5 py-0.5">
                  {region.centerCount} Centers
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {regionToStates[region.name] &&
                  Object.keys(regionToStates[region.name].states)
                    .sort((a, b) => {
                      if (sortBy === "alpha") {
                        return a.localeCompare(b);
                      } else {
                        const stateA = statesSummary.find(
                          (s) => s.state === a
                        );
                        const stateB = statesSummary.find(
                          (s) => s.state === b
                        );
                        return (
                          (stateB?.centerCount || 0) -
                          (stateA?.centerCount || 0)
                        );
                      }
                    })
                    .map((stateName) => {
                      const stateData = statesSummary.find(
                        (s) => s.state === stateName
                      );
                      return (
                        <Link
                          key={stateName}
                          href={formatCenterUrl(region.name, stateName)}
                          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-neutral-200 p-3 sm:p-4 block"
                        >
                          <h4 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 text-neutral-800 line-clamp-2">
                            {stateName}
                          </h4>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-spirit-blue-600 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              <span className="text-neutral-700">
                                {stateData?.districtCount || 0} Districts
                              </span>
                            </div>
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-primary mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="text-neutral-700">
                                {stateData?.centerCount || 0} Centers
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
              </div>
            </div>
          ))}
        </>
      )}
    </main>
  );
}

