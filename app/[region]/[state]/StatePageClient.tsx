'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatCenterUrl } from '@/lib/urlUtils';
import { currentPageUrl, placeShareMessage } from '@/lib/shareText';
import { ShareSheet } from '@/components/ContactSheet';
import type { DistrictDetail } from '@/lib/serverCenterData';
import AreasExplorer, { ExplorerArea } from '@/components/AreasExplorer';
import { ArrowRight, ChevronRight, Search, Share2, Sparkles, BookOpen, Users } from 'lucide-react';
import SoulSustenance from '@/components/SoulSustenance';
import { districtLevelLabel, stateLevelLabel } from '@/lib/countryUtils';

interface StatePageClientProps {
  actualRegion: string;
  actualState: string;
  stateRegion: string;
  districts: string[];
  totalCenters: number;
  districtSummary: DistrictDetail[];
  otherStates: {
    name: string;
    centerCount: number;
    districtCount: number;
  }[];
}

const districtCode = (district: string) => `district-${district.toLowerCase().replace(/\s+/g, '-')}`;

export default function StatePageClient({
  actualRegion,
  actualState,
  stateRegion,
  totalCenters,
  districtSummary,
  otherStates
}: StatePageClientProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const placeLabel = districtLevelLabel(stateRegion);
  const placesLabel = districtLevelLabel(stateRegion, { plural: true });
  const placesLabelLower = placesLabel.toLowerCase();
  const areasLabel = stateLevelLabel(stateRegion, { plural: true });

  // Only districts that have centers (an empty district page helps nobody)
  const areas: ExplorerArea[] = useMemo(
    () =>
      districtSummary
        .filter((item) => item.centerCount > 0)
        .map((item) => ({
          code: districtCode(item.district),
          name: item.district,
          href: formatCenterUrl(stateRegion, actualState, item.district),
          centerCount: item.centerCount,
          highlights: item.areas,
          moreCount: Math.max(0, item.centerCount - item.areas.length),
          coords: item.coords,
          points: item.points,
        })),
    [districtSummary, stateRegion, actualState]
  );
  const centersWord = (n: number) => (n === 1 ? 'center' : 'centers');


  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      <section className="container mx-auto max-w-7xl px-4 pt-3 sm:pt-5 pb-28 lg:pb-12" aria-labelledby="state-heading">
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
            <li aria-current="page" className="font-medium text-neutral-700 dark:text-neutral-200">{actualState}</li>
          </ol>
        </nav>

        {/* Title + share */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* One keyword-rich heading; the line below adds facts instead of repeating it */}
            <h1 id="state-heading" className="text-2xl sm:text-3xl font-bold leading-tight text-neutral-900 dark:text-neutral-100">
              Rajyoga Meditation Centers in {actualState}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {totalCenters.toLocaleString()} {centersWord(totalCenters)} · {areas.length}{' '}
              {areas.length === 1 ? placeLabel.toLowerCase() : placesLabelLower}
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
            <span className="sr-only sm:hidden">Share centers in {actualState}</span>
          </button>
          {shareOpen && (
            <ShareSheet
              subtitle={`Centers in ${actualState}`}
              message={placeShareMessage(actualState, `${totalCenters.toLocaleString()} ${centersWord(totalCenters)} in ${areas.length} ${areas.length === 1 ? placeLabel.toLowerCase() : placesLabelLower}`, currentPageUrl())}
              onClose={() => setShareOpen(false)}
            />
          )}
        </div>

        {areas.length > 0 ? (
          <AreasExplorer
            areas={areas}
            placesLabel={placesLabelLower}
            region={actualRegion}
            state={actualState}
          />
        ) : (
          <div className="mt-6 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-10 text-center">
            <Search className="w-14 h-14 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" aria-hidden />
            <h2 className="text-2xl font-bold mb-3 text-neutral-700 dark:text-neutral-300">No Centers Found</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm max-w-md mx-auto">
              We couldn&apos;t find any Rajyoga meditation centers in {actualState}.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 px-5 py-2.5 rounded-xl font-medium text-sm hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600 transition-all">
              Explore All Centers
            </Link>
          </div>
        )}
      </section>

      <div className="container mx-auto max-w-7xl px-4 pb-10 space-y-10">
        {/* ===== OTHER STATES IN THE REGION ===== */}
        {otherStates.length > 0 && (
          <nav aria-labelledby="other-states-heading">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 id="other-states-heading" className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Other {areasLabel.toLowerCase()} in {stateRegion}
              </h2>
              <Link
                href={formatCenterUrl(stateRegion)}
                className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-spirit-purple-700 dark:text-spirit-purple-300 hover:underline underline-offset-2"
              >
                All of {stateRegion}
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>
            <ul className="flex flex-wrap gap-2">
              {otherStates.map((item) => (
                <li key={item.name}>
                  <Link
                    href={formatCenterUrl(stateRegion, item.name)}
                    prefetch={false}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:border-spirit-purple-400 hover:text-spirit-purple-700 dark:hover:border-spirit-purple-500 dark:hover:text-spirit-purple-300 transition-colors"
                  >
                    {item.name}
                    <span className="tabular-nums text-neutral-400 dark:text-neutral-500">{item.centerCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* ===== ABOUT / INFO SECTION ===== */}
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
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">All classes are open to people of every age, background, and faith. </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-spirit-gold-100 to-spirit-purple-100 dark:from-spirit-gold-900/30 dark:to-spirit-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-spirit-gold-600 dark:text-spirit-gold-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-1">Always Free</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">All programs, classes, and courses at Brahma Kumaris are offered completely free of charge as a service to the community.</p>
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
