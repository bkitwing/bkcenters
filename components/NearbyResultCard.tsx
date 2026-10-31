'use client';

import Link from 'next/link';
import { ChevronRight, Navigation, Phone } from 'lucide-react';
import CallNowButton from '@/components/CallNowButton';
import { Center } from '@/lib/types';
import { formatCenterUrl } from '@/lib/urlUtils';
import { CenterLocatorAnalytics } from '@/components/GoogleAnalytics';
import { callableNumbers } from '@/lib/phone';

export type NearbyCenter = Center & { distance?: number };

/** "350 m", "1.4 km", "12 km" */
export function formatDistanceLabel(km?: number): string {
  if (typeof km !== 'number' || !Number.isFinite(km)) return '';
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function getDirectionsUrl(center: Center): string {
  if (center.coords?.length === 2 && center.coords[0] && center.coords[1]) {
    return `https://www.google.com/maps/dir/?api=1&destination=${center.coords[0]},${center.coords[1]}`;
  }
  const addr = center.address
    ? [center.address.line1, center.address.city, center.address.pincode].filter(Boolean).join(', ')
    : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr || center.name)}`;
}

function formatAddress(center: Center): string {
  const a = center.address;
  if (!a) return '';
  return [a.line1, a.line2, a.line3, a.city, a.pincode].filter(Boolean).join(', ');
}

interface NearbyResultCardProps {
  center: NearbyCenter;
  /** 0-based position in the distance-sorted list (shown as 1-based, matching the map pin) */
  index: number;
  isActive?: boolean;
  onSelect?: (center: NearbyCenter) => void;
  onHoverChange?: (branchCode: string | null) => void;
  /** Tighter layout for the floating card over the mobile map */
  variant?: 'list' | 'floating';
  /**
   * Badge on the first result when the list is sorted by distance ("Closest to you"
   * only for the user's real location). Omit for lists not sorted by distance.
   */
  closestLabel?: string;
}

/**
 * One nearby-search result: number (matches the map pin), name, distance,
 * address and the two actions people need most — Call and Directions.
 */
export default function NearbyResultCard({
  center,
  index,
  isActive = false,
  onSelect,
  onHoverChange,
  variant = 'list',
  closestLabel,
}: NearbyResultCardProps) {
  const detailUrl = formatCenterUrl(center.region || 'INDIA', center.state, center.district, center.name);
  const address = formatAddress(center);
  const distanceLabel = formatDistanceLabel(center.distance);
  const isClosest = index === 0 && Boolean(closestLabel);
  // Same rule CallNowButton uses (it renders nothing without a callable number)
  const hasPhone = callableNumbers(center.mobile, center.contact, center.region).length > 0;

  return (
    <article
      id={variant === 'list' ? `center-card-${center.branch_code}` : undefined}
      aria-label={`${index + 1}. ${center.name}${distanceLabel ? `, ${distanceLabel} away` : ''}`}
      onClick={() => onSelect?.(center)}
      onMouseEnter={() => onHoverChange?.(center.branch_code)}
      onMouseLeave={() => onHoverChange?.(null)}
      className={`group relative rounded-2xl border bg-white dark:bg-neutral-800 transition-all duration-200 ${
        onSelect ? 'cursor-pointer' : ''
      } ${variant === 'floating' ? 'p-3.5 shadow-xl' : 'p-3.5 sm:p-4'} ${
        isActive
          ? 'border-spirit-purple-400 dark:border-spirit-purple-500 ring-2 ring-spirit-purple-200 dark:ring-spirit-purple-800 shadow-md'
          : 'border-neutral-200 dark:border-neutral-700 hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600 hover:shadow-md'
      }`}
    >
      <div className="flex gap-3">
        <span
          aria-hidden
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
            isActive || isClosest
              ? 'bg-spirit-purple-600 text-white'
              : 'bg-spirit-purple-50 text-spirit-purple-700 dark:bg-spirit-purple-900/30 dark:text-spirit-purple-300'
          }`}
        >
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 text-[15px] sm:text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
              <Link
                href={detailUrl}
                className="hover:text-spirit-purple-700 dark:hover:text-spirit-purple-300 focus-visible:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  CenterLocatorAnalytics.viewCenter(center);
                }}
              >
                {center.name}
              </Link>
            </h3>
            {distanceLabel && (
              <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-700 dark:text-neutral-200">
                {distanceLabel}
              </span>
            )}
          </div>

          {isClosest && (
            <span className="mt-1 inline-block rounded-full bg-spirit-purple-50 dark:bg-spirit-purple-900/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-spirit-purple-700 dark:text-spirit-purple-300">
              {closestLabel}
            </span>
          )}

          {address && (
            <p
              className={`mt-1 text-sm leading-snug text-neutral-500 dark:text-neutral-400 ${
                variant === 'floating' ? 'line-clamp-1' : 'line-clamp-2'
              }`}
            >
              {address}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {hasPhone && (
              <span className="flex-1" onClickCapture={() => CenterLocatorAnalytics.contactCenter(center)}>
                <CallNowButton
                  mobile={center.mobile}
                  contact={center.contact}
                  region={center.region}
                  className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-spirit-gold-500 px-3 text-sm font-semibold text-white transition-colors hover:bg-spirit-gold-600"
                >
                  <Phone className="h-4 w-4" aria-hidden /> Call
                </CallNowButton>
              </span>
            )}
            <a
              href={getDirectionsUrl(center)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => CenterLocatorAnalytics.getDirections(center)}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-spirit-purple-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-spirit-purple-700"
            >
              <Navigation className="h-4 w-4" aria-hidden /> Directions
            </a>
            <Link
              href={detailUrl}
              onClick={() => CenterLocatorAnalytics.viewCenter(center)}
              aria-label={`View details for ${center.name}`}
              title="View details"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-600 text-neutral-500 dark:text-neutral-300 transition-colors hover:border-spirit-purple-300 hover:text-spirit-purple-700 dark:hover:text-spirit-purple-300"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
