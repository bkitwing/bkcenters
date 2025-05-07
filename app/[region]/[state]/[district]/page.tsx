import React from 'react';
import Link from 'next/link';
import { 
  getCentersByDistrict, 
  getDistrictsByState, 
  getRegionForState,
  getRegionBySlug,
  getStateBySlug,
  getDistrictBySlug
} from '@/lib/centerData';
import { Metadata } from 'next';
import { formatCenterUrl } from '@/lib/urlUtils';
import DistrictPageClient from './DistrictPageClient';
import { generateOgImageUrl } from '@/lib/ogUtils';

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

  return {
    title,
    description,
    keywords: `Brahma Kumaris, Rajyog Meditation centers, ${actualDistrict}, ${actualState}, spiritual centers, 7 day courses, meditation retreats`,
    openGraph: {
      title,
      description,
      type: 'website',
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
  
  return (
    <DistrictPageClient
      actualRegion={actualRegion}
      actualState={actualState}
      actualDistrict={actualDistrict}
      stateRegion={stateRegion}
      centers={centers}
    />
  );
} 