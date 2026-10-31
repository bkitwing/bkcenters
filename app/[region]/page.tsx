import React from 'react';
// Use server-side data functions — targeted Strapi queries per page
import { 
  getStatesByRegionFast,
  getRegionBySlug,
  getRegionStateDetails,
  getRegions
} from '@/lib/serverCenterData';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatCenterUrl } from '@/lib/urlUtils';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { BreadcrumbSchema, PlaceSchema, ItemListSchema } from '@/components/StructuredData';
import RegionPageClient from './RegionPageClient';
import { countryLabelFromRegion, districtLevelLabel, stateLevelLabel } from '@/lib/countryUtils';

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

// Define a unified type for state data
interface StateData {
  name: string;
  centerCount: number;
  districtCount: number;
}

interface RegionPageProps {
  params: {
    region: string;
  };
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const regionSlug = decodeURIComponent(params.region);
  const actualRegion = await getRegionBySlug(regionSlug) || regionSlug;
  
  // Get state stats (lightweight — no full center objects)
  const states = await getStatesByRegionFast(actualRegion);
  // Unknown region: 404 here too, so the not-found page carries only noindex
  if (states.length === 0) notFound();
  const totalCenters = states.reduce((sum, state) => sum + state.centerCount, 0);
  
  const country = countryLabelFromRegion(actualRegion);
  const areasLabel = stateLevelLabel(actualRegion, { plural: true }).toLowerCase();
  const placesLabel = districtLevelLabel(actualRegion, { plural: true });
  const title = `${actualRegion} - Brahma Kumaris Rajyog Meditation Centers`;
  const description = `Explore Brahma Kumaris Rajyog meditation centers in ${actualRegion}${country && country !== actualRegion ? `, ${country}` : ''}. ${totalCenters} centers across ${states.length} ${areasLabel}.`;

  // Calculate total districts
  const districts = states.reduce((sum, state) => sum + state.districtCount, 0);

  const pageTitle = `${actualRegion} Rajyoga Meditation Center`;
  const imageTitle = actualRegion;

  const ogImage = generateOgImageUrl({
    title: actualRegion,
    description: `${totalCenters} Centers in ( ${states.length} ${stateLevelLabel(actualRegion, { plural: true, short: true })} & ${districts} ${placesLabel})`,
    type: 'region',
    region: actualRegion,
  });

  const canonicalUrl = `https://www.brahmakumaris.com/centers/${actualRegion.toLowerCase().replace(/\s+/g, '-')}`;

  return {
    title,
    description,
    keywords: `Brahma Kumaris, Rajyog Meditation Centers, ${actualRegion}${country ? `, ${country}` : ''}, spiritual centers, meditation centers`,
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
          alt: `Brahma Kumaris Centers in ${actualRegion}`,
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

export default async function RegionPage({ params }: RegionPageProps) {
  const regionSlug = decodeURIComponent(params.region);
  const region = await getRegionBySlug(regionSlug) || regionSlug;
  
  // State counts (structured data), per-state details for the list and map
  // (top cities, locations), and the other countries in this locator
  const [states, stateDetails, regionNames] = await Promise.all([
    getStatesByRegionFast(region),
    getRegionStateDetails(region),
    getRegions().catch(() => [] as string[]),
  ]);
  // Unknown region (typo, old link): 404 instead of an empty page
  if (states.length === 0) notFound();
  const otherRegions = (
    await Promise.all(
      regionNames
        .filter((name) => name !== region)
        .map(async (name) => ({
          name,
          centerCount: (await getStatesByRegionFast(name)).reduce((sum, s) => sum + s.centerCount, 0),
        }))
    )
  ).filter((r) => r.centerCount > 0);
  
  // Calculate totals
  const totalCenters = states.reduce((sum, state) => sum + state.centerCount, 0);
  
  // Base URL for structured data
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5400/centers' 
    : 'https://www.brahmakumaris.com/centers';

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: region, url: `${baseUrl}${formatCenterUrl(region)}` },
  ];

  // Page URL for Place schema
  const pageUrl = `${baseUrl}${formatCenterUrl(region)}`;

  const itemListItems = states.map((state, idx) => ({
    name: state.name,
    url: `${baseUrl}${formatCenterUrl(region, state.name)}`,
    position: idx + 1,
  }));

  return (
    <>
      {/* Structured Data for SEO */}
      <BreadcrumbSchema items={breadcrumbItems} />
      <PlaceSchema 
        name={region}
        description={`Explore ${totalCenters} Brahma Kumaris Rajyoga Meditation Centers across ${states.length} ${stateLevelLabel(region, { plural: true }).toLowerCase()} in ${region}.`}
        centerCount={totalCenters}
        pageUrl={pageUrl}
      />
      <ItemListSchema
        name={`Brahma Kumaris Centers in ${region} — ${stateLevelLabel(region, { plural: true })} List`}
        description={`${states.length} ${stateLevelLabel(region, { plural: true }).toLowerCase()} with Brahma Kumaris Rajyoga meditation centers in ${region}.`}
        url={pageUrl}
        items={itemListItems}
      />

      <RegionPageClient region={region} states={stateDetails} otherRegions={otherRegions} />
    </>
  );
} 