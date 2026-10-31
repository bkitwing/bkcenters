'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Search } from 'lucide-react';
import SearchBar from '@/components/SearchBar';

/**
 * Compact locator search on center detail pages.
 * Sends the user home with lat/lng so nearby results load immediately.
 *
 * `variant="inline"`: a single row (label · search · browse link) for use in a
 * page section; the default styling belongs to the center hero.
 */
export default function FindOtherCenters({ variant = 'hero' }: { variant?: 'hero' | 'inline' }) {
  const router = useRouter();

  const search = (
    <SearchBar
      placeholder="City, area, pincode or center name…"
      disableVoiceInput
      onSearchResult={(lat, lng, address) => {
        router.push(
          `/?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`
        );
      }}
    />
  );

  if (variant === 'inline') {
    // Same card look as the center cards above it; on desktop the heading takes
    // one card column and the search the other two, so the edges line up
    return (
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 sm:p-5 lg:grid lg:grid-cols-3 lg:items-center lg:gap-3">
        <div className="lg:pr-3">
          <h3 className="flex items-center gap-2 text-base md:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-spirit-purple-100 text-spirit-purple-700 dark:bg-spirit-purple-900/40 dark:text-spirit-purple-300"
              aria-hidden
            >
              <Search className="h-4 w-4" />
            </span>
            Looking for a different center?
          </h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Find the one closest to your home or work.
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch lg:col-span-2 lg:mt-0">
          <div className="min-w-0 flex-1">{search}</div>
          <Link
            href="/"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-1 rounded-lg border border-spirit-purple-300 dark:border-spirit-purple-700 bg-white dark:bg-neutral-800 px-5 text-sm font-semibold text-spirit-purple-700 dark:text-spirit-purple-300 hover:bg-spirit-purple-50 dark:hover:bg-neutral-700 transition-colors"
          >
            Browse all centers
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bk-center-hero__find">
      <div className="bk-center-hero__find-label">
        <Search className="w-3.5 h-3.5" aria-hidden />
        <span>Find another center</span>
      </div>
      {search}
      <Link href="/" className="bk-center-hero__find-browse">
        Browse all centers
      </Link>
    </div>
  );
}
