'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import NearbyResultCard, { NearbyCenter } from '@/components/NearbyResultCard';
import CentersListMapView from '@/components/CentersListMapView';
import { Center } from '@/lib/types';
import { formatCenterUrl } from '@/lib/urlUtils';
import { currentPageUrl, placeShareMessage } from '@/lib/shareText';
import { ShareSheet } from '@/components/ContactSheet';
import { CenterLocatorAnalytics } from '@/components/GoogleAnalytics';
import { ArrowRight, ChevronRight, Loader2, Navigation, Search, Share2, Sparkles, BookOpen, Users } from 'lucide-react';
import SoulSustenance from '@/components/SoulSustenance';
import { districtLevelLabel } from '@/lib/countryUtils';

interface DistrictPageClientProps {
  actualRegion: string;
  actualState: string;
  actualDistrict: string;
  stateRegion: string;
  centers: Center[];
  /** Other cities (districts) in the same state, most centers first */
  otherDistricts: { name: string; count: number; href: string }[];
}

type SortMode = 'name' | 'distance';

// How many "other cities" links to show before "All of <state>"
const OTHER_DISTRICTS_SHOWN = 12;

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function DistrictPageClient({
  actualState,
  actualDistrict,
  stateRegion,
  centers,
  otherDistricts,
}: DistrictPageClientProps) {
  const placesLabel = districtLevelLabel(stateRegion, { plural: true });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Filter centers based on search query
  const filteredCenters = useMemo(() => {
    if (searchQuery.trim() === "") {
      return centers;
    }
    const searchLower = searchQuery.toLowerCase();
    return centers.filter(center =>
      center.name.toLowerCase().includes(searchLower) ||
      (center.address?.line1 && center.address.line1.toLowerCase().includes(searchLower)) ||
      (center.address?.line2 && center.address.line2.toLowerCase().includes(searchLower)) ||
      (center.address?.line3 && center.address.line3.toLowerCase().includes(searchLower)) ||
      (center.address?.city && center.address.city.toLowerCase().includes(searchLower)) ||
      (center.address?.pincode && center.address.pincode.toLowerCase().includes(searchLower)) ||
      (center.contact && center.contact.toLowerCase().includes(searchLower)) ||
      (center.email && center.email.toLowerCase().includes(searchLower)) ||
      (center.mobile && center.mobile.toLowerCase().includes(searchLower)) ||
      (center.branch_code && center.branch_code.toLowerCase().includes(searchLower)) ||
      (center.district && center.district.toLowerCase().includes(searchLower)) ||
      (center.state && center.state.toLowerCase().includes(searchLower)) ||
      (center.zone && center.zone.toLowerCase().includes(searchLower)) ||
      (center.sub_zone && center.sub_zone.toLowerCase().includes(searchLower))
    );
  }, [centers, searchQuery]);

  // Distances once the user shares their location; A–Z or nearest-first order
  const displayedCenters: NearbyCenter[] = useMemo(() => {
    const withDistance = filteredCenters.map((center) => {
      const lat = parseFloat(center.coords?.[0] ?? '');
      const lng = parseFloat(center.coords?.[1] ?? '');
      const distance =
        userLocation && Number.isFinite(lat) && Number.isFinite(lng)
          ? distanceKm(userLocation.lat, userLocation.lng, lat, lng)
          : undefined;
      return { ...center, distance };
    });
    return withDistance.sort((a, b) => {
      if (sortMode === 'distance') {
        return (a.distance ?? Infinity) - (b.distance ?? Infinity);
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredCenters, userLocation, sortMode]);

  // Handle search query clear
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Handle search query change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      CenterLocatorAnalytics.searchCenters(query, filteredCenters.length, 'text');
    }
  };

  const handleSortByName = () => {
    setSortMode('name');
    CenterLocatorAnalytics.useFilter('sort', 'alpha');
  };

  // Nearest first: ask for the user's location once, then sort by distance
  const handleSortByDistance = () => {
    setLocationError(null);
    if (userLocation) {
      setSortMode('distance');
      CenterLocatorAnalytics.useFilter('sort', 'distance');
      return;
    }
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
        enableHighAccuracy: false, // Network location is enough to sort by distance
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };


  const isFiltering = searchQuery.trim() !== '';
  const centersWord = (n: number) => (n === 1 ? 'center' : 'centers');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      <section className="container mx-auto max-w-7xl px-4 pt-3 sm:pt-5 pb-28 lg:pb-12" aria-labelledby="district-heading">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex items-center flex-wrap gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <li className="flex items-center">
              <Link href="/" className="hover:text-spirit-purple-700 dark:hover:text-spirit-purple-300 transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3 mx-1 text-neutral-300 dark:text-neutral-600" aria-hidden />
            </li>
            <li className="flex items-center">
              <Link href={formatCenterUrl(stateRegion)} className="hover:text-spirit-purple-700 dark:hover:text-spirit-purple-300 transition-colors">{stateRegion}</Link>
              <ChevronRight className="w-3 h-3 mx-1 text-neutral-300 dark:text-neutral-600" aria-hidden />
            </li>
            <li className="flex items-center">
              <Link href={formatCenterUrl(stateRegion, actualState)} className="hover:text-spirit-purple-700 dark:hover:text-spirit-purple-300 transition-colors">{actualState}</Link>
              <ChevronRight className="w-3 h-3 mx-1 text-neutral-300 dark:text-neutral-600" aria-hidden />
            </li>
            <li aria-current="page" className="font-medium text-neutral-700 dark:text-neutral-200">{actualDistrict}</li>
          </ol>
        </nav>

        {/* Title + share */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* One keyword-rich heading; the line below adds facts instead of repeating it */}
            <h1 id="district-heading" className="text-2xl sm:text-3xl font-bold leading-tight text-neutral-900 dark:text-neutral-100">
              Rajyoga Meditation Centers in {actualDistrict}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {centers.length} {centersWord(centers.length)} · {actualState}
              <span className="whitespace-nowrap">
                {' · '}
                <Sparkles className="inline w-3.5 h-3.5 -mt-0.5 text-spirit-gold-500" aria-hidden /> All classes free
              </span>
            </p>
          </div>
          {centers.length > 0 && (
            <>
              <button
                onClick={() => setShareOpen(true)}
                aria-haspopup="dialog"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600 transition-colors"
              >
                <Share2 className="w-4 h-4" aria-hidden />
                <span className="hidden sm:inline">Share</span>
                <span className="sr-only sm:hidden">Share centers in {actualDistrict}</span>
              </button>
              {shareOpen && (
                <ShareSheet
                  subtitle={`Centers in ${actualDistrict}, ${actualState}`}
                  message={placeShareMessage(`${actualDistrict}, ${actualState}`, `${centers.length} ${centersWord(centers.length)}`, currentPageUrl())}
                  onClose={() => setShareOpen(false)}
                />
              )}
            </>
          )}
        </div>

        {centers.length > 0 ? (
          <>
            {/* Filter + sort */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex-1 sm:max-w-md">
                <SearchBar
                  placeholder="Filter by name, area or pincode"
                  value={searchQuery}
                  onClear={handleClearSearch}
                  showClearButton={searchQuery.length > 0}
                  disableVoiceInput={true}
                  isLocalSearch={true}
                  onTextChange={handleSearchChange}
                />
              </div>
              <div
                role="group"
                aria-label="Sort centers"
                className="flex shrink-0 self-start sm:self-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-1"
              >
                <button
                  onClick={handleSortByName}
                  aria-pressed={sortMode === 'name'}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    sortMode === 'name'
                      ? 'bg-white dark:bg-neutral-700 text-spirit-purple-700 dark:text-spirit-purple-300 shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                  }`}
                >
                  A–Z
                </button>
                <button
                  onClick={handleSortByDistance}
                  disabled={locating}
                  aria-pressed={sortMode === 'distance'}
                  aria-busy={locating}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    sortMode === 'distance'
                      ? 'bg-white dark:bg-neutral-700 text-spirit-purple-700 dark:text-spirit-purple-300 shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                  }`}
                >
                  {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Navigation className="w-3.5 h-3.5" aria-hidden />}
                  {locating ? 'Locating…' : 'Nearest to me'}
                </button>
              </div>
            </div>
            {locationError && (
              <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{locationError}</p>
            )}

            <p className="mt-3 mb-3 text-xs text-neutral-500 dark:text-neutral-400 min-h-[1rem]" aria-live="polite">
              {isFiltering
                ? `Showing ${filteredCenters.length} of ${centers.length} ${centersWord(centers.length)}`
                : sortMode === 'distance'
                  ? 'Nearest to you first'
                  : 'Sorted A–Z'}
            </p>

            <CentersListMapView
              centers={displayedCenters}
              closestLabel={sortMode === 'distance' ? 'Closest to you' : undefined}
              userLocation={userLocation ?? undefined}
              userLocationLabel="Your location"
              fitKey={`${searchQuery.trim().toLowerCase()}|${sortMode}`}
              fitCount={sortMode === 'distance' ? 8 : undefined}
            >
              {({ selectedCode, onCardSelect, onHoverChange }) =>
                displayedCenters.length > 0 ? (
                  <>
                    <h2 className="sr-only">Centers in {actualDistrict}</h2>
                    <ol className="space-y-3">
                      {displayedCenters.map((center, index) => (
                        <li key={center.branch_code}>
                          <NearbyResultCard
                            center={center}
                            index={index}
                            closestLabel={sortMode === 'distance' ? 'Closest to you' : undefined}
                            isActive={selectedCode === center.branch_code}
                            onSelect={onCardSelect}
                            onHoverChange={onHoverChange}
                          />
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                    <Search className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" aria-hidden />
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">No centers found matching &ldquo;{searchQuery}&rdquo;</p>
                    <button
                      onClick={handleClearSearch}
                      className="mt-2 text-xs text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium transition-colors"
                    >
                      Clear search
                    </button>
                  </div>
                )
              }
            </CentersListMapView>
          </>
        ) : (
          <div className="mt-6 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-10 text-center">
            <Search className="w-14 h-14 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" aria-hidden />
            <h2 className="text-2xl font-bold mb-3 text-neutral-700 dark:text-neutral-300">No Centers Found</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm max-w-md mx-auto">
              We couldn&apos;t find any Rajyoga meditation centers in {actualDistrict}, {actualState}.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={formatCenterUrl(stateRegion, actualState)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-spirit-purple-600 to-spirit-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg transition-all"
              >
                View Other {placesLabel} in {actualState}
              </Link>
              <Link href="/" className="inline-flex items-center gap-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 px-5 py-2.5 rounded-xl font-medium text-sm hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600 transition-all">
                Explore All Centers
              </Link>
            </div>
          </div>
        )}
      </section>

      <div className="container mx-auto max-w-7xl px-4 pb-10 space-y-10">
        {/* ===== OTHER CITIES IN THE STATE ===== */}
        {otherDistricts.length > 0 && (
          <nav aria-labelledby="other-districts-heading">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 id="other-districts-heading" className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Other {placesLabel.toLowerCase()} in {actualState}
              </h2>
              <Link
                href={formatCenterUrl(stateRegion, actualState)}
                className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-spirit-purple-700 dark:text-spirit-purple-300 hover:underline underline-offset-2"
              >
                All of {actualState}
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>
            <ul className="flex flex-wrap gap-2">
              {otherDistricts.slice(0, OTHER_DISTRICTS_SHOWN).map((district) => (
                <li key={district.href}>
                  <Link
                    href={district.href}
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:border-spirit-purple-400 hover:text-spirit-purple-700 dark:hover:border-spirit-purple-500 dark:hover:text-spirit-purple-300 transition-colors"
                  >
                    {district.name}
                    <span className="tabular-nums text-neutral-400 dark:text-neutral-500">{district.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

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
    </div>
  );
}
