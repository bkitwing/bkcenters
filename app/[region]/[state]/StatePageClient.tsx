'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import CenterMap from '@/components/CenterMap';
import { Center } from '@/lib/types';
import { formatCenterUrl } from '@/lib/urlUtils';
import SearchBar from '@/components/SearchBar';

interface StatePageClientProps {
  actualRegion: string;
  actualState: string;
  stateRegion: string;
  districts: string[];
  centers: Center[];
  districtSummary: {
    district: string;
    centerCount: number;
    coords: any | null;
  }[];
}

export default function StatePageClient({
  actualRegion,
  actualState,
  stateRegion,
  districts,
  centers,
  districtSummary
}: StatePageClientProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Prepare all district map markers - computed once
  const allDistrictMarkers = useMemo(() => {
    return districtSummary.map(item => {
      if (!item.coords) return null;
      
      // Find a center to use as the base for the marker
      const sampleCenter = centers.find(center => center.district === item.district);
      if (!sampleCenter) return null;
      
      return {
        ...sampleCenter,
        name: item.district,
        description: `${item.centerCount} meditation ${item.centerCount === 1 ? 'center' : 'centers'}`,
        district_total: item.centerCount,
        is_district_summary: true,
        // Add the district name for filtering
        district: item.district
      };
    }).filter(Boolean) as Center[];
  }, [centers, districtSummary]);
  
  // Filter districts based on search query
  const filteredDistricts = useMemo(() => {
    if (searchQuery.trim() === "") {
      return districtSummary;
    }
    return districtSummary.filter(item => 
      item.district.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [districtSummary, searchQuery]);
  
  // Filter map markers based on the same search query
  const filteredMapMarkers = useMemo(() => {
    if (searchQuery.trim() === "") {
      return allDistrictMarkers;
    }
    return allDistrictMarkers.filter(marker => 
      marker.district?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allDistrictMarkers, searchQuery]);

  // Handle search query clear
  const handleClearSearch = () => {
    setSearchQuery("");
  };
  
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
            <span className="font-medium text-primary">
              {actualState}
            </span>
          </li>
        </ol>
      </nav>
      
      <h1 className="text-3xl font-bold spiritual-text-gradient">{actualState} Centers</h1>
      <p className="text-sm text-neutral-600 mb-6">
        {centers.length} Brahma Kumaris meditation {centers.length === 1 ? 'center' : 'centers'} across {districts.length} {districts.length === 1 ? 'district' : 'districts'} in {actualState}, {stateRegion}
      </p>
      
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="md:col-span-3">
          <div className="bg-light rounded-lg shadow-md border border-neutral-200 overflow-hidden">
            <div className="h-[500px]">
              <CenterMap 
                centers={filteredMapMarkers} 
                isDistrictView={true}
                autoZoom={filteredMapMarkers.length > 0}
                initialZoom={filteredMapMarkers.length === 0 ? 6 : undefined}
              />
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-light rounded-lg shadow-md p-4 border border-neutral-200 h-full">
            <h2 className="text-xl mb-3 font-bold spiritual-text-gradient">Districts in {actualState}</h2>
            
            {/* Search input with voice capability */}
            <div className="mb-3">
              <SearchBar
                placeholder="Search districts..."
                value={searchQuery}
                onClear={handleClearSearch}
                showClearButton={searchQuery.length > 0}
                onSearchResult={(lat, lng, address) => {
                  // We're not using coordinates here, just the text
                  setSearchQuery(address);
                }}
              />
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredDistricts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredDistricts.map(item => (
                    <Link 
                      key={item.district} 
                      href={formatCenterUrl(stateRegion, actualState, item.district)}
                      className="block p-2 rounded-lg border border-neutral-200 hover:border-primary hover:shadow-sm transition-all"
                    >
                      <h3 className="text-md font-medium text-spirit-purple-700 truncate">{item.district}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-neutral-600 text-xs">
                          {item.centerCount} {item.centerCount === 1 ? 'center' : 'centers'}
                        </span>
                        <span className="text-primary text-xs font-medium">View →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-neutral-500">No districts found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-neutral-200">
        <Link href={formatCenterUrl(stateRegion)} className="text-primary hover:underline inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to {stateRegion} Country
        </Link>
      </div>
    </div>
  );
} 