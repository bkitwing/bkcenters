'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import CenterMap from '@/components/CenterMap';
import CenterCard from '@/components/CenterCard';
import SearchBar from '@/components/SearchBar';
import { Center } from '@/lib/types';
import { formatCenterUrl } from '@/lib/urlUtils';
import { CenterLocatorAnalytics } from '@/components/GoogleAnalytics';

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
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Filter centers based on search query
  const filteredCenters = useMemo(() => {
    if (searchQuery.trim() === "") {
      return centers;
    }
    const searchLower = searchQuery.toLowerCase();
    return centers.filter(center => 
      // Center name
      center.name.toLowerCase().includes(searchLower) ||
      // Address fields
      (center.address?.line1 && center.address.line1.toLowerCase().includes(searchLower)) ||
      (center.address?.line2 && center.address.line2.toLowerCase().includes(searchLower)) ||
      (center.address?.line3 && center.address.line3.toLowerCase().includes(searchLower)) ||
      (center.address?.city && center.address.city.toLowerCase().includes(searchLower)) ||
      (center.address?.pincode && center.address.pincode.toLowerCase().includes(searchLower)) ||
      // Contact information
      (center.contact && center.contact.toLowerCase().includes(searchLower)) ||
      (center.email && center.email.toLowerCase().includes(searchLower)) ||
      (center.mobile && center.mobile.toLowerCase().includes(searchLower)) ||
      // Branch code
      (center.branch_code && center.branch_code.toLowerCase().includes(searchLower)) ||
      // District, state, etc
      (center.district && center.district.toLowerCase().includes(searchLower)) ||
      (center.state && center.state.toLowerCase().includes(searchLower)) ||
      (center.zone && center.zone.toLowerCase().includes(searchLower)) ||
      (center.sub_zone && center.sub_zone.toLowerCase().includes(searchLower))
    );
  }, [centers, searchQuery]);

  // Handle center selection from map
  const handleCenterSelect = (center: Center) => {
    setSelectedCenter(center);
    
    // Track center view from map
    CenterLocatorAnalytics.viewCenter(center);
    
    // Find and highlight the corresponding card
    const centerElement = document.getElementById(`center-${center.branch_code}`);
    if (centerElement) {
      // First remove highlight from any previously highlighted cards
      document.querySelectorAll('.highlight-card').forEach(el => {
        el.classList.remove('highlight-card');
      });
      
      // Scroll into view with smooth behavior
      centerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight class
      centerElement.classList.add('highlight-card');
      
      // Remove highlight after animation
      setTimeout(() => {
        centerElement.classList.remove('highlight-card');
      }, 1500);
    }
  };

  // Handle card click to highlight marker
  const handleCardClick = (center: Center) => {
    setSelectedCenter(center);
    
    // Track center view from card click
    CenterLocatorAnalytics.viewCenter(center);
    
    // Scroll to map if it's out of view
    if (mapRef.current) {
      const mapRect = mapRef.current.getBoundingClientRect();
      if (mapRect.top < 0 || mapRect.bottom > window.innerHeight) {
        mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Handle search query clear
  const handleClearSearch = () => {
    setSearchQuery("");
    // Reset any selected center as well since we're clearing the filter
    setSelectedCenter(null);
  };
  
  // Handle search query change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      CenterLocatorAnalytics.searchCenters(query, filteredCenters.length, 'text');
    }
  };

  // Create an enhanced version of centers with highlighting property
  const enhancedCenters = useMemo(() => {
    return filteredCenters.map(center => ({
      ...center,
      is_highlighted: selectedCenter ? center.branch_code === selectedCenter.branch_code : false
    }));
  }, [filteredCenters, selectedCenter]);

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
          <div ref={mapRef} className="h-[400px] border border-neutral-200 rounded-lg overflow-hidden shadow-md mb-8">
            <CenterMap 
              centers={enhancedCenters} 
              autoZoom={filteredCenters.length > 0}
              initialZoom={filteredCenters.length === 0 ? 13 : undefined}
              onCenterSelect={handleCenterSelect}
              highlightCenter={true}
              showInfoWindowOnLoad={selectedCenter !== null}
            />
          </div>
          
          {/* Local search for filtering centers */}
          <div className="mb-6">
            <SearchBar
              placeholder={`Search centers by name, address, contact details, etc...`}
              value={searchQuery}
              onClear={handleClearSearch}
              showClearButton={searchQuery.length > 0}
              disableVoiceInput={true}
              isLocalSearch={true}
              onTextChange={handleSearchChange}
            />
          </div>
          
          {filteredCenters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCenters.map((center) => (
                <div 
                  key={center.branch_code} 
                  id={`center-${center.branch_code}`}
                  className="card hover:shadow-md transition-shadow border border-neutral-200 p-4 rounded-lg h-full flex flex-col"
                  onClick={() => handleCardClick(center)}
                >
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
            We couldn't find any Rajyog meditation centers in {actualDistrict}, {actualState}.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={formatCenterUrl(stateRegion, actualState)} className="btn-primary">
              View Other Districts in {actualState}
            </Link>
            <Link href="/" className="btn-secondary">
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
          Back to {actualState} Centers
        </Link>
      </div>
    </div>
  );
}