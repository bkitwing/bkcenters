import React from 'react';
import Link from 'next/link';
// Use server-side data functions that read directly from JSON file (ISR-compatible)
import { 
  getDistrictsByState, 
  getCentersByState, 
  getRegionForState, 
  getRegionBySlug,
  getStateBySlug
} from '@/lib/serverCenterData';
import { Metadata } from 'next';
import { formatCenterUrl } from '@/lib/urlUtils';
import StatePageClient from './StatePageClient';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { BreadcrumbSchema, PlaceSchema } from '@/components/StructuredData';

// ISR: Page will be generated on first request and cached until next build
// Since Center-Processed.json only changes during build, we can cache indefinitely
export const revalidate = false;

interface StatePageProps {
  params: {
    region: string;
    state: string;
  };
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const stateSlug = decodeURIComponent(params.state);
  const actualState = await getStateBySlug(stateSlug) || stateSlug;
  
  // Get all centers in this state to determine the correct region
  const centers = await getCentersByState(actualState);
  const districts = await getDistrictsByState(actualState);
  const actualRegion = centers.length > 0 ? centers[0].region : decodeURIComponent(params.region);
  
  const title = `${actualState} - Brahma Kumaris Rajyog Meditation Centers - ${actualRegion}`;
  const description = `Find Brahma Kumaris Rajyog meditation centers in ${actualState}. ${centers.length} centers across ${districts.length} districts.`;

  const ogImage = generateOgImageUrl({
    title: actualState,
    description: `${centers.length} Centers in ${districts.length} Districts`,
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
  
  const districts = await getDistrictsByState(actualState);
  const centers = await getCentersByState(actualState);
  
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
  
  // Summarize centers by district
  const districtSummary = districts.map(district => {
    const centersInDistrict = centers.filter(center => center.district === district);
    return {
      district,
      centerCount: centersInDistrict.length,
      // Use the first center's coordinates for the district marker
      coords: centersInDistrict.length > 0 ? centersInDistrict[0].coords : null
    };
  }).sort((a, b) => b.centerCount - a.centerCount); // Sort by number of centers (most first)
  
  // Base URL for structured data
  const baseUrl = process.env.NODE_ENV === 'development' || process.env.IS_LOCAL === 'true' 
    ? 'http://localhost:5400' 
    : 'https://www.brahmakumaris.com/centers';

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: actualRegion, url: `${baseUrl}${formatCenterUrl(actualRegion)}` },
    { name: actualState, url: `${baseUrl}${formatCenterUrl(actualRegion, actualState)}` },
  ];

  // Page URL for Place schema
  const pageUrl = `${baseUrl}${formatCenterUrl(actualRegion, actualState)}`;

  return (
    <>
      {/* Structured Data for SEO */}
      <BreadcrumbSchema items={breadcrumbItems} />
      <PlaceSchema 
        name={actualState}
        description={`Find ${centers.length} Brahma Kumaris Rajyoga Meditation Centers across ${districts.length} districts in ${actualState}.`}
        region={actualRegion}
        centerCount={centers.length}
        pageUrl={pageUrl}
      />
      <StatePageClient 
        actualRegion={actualRegion}
        actualState={actualState}
        stateRegion={stateRegion}
        districts={districts}
        centers={centers}
        districtSummary={districtSummary}
      />
    </>
  );
}