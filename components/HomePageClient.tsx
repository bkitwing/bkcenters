"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from 'next/dynamic';
import SearchBar from "@/components/SearchBar";
import CenterCard from "@/components/CenterCard";
import { Center, RegionStateMapping } from "@/lib/types";
import { formatCenterUrl } from "@/lib/urlUtils";
import { CenterLocatorAnalytics } from '@/components/GoogleAnalytics';
import { MapPin, ChevronRight, Search, Building2, Sparkles, BookOpen, Users, Globe, Navigation, Compass, ArrowRight, SlidersHorizontal } from 'lucide-react';
import SoulSustenance from '@/components/SoulSustenance';

const CenterMap = dynamic(() => import('@/components/CenterMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-neutral-100 rounded-lg animate-pulse" />,
});

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

// Type for pre-computed state map markers (lightweight, one per state)
type StateMapMarker = {
  name: string;
  state: string;
  region: string;
  coords: [string, string];
  description: string;
  summary: string;
  centerCount: number;
  districtCount: number;
};

// Props passed from Server Component
interface HomePageClientProps {
  initialStatesSummary: StateSummary[];
  initialStateMapMarkers: StateMapMarker[];
  initialRegionDetails: { name: string; stateCount: number; centerCount: number }[];
  initialRegionToStates: RegionStateMapping;
  totalCenters: number;
  totalStates: number;
  totalDistricts: number;
  retreatCentersCount: number;
}

export default function HomePageClient({
  initialStatesSummary,
  initialStateMapMarkers,
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
  
  // Use initial data from server (lightweight - no full centers array)
  const [statesSummary] = useState<StateSummary[]>(initialStatesSummary);
  const [stateMapMarkers] = useState<StateMapMarker[]>(initialStateMapMarkers);
  const [regionDetails] = useState<{ name: string; stateCount: number; centerCount: number }[]>(initialRegionDetails);
  const [regionToStates] = useState<RegionStateMapping>(initialRegionToStates);
  
  // Nearby fetch abort controller ref
  const nearbyAbortRef = useRef<AbortController | null>(null);
  
  const [sortBy, setSortBy] = useState<SortOption>("centers");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [regionViewMode, setRegionViewMode] = useState<ViewMode>("list");
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [displayLimit, setDisplayLimit] = useState<number>(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const mapRef = useRef<MapRef>(null);
  const regionMapRef = useRef<HTMLDivElement>(null);

  // Convert pre-computed state map markers to Center-like objects for the CenterMap component
  // These are lightweight markers (one per state) pre-computed on the server
  const stateMapMarkersForMap = stateMapMarkers.map((marker) => ({
    name: marker.name,
    slug: '',
    state: marker.state,
    region: marker.region,
    coords: marker.coords,
    description: marker.description,
    summary: marker.summary,
    district_total: marker.centerCount,
    is_district_summary: true,
    is_state_summary: true,
    branch_code: `state-${marker.state.toLowerCase().replace(/\s+/g, '-')}`,
  })) as Center[];

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

  // Auto-prompt for location on first visit (only when no search params present)
  useEffect(() => {
    const hasParams = searchParams.get("lat") || searchParams.get("lng") || searchParams.get("address");
    if (hasParams) return; // User already has a search — don't interrupt

    // Check if we've already prompted this session
    const alreadyPrompted = sessionStorage.getItem("location-prompted");
    if (alreadyPrompted) return;

    // Small delay so the page renders first, then ask for location
    const timer = setTimeout(() => {
      if (!navigator.geolocation) return;
      sessionStorage.setItem("location-prompted", "1");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          router.push(
            `/?lat=${latitude}&lng=${longitude}&address=${encodeURIComponent("Current Location")}`
          );
        },
        () => {
          // User denied or error — silently ignore, they can search manually
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    }, 800);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch nearest centers from server-side API (no client-side distance calc)
  useEffect(() => {
    if (!lat || !lng) return;

    // Abort any in-flight request
    nearbyAbortRef.current?.abort();
    const controller = new AbortController();
    nearbyAbortRef.current = controller;

    async function fetchNearby() {
      setLoading(true);
      try {
        const basePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/centers')
          ? '/centers'
          : '';
        const res = await fetch(
          `${basePath}/api/centers/nearby?lat=${lat}&lng=${lng}&maxDistance=150&limit=50`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const results: (Center & { distance?: number })[] = json.data || [];

        setAllNearestCenters(results);

        const filtered = results.filter(
          (c) => typeof c.distance === "number" && c.distance <= maxDistance
        );
        setNearestCenters(filtered.slice(0, 10));
        setDisplayLimit(10);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching nearby centers:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchNearby();

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  // Re-filter when maxDistance slider changes (no new API call)
  useEffect(() => {
    if (allNearestCenters.length === 0) return;
    const filtered = allNearestCenters.filter(
      (c) => typeof c.distance === "number" && c.distance <= maxDistance
    );
    setNearestCenters(filtered.slice(0, 10));
    setDisplayLimit(10);
  }, [maxDistance, allNearestCenters]);

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
    // First check the region to states mapping (most reliable)
    for (const [region, data] of Object.entries(regionToStates)) {
      if (data.states[stateName]) {
        return region;
      }
    }

    // Fallback: check state map markers (pre-computed on server)
    const stateMarker = stateMapMarkers.find((m) => m.state === stateName);
    if (stateMarker?.region) {
      return stateMarker.region;
    }

    return "INDIA";
  };

  // Component for displaying statistics summary
  const StatsSummary = () => {
    return (
      <div className="stats-bar bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="stat bg-neutral-50 p-3 rounded-lg text-center flex flex-col justify-center items-center min-h-[80px]">
            <div className="stat-value text-primary text-lg sm:text-xl font-bold">
              {totalCenters.toLocaleString()}
            </div>
            <div className="stat-label text-neutral-600 text-xs sm:text-sm">
              Meditation Centers
            </div>
          </div>
          <div className="stat bg-neutral-50 p-3 rounded-lg text-center flex flex-col justify-center items-center min-h-[80px]">
            <div className="stat-value text-accent text-lg sm:text-xl font-bold">
              36
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
                HQ Campuses
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">

      {/* ===== HERO SECTION ===== */}
      {!lat && !lng && (
        <section className="relative overflow-hidden bg-gradient-to-b from-neutral-50 via-spirit-purple-50/20 to-neutral-50 dark:from-neutral-900 dark:via-spirit-purple-950/10 dark:to-neutral-900 py-8 md:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(184,134,11,0.05),transparent_50%)]" />
          <div className="container mx-auto max-w-3xl px-4 relative">
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 md:mb-3 leading-tight">
                Rajyoga{" "}
                <span className="bg-gradient-to-r from-spirit-purple-700 via-spirit-purple-500 to-spirit-gold-500 dark:from-spirit-purple-300 dark:via-spirit-purple-200 dark:to-spirit-gold-300 bg-clip-text text-transparent">
                  Meditation
                </span>{" "}
                Centers
              </h1>
            </div>

            {/* Search — no extra wrapper, SearchBar has its own styling */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
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
                className="flex items-center justify-center gap-2 bg-spirit-purple-600 hover:bg-spirit-purple-700 text-white font-semibold px-5 py-3 rounded-lg text-sm transition-colors shrink-0"
              >
                <Navigation className="w-4 h-4" />
                Near Me
              </button>
            </div>

            {/* Stats + Description */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 sm:gap-6 mb-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-spirit-purple-500 dark:text-spirit-purple-400" />
                  <strong className="text-neutral-700 dark:text-neutral-200">{totalCenters.toLocaleString()}</strong> Centers
                </span>
                <span className="w-px h-3.5 bg-neutral-300 dark:bg-neutral-600" />
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-spirit-purple-500 dark:text-spirit-purple-400" />
                  <strong className="text-neutral-700 dark:text-neutral-200">36</strong> States &amp; UTs
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-400 dark:text-neutral-500 max-w-md mx-auto leading-relaxed">
                Find your nearest center for free meditation classes and 7-day Rajyoga courses
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ===== SEARCH RESULTS VIEW ===== */}
      {lat && lng ? (
        <div className="min-h-screen">
          {/* Golden gradient search header */}
          <div className="bg-gradient-to-b from-spirit-purple-700 via-spirit-purple-600 to-transparent dark:from-spirit-purple-900 dark:via-spirit-purple-900/50 dark:to-transparent pb-20 pt-6">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto">
                <p className="text-center text-white/70 text-xs font-medium uppercase tracking-wider mb-3">Find Your Center</p>
                <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
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
                      className="flex items-center justify-center gap-2 bg-white text-spirit-purple-700 dark:bg-spirit-purple-400 dark:text-white font-semibold px-5 py-3 rounded-xl text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                    >
                      <Navigation className="w-4 h-4" />
                      Near Me
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 -mt-14">
            <div ref={searchResultsRef}>
              {/* Results header with distance slider */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm px-5 py-4">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-spirit-purple-100 dark:bg-spirit-purple-900/30 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-spirit-purple-600 dark:text-spirit-purple-400" />
                  </div>
                  Centers Near You
                  {nearestCenters.length > 0 && (
                    <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500">({nearestCenters.length})</span>
                  )}
                </h2>
                <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-xl px-3 py-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
                  <input
                    id="distance-filter"
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={maxDistance}
                    onChange={handleDistanceChange}
                    className="w-24 sm:w-32 accent-spirit-purple-600"
                  />
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{maxDistance} km</span>
                </div>
              </div>

              {/* Map + List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 mb-8">
                {/* Map */}
                <div className="order-1 md:col-span-6 md:sticky md:top-16 md:self-start h-[40vh] sm:h-[45vh] md:h-[calc(100vh-80px)]">
                  <div ref={mapRef} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden h-full">
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

                {/* Centers list */}
                <div className="order-2 md:col-span-6 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm centers-list-container">
                  <div
                    ref={resultsContainerRef}
                    className="h-[50vh] sm:h-[55vh] md:h-[calc(100vh-80px)] overflow-y-auto p-4"
                  >
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-16 px-6">
                        {/* Peaceful loading animation */}
                        <div className="relative w-20 h-20 mb-6">
                          <div className="absolute inset-0 rounded-full border-2 border-spirit-purple-100 dark:border-spirit-purple-800" />
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-spirit-purple-500 dark:border-t-spirit-purple-400 animate-spin" />
                          <div className="absolute inset-3 rounded-full border-2 border-transparent border-b-spirit-gold-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-spirit-purple-500 dark:text-spirit-purple-400 animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-base font-semibold text-neutral-700 dark:text-neutral-200 mb-2">Finding Centers Near You</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-xs leading-relaxed">
                          &ldquo;Patience is the companion of wisdom.&rdquo;
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3 italic">
                          Searching within {maxDistance} km of your location...
                        </p>
                      </div>
                    ) : nearestCenters.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-700">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Found <strong className="text-neutral-700 dark:text-neutral-200">{nearestCenters.length}</strong> centers within {maxDistance} km
                          </p>
                          <div className="text-[10px] text-spirit-purple-600 dark:text-spirit-purple-400 bg-spirit-purple-50 dark:bg-spirit-purple-900/20 px-2 py-0.5 rounded-full font-medium">
                            Sorted by distance
                          </div>
                        </div>
                        <div className="space-y-3">
                          {nearestCenters.map((center) => (
                            <div
                              key={center.branch_code}
                              id={`center-card-${center.branch_code}`}
                              onClick={() => handleCardClick(center)}
                              className={`cursor-pointer rounded-xl border transition-all duration-200 p-1 ${
                                selectedCenter?.branch_code === center.branch_code
                                  ? "border-spirit-purple-300 dark:border-spirit-purple-600 bg-spirit-purple-50 dark:bg-spirit-purple-900/20 shadow-md ring-1 ring-spirit-purple-200 dark:ring-spirit-purple-700"
                                  : "border-neutral-100 dark:border-neutral-700 hover:border-spirit-purple-200 dark:hover:border-spirit-purple-700 hover:shadow-sm"
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
                        <div id="lazy-load-sentinel" className="h-4"></div>
                        {loadingMore && (
                          <div className="flex items-center justify-center gap-2 py-4">
                            <div className="w-4 h-4 border-2 border-spirit-purple-200 border-t-spirit-purple-500 rounded-full animate-spin" />
                            <span className="text-neutral-400 dark:text-neutral-500 text-sm">Loading more centers...</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-16 px-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                          <Search className="w-7 h-7 text-neutral-400 dark:text-neutral-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2">No Centers Found Nearby</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-xs mx-auto">
                          No meditation centers within {maxDistance} km of your location. Try expanding the search radius.
                        </p>
                        <button
                          onClick={() => setMaxDistance((prev) => Math.min(prev + 20, 100))}
                          className="inline-flex items-center gap-2 text-sm bg-spirit-purple-50 dark:bg-spirit-purple-900/20 text-spirit-purple-700 dark:text-spirit-purple-400 hover:bg-spirit-purple-100 dark:hover:bg-spirit-purple-900/30 px-5 py-2.5 rounded-xl font-medium transition-colors"
                        >
                          Expand to {Math.min(maxDistance + 20, 100)} km
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ===== EXPLORE VIEW (no search active) ===== */
        <div className="container mx-auto px-4 py-8 space-y-10">

          {/* ===== INDIA MAP ===== */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
            <div ref={regionMapRef} className="h-[400px] sm:h-[500px] md:h-[550px]">
              <CenterMap
                centers={stateMapMarkersForMap}
                autoZoom={true}
                onCenterSelect={handleCenterSelect}
                height="100%"
                defaultZoom={5}
              />
            </div>
            <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Click any state marker to explore its meditation centers.</p>
            </div>
          </div>

          {/* Decorative Divider */}
          <div className="flex items-center my-12">
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-spirit-purple-300 dark:via-spirit-purple-700 to-transparent"></div>
            <div className="px-4">
              <div className="w-2 h-2 rounded-full bg-spirit-purple-400 dark:bg-spirit-purple-600"></div>
            </div>
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-spirit-purple-300 dark:via-spirit-purple-700 to-transparent"></div>
          </div>

          {/* ===== EXPLORE BY REGION ===== */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Explore by Region
              </h2>
              <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 border border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => handleSortChange("centers")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    sortBy === "centers"
                      ? "bg-white dark:bg-neutral-700 text-spirit-purple-700 dark:text-spirit-purple-300 shadow-sm"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                >
                  By Count
                </button>
                <button
                  onClick={() => handleSortChange("alpha")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    sortBy === "alpha"
                      ? "bg-white dark:bg-neutral-700 text-spirit-purple-700 dark:text-spirit-purple-300 shadow-sm"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                >
                  A–Z
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {getSortedRegions().map((region, regionIdx) => {
                const regionColors = [
                  { accent: 'from-spirit-purple-500 to-spirit-blue-500', bg: 'bg-spirit-purple-50/60 dark:bg-spirit-purple-900/10', text: 'text-spirit-purple-700 dark:text-spirit-purple-300', bar: 'bg-spirit-purple-500', hoverBg: 'hover:bg-spirit-purple-50 dark:hover:bg-spirit-purple-900/20' },
                  { accent: 'from-spirit-blue-500 to-spirit-teal-500', bg: 'bg-spirit-blue-50/60 dark:bg-spirit-blue-900/10', text: 'text-spirit-blue-700 dark:text-spirit-blue-300', bar: 'bg-spirit-blue-500', hoverBg: 'hover:bg-spirit-blue-50 dark:hover:bg-spirit-blue-900/20' },
                  { accent: 'from-spirit-teal-500 to-spirit-gold-500', bg: 'bg-spirit-teal-50/60 dark:bg-spirit-teal-900/10', text: 'text-spirit-teal-700 dark:text-spirit-teal-300', bar: 'bg-spirit-teal-500', hoverBg: 'hover:bg-spirit-teal-50 dark:hover:bg-spirit-teal-900/20' },
                  { accent: 'from-spirit-gold-500 to-spirit-purple-500', bg: 'bg-spirit-gold-50/60 dark:bg-spirit-gold-900/10', text: 'text-spirit-gold-700 dark:text-spirit-gold-300', bar: 'bg-spirit-gold-500', hoverBg: 'hover:bg-spirit-gold-50 dark:hover:bg-spirit-gold-900/20' },
                  { accent: 'from-spirit-rose-500 to-spirit-purple-500', bg: 'bg-spirit-rose-50/60 dark:bg-spirit-rose-900/10', text: 'text-spirit-rose-700 dark:text-spirit-rose-300', bar: 'bg-spirit-rose-500', hoverBg: 'hover:bg-spirit-rose-50 dark:hover:bg-spirit-rose-900/20' },
                  { accent: 'from-spirit-purple-500 to-spirit-gold-500', bg: 'bg-spirit-purple-50/60 dark:bg-spirit-purple-900/10', text: 'text-spirit-purple-700 dark:text-spirit-purple-300', bar: 'bg-spirit-purple-500', hoverBg: 'hover:bg-spirit-purple-50 dark:hover:bg-spirit-purple-900/20' },
                ];
                const color = regionColors[regionIdx % regionColors.length];
                const regionStates = regionToStates[region.name]
                  ? Object.keys(regionToStates[region.name].states)
                      .sort((a, b) => {
                        if (sortBy === "alpha") return a.localeCompare(b);
                        const stateA = statesSummary.find((s) => s.state === a);
                        const stateB = statesSummary.find((s) => s.state === b);
                        return (stateB?.centerCount || 0) - (stateA?.centerCount || 0);
                      })
                  : [];
                const maxCentersInRegion = Math.max(...regionStates.map(s => statesSummary.find(st => st.state === s)?.centerCount || 0), 1);
                const isExpanded = showAllRegions || regionIdx < 3;

                return (
                  <div key={region.name} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                    {/* Region Header */}
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color.accent} flex items-center justify-center text-white shadow-sm`}>
                            <Compass className="w-5 h-5" />
                          </div>
                          <div>
                            <Link
                              href={formatCenterUrl(region.name)}
                              className="group flex items-center gap-1.5"
                            >
                              <h3 className="text-base md:text-lg font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-spirit-purple-600 dark:group-hover:text-spirit-purple-400 transition-colors">
                                {region.name}
                              </h3>
                              <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 group-hover:text-spirit-purple-500 group-hover:translate-x-0.5 transition-all" />
                            </Link>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                <strong className={color.text}>{region.centerCount.toLocaleString()}</strong> centers
                              </span>
                              <span className="w-px h-3 bg-neutral-200 dark:bg-neutral-600" />
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                <strong className={color.text}>{region.stateCount}</strong> states
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* State Grid */}
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {regionStates.map((stateName) => {
                            const stateData = statesSummary.find((s) => s.state === stateName);
                            const count = stateData?.centerCount || 0;
                            const pct = Math.round((count / maxCentersInRegion) * 100);

                            return (
                              <Link
                                key={stateName}
                                href={formatCenterUrl(region.name, stateName)}
                                className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl border border-transparent hover:border-neutral-200 dark:hover:border-neutral-600 ${color.hoverBg} transition-all duration-200`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-spirit-purple-600 dark:group-hover:text-spirit-purple-400 truncate transition-colors">
                                      {stateName}
                                    </h4>
                                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 ml-2 tabular-nums shrink-0">
                                      {count}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${color.bar} opacity-70 group-hover:opacity-100 transition-all duration-500`}
                                      style={{ width: `${Math.max(pct, 4)}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                                    {stateData?.districtCount || 0} districts
                                  </p>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 group-hover:text-spirit-purple-500 shrink-0 group-hover:translate-x-0.5 transition-all" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Show more regions toggle */}
            {getSortedRegions().length > 3 && !showAllRegions && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAllRegions(true)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-700 dark:hover:text-spirit-purple-300 bg-spirit-purple-50 dark:bg-spirit-purple-900/20 hover:bg-spirit-purple-100 dark:hover:bg-spirit-purple-900/30 px-5 py-2.5 rounded-xl transition-colors"
                >
                  Show All {getSortedRegions().length} Regions
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Decorative Divider */}
          <div className="flex items-center my-12">
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-spirit-purple-300 dark:via-spirit-purple-700 to-transparent"></div>
            <div className="px-4">
              <div className="w-2 h-2 rounded-full bg-spirit-purple-400 dark:bg-spirit-purple-600"></div>
            </div>
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-spirit-purple-300 dark:via-spirit-purple-700 to-transparent"></div>
          </div>

          {/* ===== INFO ROW ===== */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-spirit-purple-100 to-spirit-blue-100 dark:from-spirit-purple-900/30 dark:to-spirit-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-spirit-purple-600 dark:text-spirit-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-1">Free 7-Day Course</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">Every center offers a free introductory Rajyoga meditation course. Walk in any day — no registration needed.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-spirit-blue-100 to-spirit-purple-100 dark:from-spirit-blue-900/30 dark:to-spirit-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-spirit-blue-600 dark:text-spirit-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-1">Open to Everyone</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">All classes are open to people of every age, background, and faith.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-spirit-gold-100 to-spirit-purple-100 dark:from-spirit-gold-900/30 dark:to-spirit-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-spirit-gold-600 dark:text-spirit-gold-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-1">Always Free</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">All programs, classes, and courses at Brahma Kumaris are offered completely free of charge.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SOUL SUSTENANCE ===== */}
          <SoulSustenance />
        </div>
      )}
    </div>
  );
}

