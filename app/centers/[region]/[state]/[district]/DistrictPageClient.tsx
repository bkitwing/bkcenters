'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import CenterMap from '@/components/CenterMap';
import CenterCard from '@/components/CenterCard';
import { Center } from '@/lib/types';
import { formatCenterUrl } from '@/lib/urlUtils';

interface DistrictPageClientProps {
  actualRegion: string;
  actualState: string;
  actualDistrict: string;
  stateRegion: string;
  centers: Center[];
}

export default function DistrictPageClient({
  actualRegion,
  actualState,
  actualDistrict,
  stateRegion,
  centers,
}: DistrictPageClientProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Filter centers based on search query
  const filteredCenters = useMemo(() => {
    if (searchQuery.trim() === "") {
      return centers;
    }
    return centers.filter(center => 
      center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (center.address?.line1 && center.address.line1.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (center.address?.line2 && center.address.line2.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (center.address?.line3 && center.address.line3.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (center.address?.city && center.address.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (center.address?.pincode && center.address.pincode.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [centers, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/centers" className="text-neutral-500 hover:text-primary">
              Centers
            </Link>
          </li>
          <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href={formatCenterUrl(stateRegion)} className="text-neutral-500 hover:text-primary">
              {stateRegion}
            </Link>
          </li>
          <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <Link href={formatCenterUrl(stateRegion, actualState)} className="text-neutral-500 hover:text-primary">
              {actualState}
            </Link>
          </li>
          <li className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <span className="font-medium text-primary">
              {actualDistrict}
            </span>
          </li>
        </ol>
      </nav>
      
      <h1 className="text-3xl mb-2 font-bold spiritual-text-gradient">{actualDistrict} Centers</h1>
      <p className="text-sm text-neutral-600 mb-6">
        {centers.length} Brahma Kumaris meditation {centers.length === 1 ? 'center' : 'centers'} in {actualDistrict}, {actualState}
      </p>
      
      {centers.length > 0 && (
        <div className="mb-10">
          <div className="h-[400px] border border-neutral-200 rounded-lg overflow-hidden shadow-md mb-8">
            <CenterMap 
              centers={filteredCenters} 
              autoZoom={filteredCenters.length > 0}
              initialZoom={filteredCenters.length === 0 ? 13 : undefined}
            />
          </div>
          
          {/* Search input */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder={`Search centers within ${actualDistrict}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {filteredCenters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCenters.map((center) => (
                <div key={center.branch_code} className="h-full">
                  <CenterCard center={center} hideViewIcon={true} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500">No centers found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
      
      {centers.length === 0 && (
        <div className="bg-light p-8 rounded-lg shadow-md text-center border border-neutral-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold mb-4 text-neutral-700">No Centers Found</h2>
          <p className="text-neutral-600 mb-6">
            We couldn't find any meditation centers in {actualDistrict}, {actualState}.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={formatCenterUrl(stateRegion, actualState)} className="btn-primary">
              View Other Districts in {actualState}
            </Link>
            <Link href="/centers" className="btn-secondary">
              Explore All Centers
            </Link>
          </div>
        </div>
      )}
      
      <div className="mt-8 pt-6 border-t border-neutral-200">
        <Link href={formatCenterUrl(stateRegion, actualState)} className="text-primary hover:underline inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {actualState} Districts
        </Link>
      </div>
    </div>
  );
} 