'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import CenterMap from '@/components/CenterMap';
import { Center } from '@/lib/types';
import { formatCenterUrl } from '@/lib/urlUtils';
import SearchBar from '@/components/SearchBar';
import { CenterLocatorAnalytics } from '@/components/GoogleAnalytics';
import { MapPin, ChevronRight, ArrowLeft, Search, Map, Building2, Sparkles, BookOpen, Users, Globe } from 'lucide-react';
import SoulSustenance from '@/components/SoulSustenance';

interface StatePageClientProps {
  actualRegion: string;
  actualState: string;
  stateRegion: string;
  districts: string[];
  totalCenters: number;
  districtSummary: {
    district: string;
    centerCount: number;
    coords: [string, string] | null;
  }[];
  otherStates: {
    name: string;
    centerCount: number;
    districtCount: number;
  }[];
}

export default function StatePageClient({
  actualRegion,
  actualState,
  stateRegion,
  districts,
  totalCenters,
  districtSummary,
  otherStates
}: StatePageClientProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  
  // Prepare all district map markers - computed once
  // Built from districtSummary directly (no full Center objects needed)
  const allDistrictMarkers = useMemo(() => {
    return districtSummary.map(item => {
      if (!item.coords) return null;
      
      return {
        name: item.district,
        slug: '',
        branch_code: `district-${item.district.toLowerCase().replace(/\s+/g, '-')}`,
        address: { line1: '', line2: '', line3: '', city: '', pincode: '' },
        email: '', contact: '', mobile: '',
        country: '', zone: '', sub_zone: '', section: '',
        district_id: '', state_id: '', country_id: '',
        coords: item.coords,
        state: actualState,
        region: actualRegion,
        district: item.district,
        description: `${item.centerCount} meditation ${item.centerCount === 1 ? 'center' : 'centers'}`,
        district_total: item.centerCount,
        is_district_summary: true,
        is_highlighted: selectedDistrict === item.district
      };
    }).filter(Boolean) as Center[];
  }, [districtSummary, selectedDistrict, actualState, actualRegion]);

  // Handle district selection from map
  const handleDistrictSelect = (center: Center) => {
    const district = center.district;
    setSelectedDistrict(district);
    
    // Track district selection
    CenterLocatorAnalytics.useFilter('district', district);
    
    // Find and highlight the corresponding card
    const districtElement = document.getElementById(`district-${district}`);
    if (districtElement) {
      // First remove highlight from any previously highlighted cards
      document.querySelectorAll('.highlight-card').forEach(el => {
        el.classList.remove('highlight-card');
      });
      
      // Scroll into view with smooth behavior
      districtElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight class
      districtElement.classList.add('highlight-card');
      
      // Remove highlight after animation
      setTimeout(() => {
        districtElement.classList.remove('highlight-card');
      }, 1500);
    }
  };

  // Handle search query clear
  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedDistrict(null);
  };
  
  // Handle search query change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      CenterLocatorAnalytics.searchCenters(query, filteredDistricts.length, 'text');
    }
  };
  
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

  // Find max centers for bar chart scaling
  const maxCenters = districtSummary.length > 0 ? Math.max(...districtSummary.map(d => d.centerCount)) : 1;

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
              <li>
                <Link href={formatCenterUrl(stateRegion)} className="text-white/80 text-xs hover:text-white transition-colors">{stateRegion}</Link>
              </li>
            </ol>
          </nav>

          {/* Title & Badge */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 px-3 py-1 rounded-full text-xs font-medium mb-3">
              <MapPin className="w-3.5 h-3.5" />
              Brahma Kumaris Meditation Centers
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">{actualState}</h1>
            <p className="text-white/70 text-sm max-w-2xl">
              Explore {totalCenters} Brahma Kumaris Rajyoga meditation {totalCenters === 1 ? 'center' : 'centers'} across {districts.length} {districts.length === 1 ? 'district' : 'districts'} in {actualState}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-none">{totalCenters}</p>
                <p className="text-xs text-white/60">Meditation Centers</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                <Map className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-none">{districts.length}</p>
                <p className="text-xs text-white/60">Districts</p>
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

        {/* ===== MAP + DISTRICT LIST ===== */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Map - takes more space */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden sticky top-4">
              <div className="h-[450px] md:h-[550px]">
                <CenterMap 
                  centers={filteredMapMarkers} 
                  isDistrictView={true}
                  autoZoom={filteredMapMarkers.length > 0}
                  initialZoom={filteredMapMarkers.length === 0 ? 6 : undefined}
                  onCenterSelect={handleDistrictSelect}
                  highlightCenter={true}
                />
              </div>
              <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Click any marker to highlight the district. Each marker shows the number of meditation centers in that district.
                </p>
              </div>
            </div>
          </div>

          {/* District List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-700">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-spirit-purple-100 dark:bg-spirit-purple-900/30 flex items-center justify-center">
                    <Map className="w-4 h-4 text-spirit-purple-600 dark:text-spirit-purple-400" />
                  </div>
                  Districts in {actualState}
                  <span className="ml-auto text-sm font-normal text-neutral-400 dark:text-neutral-500">{filteredDistricts.length}</span>
                </h2>

                {/* Search */}
                <SearchBar
                  placeholder="Search districts..."
                  value={searchQuery}
                  onClear={handleClearSearch}
                  showClearButton={searchQuery.length > 0}
                  disableVoiceInput={true}
                  isLocalSearch={true}
                  onTextChange={handleSearchChange}
                />
              </div>

              {/* District Cards */}
              <div className="max-h-[480px] overflow-y-auto">
                {filteredDistricts.length > 0 ? (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                    {filteredDistricts.map(item => (
                      <Link 
                        key={item.district}
                        id={`district-${item.district}`}
                        href={formatCenterUrl(stateRegion, actualState, item.district)}
                        className={`flex items-center gap-4 px-5 py-3.5 transition-all duration-200 group hover:bg-spirit-purple-50/50 dark:hover:bg-spirit-purple-900/20 ${
                          selectedDistrict === item.district 
                            ? 'bg-spirit-purple-50 dark:bg-spirit-purple-900/20' 
                            : ''
                        }`}
                      >
                        {/* District Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-spirit-purple-700 dark:group-hover:text-spirit-purple-400 transition-colors truncate">{item.district}</h3>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {item.centerCount} {item.centerCount === 1 ? 'center' : 'centers'}
                          </p>
                        </div>

                        {/* Center Count Bar */}
                        <div className="w-20 flex-shrink-0 hidden sm:block">
                          <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-spirit-purple-400 to-spirit-blue-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max((item.centerCount / maxCenters) * 100, 8)}%` }}
                            />
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-spirit-purple-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-5">
                    <Search className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">No districts found matching &ldquo;{searchQuery}&rdquo;</p>
                    <button 
                      onClick={handleClearSearch}
                      className="mt-2 text-xs text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium transition-colors"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== ABOUT / INFO SECTION ===== */}
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
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">All classes are open to people of every age, background, and faith. </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-spirit-gold-100 to-spirit-purple-100 dark:from-spirit-gold-900/30 dark:to-spirit-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-spirit-gold-600 dark:text-spirit-gold-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-1">Always Free</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">All programs, classes, and courses at Brahma Kumaris are offered completely free of charge as a service to the community.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== EXPLORE OTHER STATES ===== */}
        {otherStates.length > 0 && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-spirit-blue-50 dark:bg-spirit-blue-900/20 text-spirit-blue-700 dark:text-spirit-blue-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Globe className="w-4 h-4" />
                <span>More in {stateRegion}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Explore Other States</h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">Discover Brahma Kumaris meditation centers across {stateRegion}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {otherStates.map((item, idx) => (
                <Link
                  key={item.name}
                  href={formatCenterUrl(stateRegion, item.name)}
                  className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-md hover:border-spirit-blue-200 dark:hover:border-spirit-blue-700 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-[10px] font-bold leading-none ${
                      idx % 4 === 0 ? 'bg-gradient-to-br from-spirit-blue-500 to-spirit-purple-500' :
                      idx % 4 === 1 ? 'bg-gradient-to-br from-spirit-purple-500 to-spirit-rose-500' :
                      idx % 4 === 2 ? 'bg-gradient-to-br from-spirit-teal-500 to-spirit-blue-500' :
                      'bg-gradient-to-br from-spirit-gold-500 to-spirit-purple-500'
                    }`}>
                      {item.centerCount}
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-spirit-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-spirit-blue-700 dark:group-hover:text-spirit-blue-400 transition-colors truncate">{item.name}</h3>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {item.centerCount} {item.centerCount === 1 ? 'center' : 'centers'} · {item.districtCount} {item.districtCount === 1 ? 'district' : 'districts'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ===== SOUL SUSTENANCE ===== */}
        <SoulSustenance />

        {/* ===== BACK LINK ===== */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <Link href={formatCenterUrl(stateRegion)} className="inline-flex items-center gap-2 text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to {stateRegion}
          </Link>
        </div>
      </div>
    </div>
  );
}