import React from 'react';
// Use server-side data functions that read directly from JSON file (ISR-compatible)
import { 
  getDistrictsByState, 
  getStateCentersLightweight, 
  getRegionForState, 
  getRegionBySlug,
  getStateBySlug,
  getStatesByRegionFast,
  summarizeDistricts
} from '@/lib/serverCenterData';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CanonicalRedirect from '@/components/CanonicalRedirect';
import { formatCenterUrl } from '@/lib/urlUtils';
import StatePageClient from './StatePageClient';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { BreadcrumbSchema, PlaceSchema, ItemListSchema } from '@/components/StructuredData';
import { countryLabelFromRegion, districtLevelLabel } from '@/lib/countryUtils';

// Fallback revalidation: 1 day. Sync script triggers on-demand revalidation via /api/revalidate.
export const revalidate = 86400;

// ISR: no pages are built at build time; each is rendered on its first request,
// then served from the cache and refreshed every `revalidate` seconds (or on
// demand via /api/revalidate). Without this, Next renders the route on every request.
export async function generateStaticParams() {
  return [];
}

// Any slug may be requested (rendered on demand, then cached). Slugs with no
// centers return a real 404 (also cached), never an empty page with status 200.
export const dynamicParams = true;

interface StatePageProps {
  params: {
    region: string;
    state: string;
  };
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const stateSlug = decodeURIComponent(params.state);
  const actualState = await getStateBySlug(stateSlug) || stateSlug;
  
  // Lightweight: get region from state→region relation (1 tiny API call)
  const [districts, lightCenters, actualRegion] = await Promise.all([
    getDistrictsByState(actualState),
    getStateCentersLightweight(actualState),
    getRegionForState(actualState),
  ]);
  // Unknown state: 404 here too, so the not-found page carries only noindex
  if (lightCenters.length === 0) notFound();
  
  const country = countryLabelFromRegion(actualRegion);
  const placesLabel = districtLevelLabel(actualRegion, { plural: true }).toLowerCase();
  const title = `${actualState} - Brahma Kumaris Rajyog Meditation Centers - ${actualRegion}`;
  const description = `Find Brahma Kumaris Rajyog meditation centers in ${actualState}, ${country || actualRegion}. ${lightCenters.length} centers across ${districts.length} ${placesLabel}.`;

  const ogImage = generateOgImageUrl({
    title: actualState,
    description: `${lightCenters.length} Centers in ${districts.length} ${districtLevelLabel(actualRegion, { plural: true })}`,
    type: 'state',
    region: actualRegion,
  });

  const canonicalRegionSlug = actualRegion.toLowerCase().replace(/\s+/g, '-');
  const canonicalStateSlug = actualState.toLowerCase().replace(/\s+/g, '-');
  const canonicalUrl = `https://www.brahmakumaris.com/centers/${canonicalRegionSlug}/${canonicalStateSlug}`;

  return {
    title,
    description,
    keywords: `Brahma Kumaris, Rajyog Meditation Centers, ${actualState}, ${actualRegion}${country ? `, ${country}` : ''}, spiritual centers, 7 day courses, meditation retreats`,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Brahma Kumaris Centers in ${actualState}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function StatePage({ params }: StatePageProps) {
  const regionSlug = decodeURIComponent(params.region);
  const stateSlug = decodeURIComponent(params.state);
  
  // Get actual region and state names from slugs (independent lookups, run together)
  const [regionFromSlug, stateFromSlug] = await Promise.all([
    getRegionBySlug(regionSlug),
    getStateBySlug(stateSlug),
  ]);
  const actualRegion = regionFromSlug || regionSlug;
  const actualState = stateFromSlug || stateSlug;
  
  // Get the actual region for this state from our data
  const stateRegion = await getRegionForState(actualState);
  
  const [districts, lightCenters, allStatesInRegion] = await Promise.all([
    getDistrictsByState(actualState),
    getStateCentersLightweight(actualState),
    getStatesByRegionFast(stateRegion || actualRegion),
  ]);

  // Other states in the same region (exclude current state)
  const otherStates = allStatesInRegion
    .filter(s => s.name !== actualState)
    .sort((a, b) => b.centerCount - a.centerCount)
    .slice(0, 12);
  
  // Unknown state (typo, old link): 404 instead of an empty page
  if (lightCenters.length === 0) notFound();

  // Right state under the wrong region in the URL: send visitors on to the
  // canonical URL (see CanonicalRedirect for why it isn't permanentRedirect)
  if (actualRegion !== stateRegion && stateRegion !== 'INDIA') {
    return <CanonicalRedirect href={formatCenterUrl(stateRegion, actualState)} />;
  }
  
  // Summarize centers by district (lightweight data): counts, map position,
  // center locations for distances, and a few area names — most centers first
  const districtSummary = summarizeDistricts(districts, lightCenters);
  
  // Base URL for structured data
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5400/centers' 
    : 'https://www.brahmakumaris.com/centers';

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: actualRegion, url: `${baseUrl}${formatCenterUrl(actualRegion)}` },
    { name: actualState, url: `${baseUrl}${formatCenterUrl(actualRegion, actualState)}` },
  ];

  // Page URL for Place schema
  const pageUrl = `${baseUrl}${formatCenterUrl(actualRegion, actualState)}`;

  // Only districts that have centers — matches the list shown on the page
  const itemListItems = districtSummary.filter((d) => d.centerCount > 0).map((d, idx) => ({
    name: d.district,
    url: `${baseUrl}${formatCenterUrl(actualRegion, actualState, d.district)}`,
    position: idx + 1,
  }));

  return (
    <>
      {/* Structured Data for SEO */}
      <BreadcrumbSchema items={breadcrumbItems} />
      <PlaceSchema 
        name={actualState}
        description={`Find ${lightCenters.length} Brahma Kumaris Rajyoga Meditation Centers across ${districts.length} ${districtLevelLabel(actualRegion, { plural: true }).toLowerCase()} in ${actualState}.`}
        region={actualRegion}
        centerCount={lightCenters.length}
        pageUrl={pageUrl}
        placeType="AdministrativeArea"
      />
      <ItemListSchema
        name={`Brahma Kumaris Centers in ${actualState} — ${districtLevelLabel(actualRegion, { plural: true })} List`}
        description={`${districts.length} ${districtLevelLabel(actualRegion, { plural: true }).toLowerCase()} with Brahma Kumaris Rajyoga meditation centers in ${actualState}.`}
        url={pageUrl}
        items={itemListItems}
      />
      <StatePageClient 
        actualRegion={actualRegion}
        actualState={actualState}
        stateRegion={stateRegion}
        districts={districts}
        totalCenters={lightCenters.length}
        districtSummary={districtSummary}
        otherStates={otherStates}
      />
    </>
  );
}