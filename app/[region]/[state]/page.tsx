import React from 'react';
import Link from 'next/link';
// Use server-side data functions that read directly from JSON file (ISR-compatible)
import { 
  getDistrictsByState, 
  getStateCentersLightweight, 
  getRegionForState, 
  getRegionBySlug,
  getStateBySlug
} from '@/lib/serverCenterData';
import { Metadata } from 'next';
import { formatCenterUrl } from '@/lib/urlUtils';
import StatePageClient from './StatePageClient';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { BreadcrumbSchema, PlaceSchema, ItemListSchema } from '@/components/StructuredData';

// Fallback revalidation: 1 day. Sync script triggers on-demand revalidation via /api/revalidate.
export const revalidate = 86400;

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
  
  const title = `${actualState} - Brahma Kumaris Rajyog Meditation Centers - ${actualRegion}`;
  const description = `Find Brahma Kumaris Rajyog meditation centers in ${actualState}. ${lightCenters.length} centers across ${districts.length} districts.`;

  const ogImage = generateOgImageUrl({
    title: actualState,
    description: `${lightCenters.length} Centers in ${districts.length} Districts`,
    type: 'state',
    region: actualRegion,
  });

  const canonicalRegionSlug = actualRegion.toLowerCase().replace(/\s+/g, '-');
  const canonicalStateSlug = actualState.toLowerCase().replace(/\s+/g, '-');
  const canonicalUrl = `https://www.brahmakumaris.com/centers/${canonicalRegionSlug}/${canonicalStateSlug}`;

  return {
    title,
    description,
    keywords: `Brahma Kumaris, Rajyog Meditation Centers, ${actualState}, ${actualRegion}, spiritual centers, 7 day courses, meditation retreats`,
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
  
  // Get actual region and state names from slugs
  const actualRegion = await getRegionBySlug(regionSlug) || regionSlug;
  const actualState = await getStateBySlug(stateSlug) || stateSlug;
  
  // Get the actual region for this state from our data
  const stateRegion = await getRegionForState(actualState);
  
  const [districts, lightCenters] = await Promise.all([
    getDistrictsByState(actualState),
    getStateCentersLightweight(actualState),
  ]);
  
  // Check if the URL region matches the actual region
  if (actualRegion !== stateRegion && stateRegion !== 'INDIA') {
    // Redirect to the correct URL
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl mb-4">Redirecting to correct region...</h1>
        <p>The state {actualState} belongs to region {stateRegion}, not {actualRegion}.</p>
        <p className="mt-4">
          <Link href="/" className="text-primary">
            Click here if you are not redirected automatically.
          </Link>
        </p>
        <script dangerouslySetInnerHTML={{ __html: `window.location.href = "${formatCenterUrl(stateRegion, actualState)}";` }} />
      </div>
    );
  }
  
  // Summarize centers by district (using lightweight data — no full Center objects)
  const districtSummary = districts.map(district => {
    const centersInDistrict = lightCenters.filter(c => c.district === district);
    return {
      district,
      centerCount: centersInDistrict.length,
      coords: centersInDistrict.length > 0 ? centersInDistrict[0].coords : null
    };
  }).sort((a, b) => b.centerCount - a.centerCount); // Sort by number of centers (most first)
  
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

  const itemListItems = districtSummary.map((d, idx) => ({
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
        description={`Find ${lightCenters.length} Brahma Kumaris Rajyoga Meditation Centers across ${districts.length} districts in ${actualState}.`}
        region={actualRegion}
        centerCount={lightCenters.length}
        pageUrl={pageUrl}
        placeType="AdministrativeArea"
      />
      <ItemListSchema
        name={`Brahma Kumaris Centers in ${actualState} — Districts List`}
        description={`${districts.length} districts with Brahma Kumaris Rajyoga meditation centers in ${actualState}.`}
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
      />
    </>
  );
}