'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight, Navigation } from 'lucide-react';
import { formatDistanceLabel } from '@/components/NearbyResultCard';

/** An area (district or state) in a list: what it is, how many centers, how far */
export type AreaSummary = {
  name: string;
  href: string;
  centerCount: number;
  /** A few well-known places in it, e.g. center areas or top cities */
  highlights: string[];
  /** How many more places beyond `highlights` */
  moreCount: number;
  /** km to its nearest center (or nearest city for states), once the user shares location */
  distanceKm?: number;
  /** Distance is approximate (measured to city centres, not to each center) */
  distanceApprox?: boolean;
};

function highlightsText(area: AreaSummary): string {
  if (area.highlights.length === 0) return '';
  return `${area.highlights.join(' · ')}${area.moreCount > 0 ? ` +${area.moreCount} more` : ''}`;
}

function distanceText(area: AreaSummary): string {
  if (typeof area.distanceKm !== 'number') return '';
  return `${area.distanceApprox ? '~' : ''}${formatDistanceLabel(area.distanceKm)}`;
}

interface AreaListRowProps {
  area: AreaSummary;
  /** id for map → list scrolling (`center-card-<code>`) */
  id: string;
  isActive?: boolean;
  onHoverChange?: (active: boolean) => void;
}

/** One row in a state's district list or a country's state list */
export function AreaListRow({ area, id, isActive = false, onHoverChange }: AreaListRowProps) {
  const highlights = highlightsText(area);
  const distance = distanceText(area);
  return (
    <Link
      id={id}
      href={area.href}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={`group flex items-center gap-3.5 px-4 sm:px-5 py-4 transition-colors hover:bg-spirit-purple-50/60 dark:hover:bg-spirit-purple-900/20 ${
        isActive ? 'bg-spirit-purple-50 dark:bg-spirit-purple-900/20' : ''
      }`}
    >
      {/* Center count */}
      <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-spirit-purple-50 dark:bg-spirit-purple-900/30 text-spirit-purple-700 dark:text-spirit-purple-300">
        <span className="text-base font-bold leading-none tabular-nums">{area.centerCount}</span>
        <span className="mt-0.5 text-[10px] font-medium leading-none">{area.centerCount === 1 ? 'center' : 'centers'}</span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-spirit-purple-700 dark:group-hover:text-spirit-purple-300 transition-colors">
            {area.name}
          </span>
          {distance && (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-neutral-700 dark:text-neutral-200">
              <Navigation className="h-3.5 w-3.5 text-spirit-purple-500" aria-hidden />
              {distance}
            </span>
          )}
        </span>
        {highlights && (
          <span className="mt-0.5 block truncate text-sm text-neutral-500 dark:text-neutral-400">{highlights}</span>
        )}
      </span>

      <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300 dark:text-neutral-600 group-hover:text-spirit-purple-500 group-hover:translate-x-0.5 transition-all" aria-hidden />
    </Link>
  );
}

/** The card for an area in the phone map view */
export function AreaMapCard({ area, isActive }: { area: AreaSummary; isActive: boolean }) {
  const highlights = highlightsText(area);
  const distance = distanceText(area);
  return (
    <article
      className={`rounded-2xl border bg-white dark:bg-neutral-800 p-3.5 shadow-xl ${
        isActive
          ? 'border-spirit-purple-400 dark:border-spirit-purple-500 ring-2 ring-spirit-purple-200 dark:ring-spirit-purple-800'
          : 'border-neutral-200 dark:border-neutral-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-[#8B6914] px-2 text-sm font-bold text-white tabular-nums">
          {area.centerCount}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100">{area.name}</h3>
            {distance && <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-700 dark:text-neutral-200">{distance}</span>}
          </div>
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{highlights || `${area.centerCount} meditation centers`}</p>
        </div>
      </div>
      <Link
        href={area.href}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-spirit-purple-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-spirit-purple-700"
      >
        View {area.centerCount} {area.centerCount === 1 ? 'center' : 'centers'}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}

/** Haversine distance in km */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Smallest distance from a point to any of `points` ([lat, lng]) */
export function nearestDistanceKm(from: { lat: number; lng: number }, points: [number, number][]): number | undefined {
  let best: number | undefined;
  for (const [lat, lng] of points) {
    const d = distanceKm(from.lat, from.lng, lat, lng);
    if (best === undefined || d < best) best = d;
  }
  return best;
}
