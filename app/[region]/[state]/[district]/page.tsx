import React from 'react';
import Link from 'next/link';
// Use server-side data functions that read directly from JSON file (ISR-compatible)
import { 
  getCentersByDistrict, 
  getDistrictsByState, 
  getRegionForState,
  getRegionBySlug,
  getStateBySlug,
  getDistrictBySlug
} from '@/lib/serverCenterData';
import { Metadata } from 'next';
import { formatCenterUrl } from '@/lib/urlUtils';
import DistrictPageClient from './DistrictPageClient';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { BreadcrumbSchema, PlaceSchema } from '@/components/StructuredData';

// ISR: Page will be generated on first request and cached until next build
// Since Center-Processed.json only changes during build, we can cache indefinitely
export const revalidate = false;

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
  
  const actualState = await getStateBySlug(stateSlug) || stateSlug;
  const actualDistrict = await getDistrictBySlug(stateSlug, districtSlug) || districtSlug;
  
  // Get all centers in this district to determine the correct region
  const centers = await getCentersByDistrict(actualState, actualDistrict);
  const actualRegion = centers.length > 0 ? centers[0].region : decodeURIComponent(params.region);
  
  const title = `${actualDistrict} - Brahma Kumaris Rajyog Meditation Centers - ${actualState}`;
  const description = `Discover ${centers.length} Brahma Kumaris Rajyog meditation centers in ${actualDistrict}, ${actualState}.`;

  const ogImage = generateOgImageUrl({
    title: actualDistrict,
    description: `${centers.length} Meditation Centers`,
    type: 'district',
    state: actualState,
    region: actualRegion,
  });

  const canonicalRegionSlug = actualRegion.toLowerCase().replace(/\s+/g, '-');
  const canonicalStateSlug = actualState.toLowerCase().replace(/\s+/g, '-');
  const canonicalDistrictSlug = actualDistrict.toLowerCase().replace(/\s+/g, '-');
  const canonicalUrl = `https://www.brahmakumaris.com/centers/${canonicalRegionSlug}/${canonicalStateSlug}/${canonicalDistrictSlug}`;

  return {
    title,
    description,
    keywords: `Brahma Kumaris, Rajyog Meditation centers, ${actualDistrict}, ${actualState}, spiritual centers, 7 day courses, meditation retreats`,
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
  
  // Get actual names from slugs
  const actualRegion = await getRegionBySlug(regionSlug) || regionSlug;
  const actualState = await getStateBySlug(stateSlug) || stateSlug;
  const actualDistrict = await getDistrictBySlug(stateSlug, districtSlug) || districtSlug;
  
  // Get the actual region for this state from our data
  const stateRegion = await getRegionForState(actualState);
  
  const centers = await getCentersByDistrict(actualState, actualDistrict);
  
  // Check if the URL region matches the actual region
  if (actualRegion !== stateRegion && stateRegion !== 'INDIA') {
    // Redirect to the correct URL
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl mb-4">Redirecting to correct region...</h1>
        <p>The state {actualState} belongs to region {stateRegion}, not {actualRegion}.</p>
        <p className="mt-4">
          <Link href={formatCenterUrl(stateRegion, actualState, actualDistrict)} className="text-primary">
            Click here if you are not redirected automatically.
          </Link>
        </p>
        <script dangerouslySetInnerHTML={{ __html: `window.location.href = "${formatCenterUrl(stateRegion, actualState, actualDistrict)}";` }} />
      </div>
    );
  }
  
  // Base URL for structured data
  const baseUrl = process.env.NODE_ENV === 'development' || process.env.IS_LOCAL === 'true' 
    ? 'http://localhost:5400' 
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
      />
      <DistrictPageClient
        actualRegion={actualRegion}
        actualState={actualState}
        actualDistrict={actualDistrict}
        stateRegion={stateRegion}
        centers={centers}
      />
    </>
  );
} 