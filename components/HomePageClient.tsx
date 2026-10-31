"use client";

import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from 'next/dynamic';
import SearchBar from "@/components/SearchBar";
import NearbyResultCard, { NearbyCenter, formatDistanceLabel } from "@/components/NearbyResultCard";
import { Center, RegionStateMapping } from "@/lib/types";
import { formatCenterUrl } from "@/lib/urlUtils";
import { useGoogleMaps } from "@/lib/useGoogleMaps";
import { CenterLocatorAnalytics } from '@/components/GoogleAnalytics';
import { ChevronLeft, ChevronRight, Search, Building2, Sparkles, BookOpen, Users, Globe, ExternalLink, Navigation, Compass, ArrowRight, Share2, Map as MapIcon, List, Check, RotateCw, Loader2 } from 'lucide-react';
import SoulSustenance from '@/components/SoulSustenance';
import { districtLevelLabel } from '@/lib/countryUtils';

const CenterMap = dynamic(() => import('@/components/CenterMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />,
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

type NearbyPage = { data: NearbyCenter[]; total: number; nearest: NearbyCenter | null };
type ResultsStatus = "idle" | "loading" | "ready" | "error";

const PAGE_SIZE = 20;
// Results load automatically while scrolling up to this many; after that a
// "Show more" button keeps the footer reachable.
const AUTO_LOAD_MAX = 60;
const RADIUS_OPTIONS = [5, 10, 25, 50, 100];
const DEFAULT_RADIUS = 50;
const CURRENT_LOCATION_LABEL = "Your Current Location";
function getBasePath(): string {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/centers')
    ? '/centers'
    : '';
}

function parseCoord(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/** "Koramangala, Bengaluru, Karnataka, India" → "Koramangala, Bengaluru" */
function shortPlaceName(address: string): string {
  return address.split(',').map((part) => part.trim()).filter(Boolean).slice(0, 2).join(', ');
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}

/**
 * Reports the URL query string to the parent.
 * Isolated in its own Suspense boundary: useSearchParams() on a statically
 * rendered page client-renders everything up to the nearest Suspense, which
 * previously left the production HTML with only a loading skeleton (no h1,
 * no region/state links for search engines).
 */
function SearchParamsListener({ onChange }: { onChange: (queryString: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onChange(searchParams.toString());
  }, [searchParams, onChange]);
  return null;
}

function ResultSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="h-7 w-7 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between gap-4">
            <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="h-3 w-5/6 rounded bg-neutral-100 dark:bg-neutral-700/60" />
          <div className="flex gap-2 pt-2">
            <div className="h-10 flex-1 rounded-xl bg-neutral-100 dark:bg-neutral-700/60" />
            <div className="h-10 flex-1 rounded-xl bg-neutral-100 dark:bg-neutral-700/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePageClient({
  initialStatesSummary,
  initialStateMapMarkers,
  initialRegionDetails,
  initialRegionToStates,
  totalCenters,
}: HomePageClientProps) {
  const router = useRouter();
  const { isLoaded: mapsLoaded } = useGoogleMaps();

  // Use initial data from server (lightweight - no full centers array)
  const statesSummary = initialStatesSummary;
  const stateMapMarkers = initialStateMapMarkers;
  const regionDetails = initialRegionDetails;
  const regionToStates = initialRegionToStates;

  const [sortBy, setSortBy] = useState<SortOption>("centers");
  const [showAllRegions, setShowAllRegions] = useState(false);
  const regionMapRef = useRef<HTMLDivElement>(null);

  // ----- Search state lives in the URL (shareable, back/forward work) -----
  const [queryString, setQueryString] = useState<string | null>(null);
  const params = useMemo(() => new URLSearchParams(queryString ?? ''), [queryString]);
  const lat = parseCoord(params.get('lat'));
  const lng = parseCoord(params.get('lng'));
  const hasSearch = lat !== null && lng !== null;
  const address = params.get('address') ?? '';
  const textQuery = params.get('search');
  const radiusParam = Number(params.get('r'));
  const radius = RADIUS_OPTIONS.includes(radiusParam) ? radiusParam : DEFAULT_RADIUS;
  const isCurrentLocation = address === CURRENT_LOCATION_LABEL || params.get('src') === 'gps';
  const placeLabel = isCurrentLocation ? 'you' : shortPlaceName(address) || 'this location';
  // Distances are from the user only when we used their real location
  const closestLabel = isCurrentLocation ? 'Closest to you' : 'Nearest';

  const userLocation = useMemo(
    () => (lat !== null && lng !== null ? { lat, lng } : undefined),
    [lat, lng]
  );

  // ----- Results -----
  const [results, setResults] = useState<NearbyCenter[]>([]);
  const [total, setTotal] = useState(0);
  const [nearestOutside, setNearestOutside] = useState<NearbyCenter | null>(null);
  const [status, setStatus] = useState<ResultsStatus>("idle");
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedCenter, setSelectedCenter] = useState<NearbyCenter | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [locating, setLocating] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const responseCache = useRef(new Map<string, NearbyPage>());
  const searchKey = hasSearch ? `${lat},${lng},${radius}` : '';
  const searchKeyRef = useRef(searchKey);
  searchKeyRef.current = searchKey;
  const locationKeyRef = useRef('');
  const mapSectionRef = useRef<HTMLDivElement>(null);

  const updateUrl = useCallback(
    (changes: Record<string, string | null>, mode: 'push' | 'replace' = 'push') => {
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      // Native history API: Next.js (14.1+) keeps useSearchParams in sync, and
      // unlike router.push this skips a server round trip for the page payload.
      window.history[mode === 'push' ? 'pushState' : 'replaceState'](
        null,
        '',
        `${window.location.pathname}${qs ? `?${qs}` : ''}`
      );
      setQueryString(qs);
    },
    []
  );

  const nearbyUrl = useCallback(
    (offset: number) =>
      `${getBasePath()}/api/centers/nearby?lat=${lat}&lng=${lng}&radius=${radius}&offset=${offset}&limit=${PAGE_SIZE}`,
    [lat, lng, radius]
  );

  const fetchNearby = useCallback(async (url: string, signal?: AbortSignal): Promise<NearbyPage> => {
    const cached = responseCache.current.get(url);
    if (cached) return cached;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data: NearbyCenter[] = json.data || [];
    const page: NearbyPage = {
      data,
      total: typeof json.total === 'number' ? json.total : data.length,
      nearest: json.nearest ?? null,
    };
    responseCache.current.set(url, page);
    return page;
  }, []);

  // First page whenever the location or radius changes
  useEffect(() => {
    if (!hasSearch) {
      setResults([]);
      setTotal(0);
      setNearestOutside(null);
      setStatus("idle");
      return;
    }

    // New place → clear the old list; radius change → keep it visible while loading
    const locationKey = `${lat},${lng}`;
    if (locationKeyRef.current !== locationKey) {
      locationKeyRef.current = locationKey;
      setResults([]);
      setSelectedCenter(null);
    }

    const controller = new AbortController();
    setStatus("loading");
    fetchNearby(nearbyUrl(0), controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setResults(page.data);
        setTotal(page.total);
        setNearestOutside(page.nearest);
        setStatus("ready");
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        console.error("Error fetching nearby centers:", error);
        setStatus("error");
      });

    return () => controller.abort();
  }, [hasSearch, lat, lng, nearbyUrl, fetchNearby, retryCount]);

  const hasMore = status === "ready" && results.length < total;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const keyAtStart = searchKeyRef.current;
    setLoadingMore(true);
    try {
      const page = await fetchNearby(nearbyUrl(results.length));
      if (searchKeyRef.current !== keyAtStart) return; // a new search started meanwhile
      setResults((prev) => {
        const seen = new Set(prev.map((c) => c.branch_code));
        return [...prev, ...page.data.filter((c) => !seen.has(c.branch_code))];
      });
    } catch (error) {
      console.error("Error loading more centers:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, fetchNearby, nearbyUrl, results.length]);

  // Auto-load while scrolling (first AUTO_LOAD_MAX results)
  useEffect(() => {
    if (!hasMore || results.length >= AUTO_LOAD_MAX) return;
    const sentinel = document.getElementById("lazy-load-sentinel");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { root: null, rootMargin: "400px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, results.length, loadMore, mobileView]);

  // ?search=<text> (WebSite SearchAction / deep links): geocode the text once Maps is ready
  useEffect(() => {
    if (!textQuery || hasSearch || !mapsLoaded || !window.google?.maps?.Geocoder) return;
    setSearchError(null);
    new window.google.maps.Geocoder().geocode(
      { address: textQuery, region: 'in' },
      (geoResults: any[] | null, geoStatus: string) => {
        if (geoStatus === 'OK' && geoResults?.[0]?.geometry?.location) {
          const loc = geoResults[0].geometry.location;
          CenterLocatorAnalytics.searchCenters(textQuery, 0, 'text');
          updateUrl(
            { lat: String(loc.lat()), lng: String(loc.lng()), address: geoResults[0].formatted_address, search: null, src: null },
            'replace'
          );
        } else {
          setSearchError(`We couldn't find “${textQuery}”. Try a nearby city, area or pincode.`);
        }
      }
    );
  }, [textQuery, hasSearch, mapsLoaded, updateUrl]);

  // Handle search result from SearchBar component
  const handleSearchResult = (
    latitude: number,
    longitude: number,
    searchedAddress: string,
    options?: { fromGps?: boolean }
  ) => {
    setSearchError(null);
    updateUrl({
      lat: String(latitude),
      lng: String(longitude),
      address: searchedAddress,
      search: null,
      src: options?.fromGps ? 'gps' : null,
    });
    window.scrollTo({ top: 0 });
  };

  // Handle location button click
  const handleCurrentLocationClick = () => {
    if (navigator.geolocation) {
      setLocating(true);
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
              handleSearchResult(latitude, longitude, locationName, { fromGps: true });
            } else {
              handleSearchResult(latitude, longitude, CURRENT_LOCATION_LABEL, { fromGps: true });
            }
          } catch (error) {
            console.error('Error getting location name:', error);
            handleSearchResult(latitude, longitude, CURRENT_LOCATION_LABEL, { fromGps: true });
          } finally {
            setLocating(false);
          }
        },
        (error) => {
          setLocating(false);
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
    setSearchError(null);
    updateUrl({ lat: null, lng: null, address: null, r: null, src: null, search: null });
  };

  const handleRadiusChange = (value: number) => {
    if (value === radius) return;
    CenterLocatorAnalytics.useFilter('distance', `${value}km`);
    updateUrl({ r: value === DEFAULT_RADIUS ? null : String(value) }, 'replace');
  };

  // City page for the nearest result — "see every center in this city"
  const cityPage = results[0]?.district && results[0]?.state
    ? {
        name: results[0].district,
        href: formatCenterUrl(results[0].region || 'INDIA', results[0].state, results[0].district),
      }
    : null;

  const handleShareResults = async () => {
    const url = window.location.href;
    const title = `Brahma Kumaris meditation centers near ${placeLabel === 'you' ? 'me' : placeLabel}`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareState('copied');
        setTimeout(() => setShareState('idle'), 2000);
      }
    } catch {
      // Share sheet dismissed — nothing to do
    }
  };

  // Handle center selection on the map
  const handleCenterSelect = (center: Center) => {
    if (center.is_state_summary && center.name) {
      CenterLocatorAnalytics.viewCenter(center);
      const region = center.region || "INDIA";
      router.push(formatCenterUrl(region, center.name));
      return;
    }
    setSelectedCenter(center as NearbyCenter);
    CenterLocatorAnalytics.viewCenter(center);
  };

  // Card click (desktop) — highlight its pin and pan the map to it
  const handleCardSelect = (center: NearbyCenter) => {
    setSelectedCenter(center);
  };

  const switchMobileView = (view: 'list' | 'map') => {
    setMobileView(view);
    if (view === 'map' && !selectedCenter && results[0]) {
      setSelectedCenter(results[0]);
    }
    requestAnimationFrame(() => {
      if (view === 'map') {
        mapSectionRef.current?.scrollIntoView({ block: 'start' });
      } else {
        const card = selectedCenter && document.getElementById(`center-card-${selectedCenter.branch_code}`);
        if (card) card.scrollIntoView({ block: 'center' });
        else window.scrollTo({ top: 0 });
      }
    });
  };

  const selectedIndex = selectedCenter
    ? results.findIndex((c) => c.branch_code === selectedCenter.branch_code)
    : -1;
  const floatingCenter = selectedIndex >= 0 ? results[selectedIndex] : results[0];
  const floatingIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const stepFloating = (delta: number) => {
    const next = results[floatingIndex + delta];
    if (next) setSelectedCenter(next);
  };

  // Smallest radius option that would include the nearest center outside the current radius
  const expandRadius = nearestOutside?.distance !== undefined
    ? RADIUS_OPTIONS.find((r) => r >= nearestOutside.distance! && r > radius)
    : undefined;

  // Get sorted regions: India (and other non-Nepal) first; Nepal always at the end
  const getSortedRegions = (): {
    name: string;
    stateCount: number;
    centerCount: number;
  }[] => {
    const isNepal = (name: string) => name.toUpperCase().startsWith("NEPAL");
    const compare =
      sortBy === "alpha"
        ? (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)
        : (a: { centerCount: number }, b: { centerCount: number }) =>
            b.centerCount - a.centerCount;

    const primary = regionDetails.filter((r) => !isNepal(r.name)).sort(compare);
    const nepal = regionDetails.filter((r) => isNepal(r.name)).sort(compare);
    return [...primary, ...nepal];
  };

  // Convert pre-computed state map markers to Center-like objects for the CenterMap component
  // These are lightweight markers (one per state) pre-computed on the server
  const stateMapMarkersForMap = useMemo(
    () =>
      stateMapMarkers.map((marker) => ({
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
      })) as Center[],
    [stateMapMarkers]
  );

  const showMap = isDesktop || mobileView === 'map';
  // Nothing within the radius → still show where the nearest center is
  const mapCenters = useMemo(
    () => (results.length > 0 ? results : nearestOutside ? [nearestOutside] : []),
    [results, nearestOutside]
  );
  const resultsSummary =
    status === 'loading' && results.length === 0
      ? 'Finding centers…'
      : status === 'error'
        ? ''
        : total > 0
          ? `${total.toLocaleString()} ${total === 1 ? 'center' : 'centers'} within ${radius} km · nearest first`
          : status === 'ready'
            ? `No centers within ${radius} km`
            : '';

  const nearMeButtonContent = (label: string) =>
    locating ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        <span>Locating…</span>
      </>
    ) : (
      <>
        <Navigation className="w-4 h-4" aria-hidden />
        <span>{label}</span>
      </>
    );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      <Suspense fallback={null}>
        <SearchParamsListener onChange={setQueryString} />
      </Suspense>

      {/* ===== HERO SECTION ===== */}
      {!hasSearch && (
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
                  value={address || textQuery || ''}
                  onClear={handleClearSearch}
                  showClearButton={!!textQuery}
                />
              </div>
              <button
                onClick={handleCurrentLocationClick}
                disabled={locating}
                aria-busy={locating}
                className="flex items-center justify-center gap-2 bg-spirit-purple-600 hover:bg-spirit-purple-700 disabled:opacity-80 text-white font-semibold px-5 py-3 rounded-lg text-sm transition-colors shrink-0"
              >
                {nearMeButtonContent("Near Me")}
              </button>
            </div>

            {searchError && (
              <p role="alert" className="max-w-xl mx-auto -mt-1 mb-4 text-sm text-center text-red-600 dark:text-red-400">
                {searchError}
              </p>
            )}

            {/* This locator covers India & Nepal; International chip is the worldwide locator */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-spirit-purple-500 dark:text-spirit-purple-400 shrink-0" />
                <span>
                  <strong className="text-neutral-700 dark:text-neutral-200 tabular-nums">
                    {totalCenters.toLocaleString()}
                  </strong>
                  {" "}centers across{" "}
                  <Link
                    href={formatCenterUrl("INDIA")}
                    className="font-medium text-neutral-700 dark:text-neutral-200 underline-offset-2 hover:text-spirit-purple-600 dark:hover:text-spirit-purple-400 hover:underline"
                  >
                    India
                  </Link>
                  {" "}and{" "}
                  <Link
                    href={formatCenterUrl("NEPAL")}
                    className="font-medium text-neutral-700 dark:text-neutral-200 underline-offset-2 hover:text-spirit-purple-600 dark:hover:text-spirit-purple-400 hover:underline"
                  >
                    Nepal
                  </Link>
                </span>
              </span>
              <span
                className="hidden sm:block w-px h-4 bg-neutral-300 dark:bg-neutral-600"
                aria-hidden
              />
              <a
                href="https://www.brahmakumaris.org/centre-locator/centres"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Find centers in other countries"
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-100 shadow-sm hover:border-spirit-purple-400 dark:hover:border-spirit-purple-500 hover:text-spirit-purple-700 dark:hover:text-spirit-purple-300 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-spirit-purple-500 dark:text-spirit-purple-400" />
                International
                <ExternalLink className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ===== SEARCH RESULTS VIEW ===== */}
      {hasSearch ? (
        <section className="container mx-auto max-w-7xl px-4 pt-3 sm:pt-5 pb-28 lg:pb-12" aria-labelledby="results-heading">
          {/* Breadcrumb — the way back to the locator home */}
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              <li className="flex items-center">
                <Link
                  href="/"
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                    e.preventDefault();
                    handleClearSearch();
                    window.scrollTo({ top: 0 });
                  }}
                  className="inline-flex items-center gap-1 font-medium hover:text-spirit-purple-700 dark:hover:text-spirit-purple-300"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
                  All centers
                </Link>
              </li>
              <li aria-hidden className="text-neutral-300 dark:text-neutral-600">/</li>
              <li aria-current="page" className="truncate">Near {placeLabel === 'you' ? 'you' : placeLabel}</li>
            </ol>
          </nav>

          {/* Compact search row */}
          <div className="flex gap-2 sm:gap-3 max-w-3xl">
            <div className="flex-1 min-w-0">
              <SearchBar
                onSearchResult={handleSearchResult}
                value={address === CURRENT_LOCATION_LABEL ? '' : address}
                onClear={handleClearSearch}
                showClearButton={true}
                placeholder="City, area or center"
              />
            </div>
            <button
              onClick={handleCurrentLocationClick}
              disabled={locating}
              aria-busy={locating}
              aria-label="Find centers near my current location"
              className="flex items-center justify-center gap-2 bg-spirit-purple-600 hover:bg-spirit-purple-700 disabled:opacity-80 text-white font-semibold px-4 sm:px-5 rounded-lg text-sm transition-colors shrink-0 [&>span]:hidden sm:[&>span]:inline"
            >
              {nearMeButtonContent("Near Me")}
            </button>
          </div>

          {/* Summary + share */}
          <div className="mt-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 id="results-heading" className="text-xl sm:text-2xl font-bold leading-tight text-neutral-900 dark:text-neutral-100">
                Meditation centers near {placeLabel}
              </h1>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 min-h-[1.25rem]" aria-live="polite">
                {resultsSummary}
                {cityPage && total > 0 && (
                  <>
                    {' · '}
                    <Link
                      href={cityPage.href}
                      className="font-medium text-spirit-purple-700 dark:text-spirit-purple-300 hover:underline underline-offset-2"
                    >
                      All centers in {cityPage.name}
                    </Link>
                  </>
                )}
              </p>
            </div>
            {total > 0 && (
              <button
                onClick={handleShareResults}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600 transition-colors"
              >
                {shareState === 'copied' ? <Check className="w-4 h-4 text-green-600" aria-hidden /> : <Share2 className="w-4 h-4" aria-hidden />}
                <span className="hidden sm:inline">{shareState === 'copied' ? 'Link copied' : 'Share'}</span>
                <span className="sr-only sm:hidden">{shareState === 'copied' ? 'Link copied' : 'Share these results'}</span>
              </button>
            )}
          </div>

          {/* Radius chips */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Search radius">
            <span className="shrink-0 text-xs font-medium text-neutral-500 dark:text-neutral-400">Within</span>
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => handleRadiusChange(option)}
                aria-pressed={option === radius}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold tabular-nums transition-colors ${
                  option === radius
                    ? 'border-spirit-purple-600 bg-spirit-purple-600 text-white'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600'
                }`}
              >
                {option} km
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-5">
            {/* ----- List ----- */}
            <div className={!isDesktop && mobileView === 'map' ? 'hidden' : ''}>
              {status === 'error' ? (
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-6 py-12 text-center">
                  <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">Couldn&apos;t load centers</h2>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Check your connection and try again.</p>
                  <button
                    onClick={() => setRetryCount((n) => n + 1)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-spirit-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-spirit-purple-700"
                  >
                    <RotateCw className="w-4 h-4" aria-hidden /> Try again
                  </button>
                </div>
              ) : status === 'loading' && results.length === 0 ? (
                <div className="space-y-3" aria-hidden>
                  {Array.from({ length: 4 }, (_, i) => <ResultSkeleton key={i} />)}
                </div>
              ) : status === 'ready' && total === 0 ? (
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-5 py-8 sm:px-8">
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                      <Search className="w-6 h-6 text-neutral-400 dark:text-neutral-500" aria-hidden />
                    </div>
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                      No centers within {radius} km
                    </h2>
                    {nearestOutside && typeof nearestOutside.distance === 'number' && (
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        The nearest center is {formatDistanceLabel(nearestOutside.distance)} away.
                      </p>
                    )}
                  </div>
                  {nearestOutside && (
                    <div className="mt-5 text-left">
                      <NearbyResultCard center={nearestOutside} index={0} closestLabel={closestLabel} />
                    </div>
                  )}
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {expandRadius && (
                      <button
                        onClick={() => handleRadiusChange(expandRadius)}
                        className="inline-flex items-center gap-2 rounded-xl bg-spirit-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-spirit-purple-700"
                      >
                        Show centers within {expandRadius} km
                        <ChevronRight className="w-4 h-4" aria-hidden />
                      </button>
                    )}
                    {nearestOutside?.state && (
                      <Link
                        href={formatCenterUrl(nearestOutside.region || 'INDIA', nearestOutside.state)}
                        className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-600 px-5 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:border-spirit-purple-300"
                      >
                        All centers in {nearestOutside.state}
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="sr-only">Results, nearest first</h2>
                  <ol
                    className={`space-y-3 transition-opacity ${status === 'loading' ? 'opacity-60' : ''}`}
                    aria-busy={status === 'loading'}
                  >
                    {results.map((center, index) => (
                      <li key={center.branch_code}>
                        <NearbyResultCard
                          center={center}
                          index={index}
                          closestLabel={closestLabel}
                          isActive={selectedCenter?.branch_code === center.branch_code}
                          onSelect={isDesktop ? handleCardSelect : undefined}
                          onHoverChange={isDesktop ? setHoveredCode : undefined}
                        />
                      </li>
                    ))}
                  </ol>
                  <div id="lazy-load-sentinel" className="h-4" />
                  {loadingMore && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Loading more centers…
                    </div>
                  )}
                  {hasMore && !loadingMore && results.length >= AUTO_LOAD_MAX && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={loadMore}
                        className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-5 py-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:border-spirit-purple-300"
                      >
                        Show more centers
                        <span className="text-neutral-400 font-normal">({(total - results.length).toLocaleString()} more)</span>
                      </button>
                    </div>
                  )}
                  {!hasMore && results.length > 0 && status === 'ready' && (
                    <p className="pt-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
                      Showing all {total.toLocaleString()} centers within {radius} km
                    </p>
                  )}
                  {cityPage && status === 'ready' && results.length > 0 && (
                    <div className="pt-4 text-center">
                      <Link
                        href={cityPage.href}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-spirit-purple-700 dark:text-spirit-purple-300 hover:underline underline-offset-2"
                      >
                        Browse all centers in {cityPage.name}
                        <ArrowRight className="w-4 h-4" aria-hidden />
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ----- Map: sticky beside the list on desktop, full view on mobile ----- */}
            {showMap && (
              <div
                ref={mapSectionRef}
                // Mobile: fills the screen below the floating header (the bottom nav is hidden here)
                className="scroll-mt-24 lg:sticky lg:self-start bk-map-sticky h-[calc(100dvh-7.5rem)] min-h-[380px] lg:min-h-0 lg:h-[calc(100vh-var(--bk-header-h,4.75rem)-1.5rem)]"
              >
                <div className="relative h-full bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                  <CenterMap
                    centers={mapCenters}
                    autoZoom={mapCenters.length > 0}
                    onCenterSelect={handleCenterSelect}
                    highlightCenter={true}
                    showInfoWindowOnLoad={false}
                    height="100%"
                    selectedCenter={selectedCenter}
                    userLocation={userLocation}
                    userLocationLabel={isCurrentLocation ? 'Your location' : address || 'Searched location'}
                    numbered
                    hoveredCenterCode={hoveredCode}
                    scrollToCardOnSelect={isDesktop}
                    fitKey={searchKey}
                    fitCount={8}
                    gestureHandling={isDesktop ? 'cooperative' : 'greedy'}
                  />

                  {/* Mobile: card for the selected pin, with previous / next */}
                  {!isDesktop && floatingCenter && (
                    // Sits above the floating List/Map toggle
                    <div className="absolute inset-x-3 bottom-14 z-10">
                      {results.length > 1 && (
                        <div className="mb-2 flex items-center justify-between">
                          <button
                            onClick={() => stepFloating(-1)}
                            disabled={floatingIndex === 0}
                            aria-label="Previous center"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-neutral-800 shadow-md text-neutral-700 dark:text-neutral-200 disabled:opacity-40"
                          >
                            <ChevronLeft className="w-5 h-5" aria-hidden />
                          </button>
                          <span className="rounded-full bg-white/95 dark:bg-neutral-800/95 px-3 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300 shadow-sm tabular-nums">
                            {floatingIndex + 1} of {total.toLocaleString()}
                          </span>
                          <button
                            onClick={() => stepFloating(1)}
                            disabled={floatingIndex >= results.length - 1}
                            aria-label="Next center"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-neutral-800 shadow-md text-neutral-700 dark:text-neutral-200 disabled:opacity-40"
                          >
                            <ChevronRight className="w-5 h-5" aria-hidden />
                          </button>
                        </div>
                      )}
                      <NearbyResultCard
                        center={floatingCenter}
                        index={floatingIndex}
                        closestLabel={closestLabel}
                        isActive
                        variant="floating"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile: List / Map toggle */}
          {results.length > 0 && (
            <div
              className="lg:hidden fixed left-1/2 -translate-x-1/2 z-40"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}
            >
              <button
                onClick={() => switchMobileView(mobileView === 'list' ? 'map' : 'list')}
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 dark:bg-white px-5 py-3 text-sm font-semibold text-white dark:text-neutral-900 shadow-xl active:scale-95 transition-transform"
              >
                {mobileView === 'list' ? (
                  <><MapIcon className="w-4 h-4" aria-hidden /> Map</>
                ) : (
                  <><List className="w-4 h-4" aria-hidden /> List</>
                )}
              </button>
            </div>
          )}
        </section>
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
                  onClick={() => { setSortBy("centers"); CenterLocatorAnalytics.useFilter('sort', 'centers'); }}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    sortBy === "centers"
                      ? "bg-white dark:bg-neutral-700 text-spirit-purple-700 dark:text-spirit-purple-300 shadow-sm"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                >
                  By Count
                </button>
                <button
                  onClick={() => { setSortBy("alpha"); CenterLocatorAnalytics.useFilter('sort', 'alpha'); }}
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
                                    {stateData?.districtCount || 0}{' '}
                                    {districtLevelLabel(region.name, {
                                      plural: (stateData?.districtCount || 0) !== 1,
                                    }).toLowerCase()}
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
