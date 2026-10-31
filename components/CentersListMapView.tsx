'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import type { MapPadding } from '@/components/CenterMap';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, List, Map as MapIcon } from 'lucide-react';
import NearbyResultCard, { NearbyCenter } from '@/components/NearbyResultCard';
import { Center } from '@/lib/types';
import { CenterLocatorAnalytics } from '@/components/GoogleAnalytics';

const CenterMap = dynamic(() => import('@/components/CenterMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />,
});

// Phone map view: the area under the Map/Satellite control (top) and the card
// carousel + List button (bottom). Pins are fitted and panned into the rest.
const MOBILE_MAP_PADDING: MapPadding = { top: 64, right: 56, bottom: 290, left: 24 };

export function useMediaQuery(query: string): boolean {
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

/** What the list column needs to stay in sync with the map */
export type ListMapContext = {
  isDesktop: boolean;
  selectedCode: string | null;
  /** Desktop only: card click highlights its pin */
  onCardSelect?: (center: NearbyCenter) => void;
  /** Desktop only: card hover enlarges its pin */
  onHoverChange?: (branchCode: string | null) => void;
};

interface CentersListMapViewProps {
  /** Centers in list order — pin numbers and the mobile card follow this order */
  centers: NearbyCenter[];
  /** Pins to show when they differ from `centers` (e.g. the nearest center outside the radius) */
  mapCenters?: NearbyCenter[];
  /** Total for the mobile "3 of N" counter when more exist than are loaded */
  total?: number;
  closestLabel?: string;
  userLocation?: { lat: number; lng: number };
  userLocationLabel?: string;
  /** Map re-fits when this changes (new search, filter or sort) */
  fitKey: string;
  /** Fit the map to the first N centers only (default: all) */
  fitCount?: number;
  /**
   * 'numbered' (default): pins numbered like the list.
   * 'district': count bubbles for district summaries (state pages).
   */
  pinMode?: 'numbered' | 'district';
  /** Lowest map zoom (default 5) */
  minZoom?: number;
  /** Card for the phone map carousel (default: the center result card) */
  renderMapCard?: (center: NearbyCenter, index: number, isActive: boolean) => ReactNode;
  /** List column content */
  children: (ctx: ListMapContext) => ReactNode;
}

/**
 * List + map, kept in sync. Used by the nearby search results, the city
 * (district) pages and the state pages (district bubbles).
 *
 * Desktop: list on the left, sticky map on the right; hovering a card enlarges
 * its pin, clicking a pin scrolls to its card.
 * Mobile: list first with a floating Map/List toggle; the map view has swipeable
 * cards (plus previous/next) that stay in sync with the pins.
 */
export default function CentersListMapView({
  centers,
  mapCenters,
  total,
  closestLabel,
  userLocation,
  userLocationLabel,
  fitKey,
  fitCount,
  pinMode = 'numbered',
  minZoom,
  renderMapCard,
  children,
}: CentersListMapViewProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [selectedCenter, setSelectedCenter] = useState<NearbyCenter | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  // Set while we scroll the carousel ourselves, so it isn't read as a swipe
  const programmaticScrollRef = useRef(false);
  const scrollEndTimerRef = useRef<number | undefined>(undefined);

  // A new search/filter/sort starts with nothing selected
  useEffect(() => {
    setSelectedCenter(null);
  }, [fitKey]);

  const pins = mapCenters ?? centers;
  const showMap = isDesktop || mobileView === 'map';

  const handleCenterSelect = (center: Center) => {
    setSelectedCenter(center as NearbyCenter);
    if (pinMode === 'district') {
      CenterLocatorAnalytics.useFilter('district', center.district);
    } else {
      CenterLocatorAnalytics.viewCenter(center);
    }
  };

  const switchMobileView = (view: 'list' | 'map') => {
    setMobileView(view);
    if (view === 'map' && !selectedCenter && centers[0]) {
      setSelectedCenter(centers[0]);
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
    ? centers.findIndex((c) => c.branch_code === selectedCenter.branch_code)
    : -1;
  const floatingIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const floatingCenter = centers[floatingIndex];
  const stepFloating = (delta: number) => {
    const next = centers[floatingIndex + delta];
    if (next) setSelectedCenter(next);
  };

  const isMobileMap = !isDesktop && mobileView === 'map';

  // Selection changed (pin tap, previous/next) → bring its card to the middle
  useEffect(() => {
    if (!isMobileMap) return;
    const carousel = carouselRef.current;
    const card = carousel?.children[floatingIndex] as HTMLElement | undefined;
    if (!carousel || !card) return;
    const target = card.offsetLeft - (carousel.clientWidth - card.offsetWidth) / 2;
    if (Math.abs(carousel.scrollLeft - target) < 2) return;
    programmaticScrollRef.current = true;
    carousel.scrollTo({ left: target, behavior: 'smooth' });
  }, [floatingIndex, isMobileMap]);

  // Swipe settled → select the card in the middle (the map follows)
  const handleCarouselScroll = () => {
    window.clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = window.setTimeout(() => {
      if (programmaticScrollRef.current) {
        programmaticScrollRef.current = false;
        return;
      }
      const carousel = carouselRef.current;
      if (!carousel) return;
      const middle = carousel.scrollLeft + carousel.clientWidth / 2;
      let closest = 0;
      let closestDistance = Infinity;
      Array.from(carousel.children).forEach((child, i) => {
        const card = child as HTMLElement;
        const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle);
        if (distance < closestDistance) {
          closest = i;
          closestDistance = distance;
        }
      });
      if (closest !== floatingIndex && centers[closest]) setSelectedCenter(centers[closest]);
    }, 120);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-5">
        {/* ----- List ----- */}
        <div className={!isDesktop && mobileView === 'map' ? 'hidden' : ''}>
          {children({
            isDesktop,
            selectedCode: selectedCenter?.branch_code ?? null,
            onCardSelect: isDesktop ? setSelectedCenter : undefined,
            onHoverChange: isDesktop ? setHoveredCode : undefined,
          })}
        </div>

        {/* ----- Map: sticky beside the list on desktop, full view on mobile ----- */}
        {showMap && (
          <div
            ref={mapSectionRef}
            // Mobile: fills the screen below the floating header
            className="scroll-mt-24 lg:sticky lg:self-start bk-map-sticky h-[calc(100dvh-7.5rem)] min-h-[380px] lg:min-h-0 lg:h-[calc(100vh-var(--bk-header-h,4.75rem)-1.5rem)]"
          >
            <div className="relative h-full bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
              <CenterMap
                centers={pins}
                autoZoom={pins.length > 0}
                onCenterSelect={handleCenterSelect}
                highlightCenter={true}
                showInfoWindowOnLoad={false}
                height="100%"
                selectedCenter={selectedCenter}
                userLocation={userLocation}
                userLocationLabel={userLocationLabel}
                numbered={pinMode === 'numbered'}
                isDistrictView={pinMode === 'district'}
                hoveredCenterCode={hoveredCode}
                scrollToCardOnSelect={isDesktop}
                fitKey={fitKey}
                fitCount={fitCount}
                gestureHandling={isDesktop ? 'cooperative' : 'greedy'}
                mapPadding={isDesktop ? undefined : MOBILE_MAP_PADDING}
                compactControls={!isDesktop}
                minZoom={minZoom}
              />

              {/* Mobile: swipeable cards for the pins, with previous / next */}
              {!isDesktop && floatingCenter && (
                // Sits above the floating List/Map toggle
                <div className="absolute inset-x-0 bottom-16 z-10">
                  {centers.length > 1 && (
                    <div className="mb-2 flex items-center justify-center gap-3">
                      <button
                        onClick={() => stepFloating(-1)}
                        disabled={floatingIndex === 0}
                        aria-label="Previous center"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-spirit-purple-600 text-white shadow-lg ring-2 ring-white dark:ring-neutral-800 active:scale-95 transition disabled:bg-neutral-300 disabled:text-neutral-500 dark:disabled:bg-neutral-700"
                      >
                        <ChevronLeft className="w-6 h-6" aria-hidden />
                      </button>
                      <span className="min-w-[5.5rem] rounded-full bg-white dark:bg-neutral-800 px-3 py-1.5 text-center text-sm font-semibold text-neutral-700 dark:text-neutral-200 shadow-md tabular-nums">
                        {floatingIndex + 1} of {(total ?? centers.length).toLocaleString()}
                      </span>
                      <button
                        onClick={() => stepFloating(1)}
                        disabled={floatingIndex >= centers.length - 1}
                        aria-label="Next center"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-spirit-purple-600 text-white shadow-lg ring-2 ring-white dark:ring-neutral-800 active:scale-95 transition disabled:bg-neutral-300 disabled:text-neutral-500 dark:disabled:bg-neutral-700"
                      >
                        <ChevronRight className="w-6 h-6" aria-hidden />
                      </button>
                    </div>
                  )}
                  {/* Swipe between centers; neighbours peek in at the edges */}
                  <div
                    ref={carouselRef}
                    onScroll={handleCarouselScroll}
                    className="relative flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-[9%] pb-1"
                  >
                    {centers.map((center, index) => (
                      // Full content width: with the side padding, each card centres exactly
                      <div key={center.branch_code} className="w-full shrink-0 snap-center">
                        {renderMapCard ? (
                          renderMapCard(center, index, index === floatingIndex)
                        ) : (
                          <NearbyResultCard
                            center={center}
                            index={index}
                            closestLabel={closestLabel}
                            isActive={index === floatingIndex}
                            variant="floating"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: List / Map toggle */}
      {centers.length > 0 && (
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
    </>
  );
}
