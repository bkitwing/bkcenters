'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Navigation, Search } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import CentersListMapView from '@/components/CentersListMapView';
import { NearbyCenter } from '@/components/NearbyResultCard';
import { AreaListRow, AreaMapCard, AreaSummary, nearestDistanceKm } from '@/components/AreaListRow';
import { CenterLocatorAnalytics } from '@/components/GoogleAnalytics';
import { Center } from '@/lib/types';

/** A district (on a state page) or a state (on a country page) */
export type ExplorerArea = Omit<AreaSummary, 'distanceKm'> & {
  /** Unique id, also used for map ↔ list scrolling */
  code: string;
  /** Map bubble position */
  coords: [string, string] | null;
  /** Locations used for "distance to the nearest center/city" */
  points: [number, number][];
};

type SortMode = 'count' | 'distance' | 'name';

interface AreasExplorerProps {
  areas: ExplorerArea[];
  /** "districts" / "states" (plural, lower case) */
  placesLabel: string;
  region: string;
  /** Set on a state page (the areas are its districts) */
  state?: string;
  /** Show the "Filter …" box (state pages; long lists) */
  showFilter?: boolean;
  /** Lowest map zoom (a whole country on a phone needs less than the default) */
  minZoom?: number;
}

/**
 * Areas list + map with sorting by most centers, nearest (with distances) or
 * A–Z. Used for a state's districts and for a country's states.
 */
export default function AreasExplorer({
  areas,
  placesLabel,
  region,
  state,
  showFilter = true,
  minZoom,
}: AreasExplorerProps) {
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('count');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Distances once the user shares their location, then filter + sort
  const displayed: (ExplorerArea & { distanceKm?: number })[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return areas
      .map((area) => ({
        ...area,
        distanceKm: userLocation ? nearestDistanceKm(userLocation, area.points) : undefined,
      }))
      .filter(
        (area) =>
          !q ||
          area.name.toLowerCase().includes(q) ||
          area.highlights.some((h) => h.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (sortMode === 'distance') return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
        if (sortMode === 'name') return a.name.localeCompare(b.name);
        return b.centerCount - a.centerCount || a.name.localeCompare(b.name);
      });
  }, [areas, userLocation, query, sortMode]);

  // Each area as a map bubble (count of centers)
  const markers: NearbyCenter[] = useMemo(
    () =>
      displayed.map(
        (area) =>
          ({
            name: area.name,
            slug: '',
            branch_code: area.code,
            address: { line1: '', line2: '', line3: '', city: '', pincode: '' },
            email: '', contact: '', mobile: '',
            country: '', zone: '', sub_zone: '', section: '',
            district_id: '', state_id: '', country_id: '',
            coords: area.coords ?? ['', ''],
            state: state ?? area.name,
            region,
            district: area.name,
            description: `${area.centerCount} meditation ${area.centerCount === 1 ? 'center' : 'centers'}`,
            district_total: area.centerCount,
            is_district_summary: true,
          }) as Center
      ),
    [displayed, state, region]
  );

  const handleSort = (mode: SortMode) => {
    setLocationError(null);
    if (mode !== 'distance' || userLocation) {
      setSortMode(mode);
      CenterLocatorAnalytics.useFilter('sort', mode === 'name' ? 'alpha' : mode === 'distance' ? 'distance' : 'centers');
      return;
    }
    // Nearest: ask for the user's location once
    if (!navigator.geolocation) {
      setLocationError("Your browser can't share your location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSortMode('distance');
        setLocating(false);
        CenterLocatorAnalytics.locationPermission(true);
        CenterLocatorAnalytics.useFilter('sort', 'distance');
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) CenterLocatorAnalytics.locationPermission(false);
        setLocationError("Couldn't get your location. Allow location access and try again.");
      },
      {
        enableHighAccuracy: false, // Network location is enough for distances between cities
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (text.trim()) CenterLocatorAnalytics.searchCenters(text, displayed.length, 'text');
  };

  const sortOptions: [SortMode, string][] = [
    ['count', 'Most centers'],
    ['distance', 'Nearest'],
    ['name', 'A–Z'],
  ];

  return (
    <>
      {/* Filter + sort */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        {showFilter && (
          <div className="flex-1 sm:max-w-md">
            <SearchBar
              placeholder={`Filter ${placesLabel} or areas`}
              value={query}
              onClear={() => setQuery('')}
              showClearButton={query.length > 0}
              disableVoiceInput={true}
              isLocalSearch={true}
              onTextChange={handleQueryChange}
            />
          </div>
        )}
        <div
          role="group"
          aria-label={`Sort ${placesLabel}`}
          className="flex shrink-0 self-start sm:self-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-1"
        >
          {sortOptions.map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => handleSort(mode)}
              disabled={mode === 'distance' && locating}
              aria-pressed={sortMode === mode}
              aria-busy={mode === 'distance' && locating}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                sortMode === mode
                  ? 'bg-white dark:bg-neutral-700 text-spirit-purple-700 dark:text-spirit-purple-300 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              {mode === 'distance' &&
                (locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Navigation className="w-3.5 h-3.5" aria-hidden />)}
              {mode === 'distance' && locating ? 'Locating…' : label}
            </button>
          ))}
        </div>
      </div>
      {locationError && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{locationError}</p>
      )}

      <p className="mt-3 mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400 min-h-[1rem]" aria-live="polite">
        <span>
          {query.trim()
            ? `Showing ${displayed.length} of ${areas.length} ${placesLabel}`
            : sortMode === 'distance'
              ? `Nearest ${placesLabel} to you first`
              : sortMode === 'name'
                ? `${placesLabel.charAt(0).toUpperCase()}${placesLabel.slice(1)} A–Z`
                : `${placesLabel.charAt(0).toUpperCase()}${placesLabel.slice(1)} with the most centers first`}
        </span>
        {userLocation && (
          <Link
            href={`/?lat=${userLocation.lat}&lng=${userLocation.lng}&address=Your Current Location`}
            className="inline-flex items-center gap-1 font-semibold text-spirit-purple-700 dark:text-spirit-purple-300 hover:underline underline-offset-2"
          >
            See the closest centers to you
            <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        )}
      </p>

      <CentersListMapView
        centers={markers}
        pinMode="district"
        minZoom={minZoom}
        userLocation={sortMode === 'distance' && userLocation ? userLocation : undefined}
        userLocationLabel="Your location"
        fitKey={`${query.trim().toLowerCase()}|${sortMode}`}
        fitCount={sortMode === 'distance' ? 5 : undefined}
        renderMapCard={(_marker, index, isActive) =>
          displayed[index] ? <AreaMapCard area={displayed[index]} isActive={isActive} /> : null
        }
      >
        {({ selectedCode, onHoverChange }) =>
          displayed.length > 0 ? (
            <>
              <h2 className="sr-only">
                {placesLabel.charAt(0).toUpperCase()}{placesLabel.slice(1)}
                {state ? ` in ${state}` : ` in ${region}`}
              </h2>
              <ol className="divide-y divide-neutral-100 dark:divide-neutral-700 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                {displayed.map((area) => (
                  <li key={area.code}>
                    <AreaListRow
                      area={area}
                      id={`center-card-${area.code}`}
                      isActive={selectedCode === area.code}
                      onHoverChange={(active) => onHoverChange?.(active ? area.code : null)}
                    />
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <Search className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" aria-hidden />
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                No {placesLabel} found matching &ldquo;{query}&rdquo;
              </p>
              <button
                onClick={() => setQuery('')}
                className="mt-2 text-xs text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium transition-colors"
              >
                Clear search
              </button>
            </div>
          )
        }
      </CentersListMapView>
    </>
  );
}
