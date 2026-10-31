'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import AreasExplorer, { ExplorerArea } from '@/components/AreasExplorer';
import SoulSustenance from '@/components/SoulSustenance';
import type { StateDetail } from '@/lib/serverCenterData';
import { formatCenterUrl } from '@/lib/urlUtils';
import { currentPageUrl, placeShareMessage } from '@/lib/shareText';
import { ShareSheet } from '@/components/ContactSheet';
import { districtLevelLabel, stateLevelLabel } from '@/lib/countryUtils';
import { ArrowRight, BookOpen, ChevronRight, ExternalLink, Globe, Loader2, Navigation, Share2, Sparkles, Users } from 'lucide-react';

interface RegionPageClientProps {
  region: string;
  states: StateDetail[];
  /** Other regions (countries) in this locator, e.g. Nepal on the India page */
  otherRegions: { name: string; centerCount: number }[];
}

const stateCode = (state: string) => `state-${state.toLowerCase().replace(/\s+/g, '-')}`;

export default function RegionPageClient({ region, states, otherRegions }: RegionPageClientProps) {
  const router = useRouter();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const statesLabel = stateLevelLabel(region, { plural: true, short: true });
  const districtsLabel = districtLevelLabel(region, { plural: true }).toLowerCase();
  const totalCenters = states.reduce((sum, s) => sum + s.centerCount, 0);
  const totalDistricts = states.reduce((sum, s) => sum + s.districtCount, 0);

  // Each state with its top cities; distance is to the nearest city (approximate)
  const areas: ExplorerArea[] = useMemo(
    () =>
      states.map((state) => ({
        code: stateCode(state.name),
        name: state.name,
        href: formatCenterUrl(region, state.name),
        centerCount: state.centerCount,
        highlights: state.topDistricts,
        moreCount: Math.max(0, state.districtCount - state.topDistricts.length),
        coords: state.coords,
        points: state.districtPoints,
        distanceApprox: true,
      })),
    [states, region]
  );

  // Search box → nearby results on the locator home
  const handleSearchResult = (lat: number, lng: number, address: string) => {
    router.push(`/?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`);
  };

  const handleNearMe = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Your browser can't share your location. Search for your area instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        router.push(`/?lat=${position.coords.latitude}&lng=${position.coords.longitude}&address=Your Current Location`);
      },
      () => {
        setLocating(false);
        setLocationError("Couldn't get your location. Allow location access, or search for your area instead.");
      },
      {
        enableHighAccuracy: false, // Network location is enough to find nearby centers
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };


  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      <section className="container mx-auto max-w-7xl px-4 pt-3 sm:pt-5 pb-28 lg:pb-12" aria-labelledby="region-heading">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex items-center flex-wrap gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <li className="flex items-center">
              <Link href="/" className="hover:text-spirit-purple-700 dark:hover:text-spirit-purple-300 transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3 mx-1 text-neutral-300 dark:text-neutral-600" aria-hidden />
            </li>
            <li aria-current="page" className="font-medium text-neutral-700 dark:text-neutral-200">{region}</li>
          </ol>
        </nav>

        {/* Title + share */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* One keyword-rich heading; the line below adds facts instead of repeating it */}
            <h1 id="region-heading" className="text-2xl sm:text-3xl font-bold leading-tight text-neutral-900 dark:text-neutral-100">
              Rajyoga Meditation Centers in {region}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {totalCenters.toLocaleString()} centers · {states.length} {statesLabel} · {totalDistricts.toLocaleString()} {districtsLabel}
              <span className="whitespace-nowrap">
                {' · '}
                <Sparkles className="inline w-3.5 h-3.5 -mt-0.5 text-spirit-gold-500" aria-hidden /> All classes free
              </span>
            </p>
          </div>
          <button
            onClick={() => setShareOpen(true)}
            aria-haspopup="dialog"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600 transition-colors"
          >
            <Share2 className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Share</span>
            <span className="sr-only sm:hidden">Share centers in {region}</span>
          </button>
          {shareOpen && (
            <ShareSheet
              subtitle={`Centers in ${region}`}
              message={placeShareMessage(region, `${totalCenters.toLocaleString()} centers across ${states.length} ${statesLabel}`, currentPageUrl())}
              onClose={() => setShareOpen(false)}
            />
          )}
        </div>

        {/* Find a center: search any place or center, or use location */}
        <div className="mt-4 flex gap-2 sm:gap-3 max-w-3xl">
          <div className="flex-1 min-w-0">
            <SearchBar onSearchResult={handleSearchResult} placeholder="Area, city, pincode or center" />
          </div>
          <button
            onClick={handleNearMe}
            disabled={locating}
            aria-busy={locating}
            aria-label="Find centers near my current location"
            className="flex items-center justify-center gap-2 bg-spirit-purple-600 hover:bg-spirit-purple-700 disabled:opacity-80 text-white font-semibold px-4 sm:px-5 rounded-lg text-sm transition-colors shrink-0"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Navigation className="w-4 h-4" aria-hidden />}
            <span className="hidden sm:inline">{locating ? 'Locating…' : 'Near Me'}</span>
          </button>
        </div>
        {locationError && (
          <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{locationError}</p>
        )}

        {areas.length > 0 ? (
          <AreasExplorer
            areas={areas}
            placesLabel={stateLevelLabel(region, { plural: true }).toLowerCase()}
            region={region}
            showFilter={false}
            minZoom={3}
          />
        ) : (
          <div className="mt-6 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-10 text-center">
            <Globe className="w-14 h-14 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" aria-hidden />
            <h2 className="text-2xl font-bold mb-3 text-neutral-700 dark:text-neutral-300">No {stateLevelLabel(region, { plural: true })} Found</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm max-w-md mx-auto">
              We couldn&apos;t find any {stateLevelLabel(region, { plural: true }).toLowerCase()} in {region}.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-spirit-purple-600 to-spirit-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg transition-all">
              Explore All Centers
            </Link>
          </div>
        )}
      </section>

      <div className="container mx-auto max-w-7xl px-4 pb-10 space-y-10">
        {/* ===== OTHER COUNTRIES ===== */}
        <nav aria-labelledby="other-regions-heading">
          <h2 id="other-regions-heading" className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-3">
            Centers in other countries
          </h2>
          <ul className="flex flex-wrap gap-2">
            {otherRegions.map((other) => (
              <li key={other.name}>
                <Link
                  href={formatCenterUrl(other.name)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:border-spirit-purple-400 hover:text-spirit-purple-700 dark:hover:border-spirit-purple-500 dark:hover:text-spirit-purple-300 transition-colors"
                >
                  {other.name}
                  <span className="tabular-nums text-neutral-400 dark:text-neutral-500">{other.centerCount.toLocaleString()}</span>
                </Link>
              </li>
            ))}
            <li>
              <a
                href="https://www.brahmakumaris.org/centre-locator/centres"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:border-spirit-purple-400 hover:text-spirit-purple-700 dark:hover:border-spirit-purple-500 dark:hover:text-spirit-purple-300 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-spirit-purple-500" aria-hidden />
                International locator
                <ExternalLink className="w-3 h-3 text-neutral-400" aria-hidden />
              </a>
            </li>
          </ul>
        </nav>

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

        {/* Back to the locator home */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Link href="/" className="inline-flex items-center gap-2 text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium text-sm transition-colors">
            <ArrowRight className="w-4 h-4 rotate-180" aria-hidden />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
