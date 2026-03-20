'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import CenterMap from '@/components/CenterMap';
import CenterCard from '@/components/CenterCard';
import SearchBar from '@/components/SearchBar';
import { Center } from '@/lib/types';
import { formatCenterUrl } from '@/lib/urlUtils';
import { CenterLocatorAnalytics } from '@/components/GoogleAnalytics';
import { MapPin, ChevronRight, ArrowLeft, Search, Building2, Sparkles, BookOpen, Users } from 'lucide-react';
import SoulSustenance from '@/components/SoulSustenance';

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
      center.name.toLowerCase().includes(searchLower) ||
      (center.address?.line1 && center.address.line1.toLowerCase().includes(searchLower)) ||
      (center.address?.line2 && center.address.line2.toLowerCase().includes(searchLower)) ||
      (center.address?.line3 && center.address.line3.toLowerCase().includes(searchLower)) ||
      (center.address?.city && center.address.city.toLowerCase().includes(searchLower)) ||
      (center.address?.pincode && center.address.pincode.toLowerCase().includes(searchLower)) ||
      (center.contact && center.contact.toLowerCase().includes(searchLower)) ||
      (center.email && center.email.toLowerCase().includes(searchLower)) ||
      (center.mobile && center.mobile.toLowerCase().includes(searchLower)) ||
      (center.branch_code && center.branch_code.toLowerCase().includes(searchLower)) ||
      (center.district && center.district.toLowerCase().includes(searchLower)) ||
      (center.state && center.state.toLowerCase().includes(searchLower)) ||
      (center.zone && center.zone.toLowerCase().includes(searchLower)) ||
      (center.sub_zone && center.sub_zone.toLowerCase().includes(searchLower))
    );
  }, [centers, searchQuery]);

  // Handle center selection from map
  const handleCenterSelect = (center: Center) => {
    setSelectedCenter(center);
    CenterLocatorAnalytics.viewCenter(center);
    
    const centerElement = document.getElementById(`center-${center.branch_code}`);
    if (centerElement) {
      document.querySelectorAll('.highlight-card').forEach(el => {
        el.classList.remove('highlight-card');
      });
      centerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      centerElement.classList.add('highlight-card');
      setTimeout(() => {
        centerElement.classList.remove('highlight-card');
      }, 1500);
    }
  };

  // Handle card click to highlight marker
  const handleCardClick = (center: Center) => {
    setSelectedCenter(center);
    CenterLocatorAnalytics.viewCenter(center);
    
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      {/* ===== HERO SECTION ===== */}
      <div className="relative bg-gradient-to-br from-spirit-purple-700 via-spirit-blue-700 to-spirit-purple-800 dark:from-spirit-purple-900 dark:via-spirit-blue-900 dark:to-spirit-purple-900 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-spirit-gold-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-6 pb-10 md:pb-14 relative z-10">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center text-sm flex-wrap gap-1">
              <li className="flex items-center">
                <Link href="/" className="text-white/60 hover:text-white text-xs transition-colors">Home</Link>
                <ChevronRight className="w-3 h-3 mx-1.5 text-white/40" />
              </li>
              <li className="flex items-center">
                <Link href={formatCenterUrl(stateRegion)} className="text-white/60 hover:text-white text-xs transition-colors">{stateRegion}</Link>
                <ChevronRight className="w-3 h-3 mx-1.5 text-white/40" />
              </li>
              <li>
                <Link href={formatCenterUrl(stateRegion, actualState)} className="text-white/80 text-xs hover:text-white transition-colors">{actualState}</Link>
              </li>
            </ol>
          </nav>

          {/* Title & Badge */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 px-3 py-1 rounded-full text-xs font-medium mb-3">
              <MapPin className="w-3.5 h-3.5" />
              {actualState} &middot; Meditation Centers
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">{actualDistrict}</h1>
            <p className="text-white/70 text-sm max-w-2xl">
              {centers.length} Brahma Kumaris Rajyoga meditation {centers.length === 1 ? 'center' : 'centers'} in {actualDistrict}, {actualState}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-none">{centers.length}</p>
                <p className="text-xs text-white/60">Meditation Centers</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-none">Free</p>
                <p className="text-xs text-white/60">All Classes & Courses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="container mx-auto px-4 py-8 space-y-10">

        {centers.length > 0 ? (
          <>
            {/* ===== MAP ===== */}
            <div ref={mapRef} className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
              <div className="h-[400px] md:h-[500px]">
                <CenterMap 
                  centers={enhancedCenters} 
                  autoZoom={filteredCenters.length > 0}
                  initialZoom={filteredCenters.length === 0 ? 13 : undefined}
                  onCenterSelect={handleCenterSelect}
                  highlightCenter={true}
                  showInfoWindowOnLoad={selectedCenter !== null}
                />
              </div>
              <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Click any marker to highlight the center below. Click the center name on the map to visit its page.
                </p>
              </div>
            </div>

            {/* ===== SEARCH + CENTER CARDS ===== */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-spirit-purple-100 dark:bg-spirit-purple-900/30 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-spirit-purple-600 dark:text-spirit-purple-400" />
                  </div>
                  All Centers
                  <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500 ml-1">({filteredCenters.length})</span>
                </h2>
                <div className="w-full sm:w-72">
                  <SearchBar
                    placeholder="Search centers..."
                    value={searchQuery}
                    onClear={handleClearSearch}
                    showClearButton={searchQuery.length > 0}
                    disableVoiceInput={true}
                    isLocalSearch={true}
                    onTextChange={handleSearchChange}
                  />
                </div>
              </div>

              {filteredCenters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCenters.map((center) => (
                    <div 
                      key={center.branch_code} 
                      id={`center-${center.branch_code}`}
                      className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-md hover:border-spirit-purple-200 dark:hover:border-spirit-purple-700 transition-all duration-200 cursor-pointer h-full flex flex-col"
                      onClick={() => handleCardClick(center)}
                    >
                      <CenterCard center={center} hideViewIcon={true} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                  <Search className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">No centers found matching &ldquo;{searchQuery}&rdquo;</p>
                  <button 
                    onClick={handleClearSearch}
                    className="mt-2 text-xs text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-10 text-center">
            <Search className="w-14 h-14 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3 text-neutral-700 dark:text-neutral-300">No Centers Found</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm max-w-md mx-auto">
              We couldn&apos;t find any Rajyoga meditation centers in {actualDistrict}, {actualState}.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link 
                href={formatCenterUrl(stateRegion, actualState)} 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-spirit-purple-600 to-spirit-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg transition-all"
              >
                View Other Districts in {actualState}
              </Link>
              <Link href="/" className="inline-flex items-center gap-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 px-5 py-2.5 rounded-xl font-medium text-sm hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600 transition-all">
                Explore All Centers
              </Link>
            </div>
          </div>
        )}

        {/* ===== INFO ROW ===== */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-spirit-purple-100 to-spirit-blue-100 dark:from-spirit-purple-900/30 dark:to-spirit-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-spirit-purple-600 dark:text-spirit-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-1">Free 7-Day Course</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">Every center offers a free introductory Rajyoga meditation course. Walk in any day — no registration needed.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-spirit-blue-100 to-spirit-purple-100 dark:from-spirit-blue-900/30 dark:to-spirit-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-spirit-blue-600 dark:text-spirit-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-1">Open to Everyone</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">All classes are open to people of every age, background, and faith.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-spirit-gold-100 to-spirit-purple-100 dark:from-spirit-gold-900/30 dark:to-spirit-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-spirit-gold-600 dark:text-spirit-gold-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-1">Always Free</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">All programs, classes, and courses at Brahma Kumaris are offered completely free of charge.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== SOUL SUSTENANCE ===== */}
        <SoulSustenance />

        {/* ===== BACK LINK ===== */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Link href={formatCenterUrl(stateRegion, actualState)} className="inline-flex items-center gap-2 text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to {actualState}
          </Link>
        </div>
      </div>
    </div>
  );
}