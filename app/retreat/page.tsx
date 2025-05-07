import React from 'react';
import Link from 'next/link';
import { getRetreatCenters } from '@/lib/centerData';
import { RETREAT_CENTER_BRANCH_CODES } from '@/lib/retreatCenters';
import { Metadata } from 'next';
import { formatCenterUrl } from '@/lib/urlUtils';
import { Center } from '@/lib/types';
import MapSection from '@/components/MapSection';
import { generateOgImageUrl } from '@/lib/ogUtils';
import RetreatPageClient from './RetreatPageClient';

export async function generateMetadata(): Promise<Metadata> {
  // Get retreat centers to count them
  const retreatCenters = await getRetreatCenters();
  
  // Count unique states
  const uniqueStates = new Set(retreatCenters.map(center => center.state));
  const stateCount = uniqueStates.size;
  
  const title = 'Retreat Centers - Brahma Kumaris Rajyog Meditation Centers';
  const description = `Find and explore ${retreatCenters.length} Brahma Kumaris retreat centers across ${stateCount} states in India. View locations, contact information, and more.`;

  return {
    title,
    description,
    keywords: 'Brahma Kumaris, retreat centers, spiritual retreats, meditation retreats, India',
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: generateOgImageUrl({
            title: 'Retreat Centers',
            description: `${retreatCenters.length} Retreat Centers in ${stateCount} States`,
            type: 'retreat'
          }),
          width: 1200,
          height: 630,
          alt: 'Brahma Kumaris Retreat Centers',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function RetreatCentersPage() {
  try {
    // Get all retreat centers
    const retreatCenters = await getRetreatCenters();
    
    // Centers are already sorted in getRetreatCenters function
    const sortedCenters = retreatCenters;

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex mb-6 text-sm">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="text-neutral-500 hover:text-primary">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <span className="font-medium text-primary">
                Retreat Centers
              </span>
            </li>
          </ol>
        </nav>
        
        <h1 className="text-3xl font-bold spiritual-text-gradient mb-2">Brahma Kumaris Retreat Centers</h1>
        <p className="text-sm text-neutral-600 mb-6">
          {retreatCenters.length} dedicated retreat {retreatCenters.length === 1 ? 'center' : 'centers'} across India for spiritual renewal and meditation practice
        </p>
        
        {retreatCenters.length > 0 ? (
          <RetreatPageClient centers={sortedCenters} />
        ) : (
          <div className="bg-light p-8 rounded-lg shadow-md text-center border border-neutral-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-4 text-neutral-700">No Retreat Centers Found</h2>
            <p className="text-neutral-600 mb-6">
              We are currently unable to load the retreat centers. Please try again later.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/" className="btn-primary">
                View All Centers
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in RetreatCentersPage:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold mb-4 text-red-700">Error Loading Retreat Centers</h2>
          <p className="text-red-600 mb-6">
            We encountered an error while loading the retreat centers. Please try again later.
          </p>
          <div className="flex justify-center">
            <Link href="/" className="btn-primary">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

// Helper functions
function formatAddress(center: Center) {
  if (!center.address) return 'Address not available';
  
  const { line1, line2, line3, city, pincode } = center.address;
  let addressParts = [];
  
  if (line1) addressParts.push(line1);
  if (line2) addressParts.push(line2);
  if (line3) addressParts.push(line3);
  if (city) addressParts.push(city);
  if (pincode) addressParts.push(pincode);
  
  return addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
}

function getGoogleMapsUrl(center: Center) {
  const formattedAddress = formatAddress(center);
  
  if (center.coords && center.coords.length === 2) {
    const [lat, lng] = center.coords;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  } else {
    // If no coordinates, just use the address
    const address = encodeURIComponent(formattedAddress);
    return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
  }
} 