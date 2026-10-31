import React from 'react';
// Use server-side data functions that read directly from JSON file (ISR-compatible)
import {
  getCentersByDistrict,
  getDistrictsByState,
  getStateCentersLightweight,
  getRegionForState,
  getRegionBySlug,
  getStateBySlug,
  getDistrictBySlug
} from '@/lib/serverCenterData';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CanonicalRedirect from '@/components/CanonicalRedirect';
import { formatCenterUrl } from '@/lib/urlUtils';
import DistrictPageClient from './DistrictPageClient';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { BreadcrumbSchema, PlaceSchema, ItemListSchema } from '@/components/StructuredData';
import { countryLabelFromRegion } from '@/lib/countryUtils';

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

interface DistrictPageProps {
  params: {
    region: string;
    state: string;
    district: string;
  };
}

export async function generateMetadata({ params }: DistrictPageProps): Promise<Metadata> {
  const stateSlug = decodeURIComponent(params.state);
  const districtSlug = decodeURIComponent(params.district);
  
  const [stateFromSlug, districtFromSlug] = await Promise.all([
    getStateBySlug(stateSlug),
    getDistrictBySlug(stateSlug, districtSlug),
  ]);
  const actualState = stateFromSlug || stateSlug;
  const actualDistrict = districtFromSlug || districtSlug;
  
  // Parallel: fetch centers + region (lightweight state→region relation)
  const [centers, actualRegion] = await Promise.all([
    getCentersByDistrict(actualState, actualDistrict),
    getRegionForState(actualState),
  ]);
  // Unknown city: 404 here too, so the not-found page carries only noindex
  if (centers.length === 0) notFound();
  
  const country = countryLabelFromRegion(actualRegion);
  const title = `${actualDistrict} - Brahma Kumaris Rajyog Meditation Centers - ${actualState}`;
  const description = `Discover ${centers.length} Brahma Kumaris Rajyog meditation centers in ${actualDistrict}, ${actualState}, ${country || actualRegion}.`;

  const ogImage = generateOgImageUrl({
    title: actualDistrict,
    type: 'district',
    subtitle: [actualState, country].filter(Boolean).join(', '),
    stats: [{ value: centers.length, label: centers.length === 1 ? 'center' : 'centers' }],
  });

  const canonicalRegionSlug = actualRegion.toLowerCase().replace(/\s+/g, '-');
  const canonicalStateSlug = actualState.toLowerCase().replace(/\s+/g, '-');
  const canonicalDistrictSlug = actualDistrict.toLowerCase().replace(/\s+/g, '-');
  const canonicalUrl = `https://www.brahmakumaris.com/centers/${canonicalRegionSlug}/${canonicalStateSlug}/${canonicalDistrictSlug}`;

  return {
    title,
    description,
    keywords: `Brahma Kumaris, Rajyog Meditation centers, ${actualDistrict}, ${actualState}, ${country || actualRegion}, spiritual centers, 7 day courses, meditation retreats`,
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
          alt: `Brahma Kumaris Centers in ${actualDistrict}, ${actualState}`,
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

export default async function DistrictPage({ params }: DistrictPageProps) {
  const regionSlug = decodeURIComponent(params.region);
  const stateSlug = decodeURIComponent(params.state);
  const districtSlug = decodeURIComponent(params.district);
  
  // Get actual names from slugs (independent lookups, run together)
  const [regionFromSlug, stateFromSlug, districtFromSlug] = await Promise.all([
    getRegionBySlug(regionSlug),
    getStateBySlug(stateSlug),
    getDistrictBySlug(stateSlug, districtSlug),
  ]);
  const actualRegion = regionFromSlug || regionSlug;
  const actualState = stateFromSlug || stateSlug;
  const actualDistrict = districtFromSlug || districtSlug;
  
  // Get the actual region for this state from our data
  const stateRegion = await getRegionForState(actualState);
  
  // State centers (lightweight, same cached call the state page uses) give the
  // "Other cities in <state>" links with their center counts
  const [centers, stateCenters] = await Promise.all([
    getCentersByDistrict(actualState, actualDistrict),
    getStateCentersLightweight(actualState).catch(() => []),
  ]);

  const districtCounts = new Map<string, number>();
  stateCenters.forEach((center) => {
    if (center.district && center.district !== actualDistrict) {
      districtCounts.set(center.district, (districtCounts.get(center.district) || 0) + 1);
    }
  });
  const otherDistricts = Array.from(districtCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({
      name,
      count,
      href: formatCenterUrl(stateRegion, actualState, name),
    }));

  // Unknown city (typo, old link): 404 instead of an empty page
  if (centers.length === 0) notFound();

  // Right city under the wrong region in the URL: send visitors on to the
  // canonical URL (see CanonicalRedirect for why it isn't permanentRedirect)
  if (actualRegion !== stateRegion && stateRegion !== 'INDIA') {
    return <CanonicalRedirect href={formatCenterUrl(stateRegion, actualState, actualDistrict)} />;
  }
  
  // Base URL for structured data
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5400/centers' 
    : 'https://www.brahmakumaris.com/centers';

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: actualRegion, url: `${baseUrl}${formatCenterUrl(actualRegion)}` },
    { name: actualState, url: `${baseUrl}${formatCenterUrl(actualRegion, actualState)}` },
    { name: actualDistrict, url: `${baseUrl}${formatCenterUrl(actualRegion, actualState, actualDistrict)}` },
  ];

  // Page URL for Place schema
  const pageUrl = `${baseUrl}${formatCenterUrl(actualRegion, actualState, actualDistrict)}`;

  const itemListItems = centers.map((center, idx) => ({
    name: center.name,
    url: `${baseUrl}${formatCenterUrl(actualRegion, actualState, actualDistrict, center.name)}`,
    position: idx + 1,
  }));

  return (
    <>
      {/* Structured Data for SEO */}
      <BreadcrumbSchema items={breadcrumbItems} />
      <PlaceSchema 
        name={actualDistrict}
        description={`Discover ${centers.length} Brahma Kumaris Rajyoga Meditation Centers in ${actualDistrict}, ${actualState}.`}
        state={actualState}
        region={actualRegion}
        centerCount={centers.length}
        pageUrl={pageUrl}
        placeType="AdministrativeArea"
      />
      <ItemListSchema
        name={`Brahma Kumaris Meditation Centers in ${actualDistrict}, ${actualState}`}
        description={`${centers.length} Brahma Kumaris Rajyoga meditation centers in ${actualDistrict} district, ${actualState}.`}
        url={pageUrl}
        items={itemListItems}
      />
      <DistrictPageClient
        actualRegion={actualRegion}
        actualState={actualState}
        actualDistrict={actualDistrict}
        stateRegion={stateRegion}
        centers={centers}
        otherDistricts={otherDistricts}
      />
    </>
  );
} 