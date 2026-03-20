import React from 'react';
import Link from 'next/link';
// Use server-side data functions — targeted Strapi queries per page
import { 
  getStatesByRegionFast,
  getRegionBySlug
} from '@/lib/serverCenterData';
import { Metadata } from 'next';
import { formatCenterUrl } from '@/lib/urlUtils';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { BreadcrumbSchema, PlaceSchema, ItemListSchema } from '@/components/StructuredData';
import SoulSustenance from '@/components/SoulSustenance';
import { MapPin, ChevronRight, ArrowLeft, Building2, Map, Sparkles, BookOpen, Users, Globe } from 'lucide-react';

// Fallback revalidation: 1 day. Sync script triggers on-demand revalidation via /api/revalidate.
export const revalidate = 86400;

// Define a unified type for state data
interface StateData {
  name: string;
  centerCount: number;
  districtCount: number;
}

interface RegionPageProps {
  params: {
    region: string;
  };
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const regionSlug = decodeURIComponent(params.region);
  const actualRegion = await getRegionBySlug(regionSlug) || regionSlug;
  
  // Get state stats (lightweight — no full center objects)
  const states = await getStatesByRegionFast(actualRegion);
  const totalCenters = states.reduce((sum, state) => sum + state.centerCount, 0);
  
  const title = `${actualRegion} - Brahma Kumaris Rajyog Meditation Centers`;
  const description = `Explore Brahma Kumaris Rajyog meditation centers in ${actualRegion}. ${totalCenters} centers across ${states.length} states.`;

  // Calculate total districts
  const districts = states.reduce((sum, state) => sum + state.districtCount, 0);

  const pageTitle = `${actualRegion} Rajyoga Meditation Center`;
  const imageTitle = actualRegion;

  const ogImage = generateOgImageUrl({
    title: actualRegion,
    description: `${totalCenters} Centers in ( ${states.length} States-Uts & ${districts} Districts)`,
    type: 'region',
    region: actualRegion,
  });

  const canonicalUrl = `https://www.brahmakumaris.com/centers/${actualRegion.toLowerCase().replace(/\s+/g, '-')}`;

  return {
    title,
    description,
    keywords: `Brahma Kumaris, Rajyog Meditation Centers, ${actualRegion}, spiritual centers, meditation centers`,
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
          alt: `Brahma Kumaris Centers in ${actualRegion}`,
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

export default async function RegionPage({ params }: RegionPageProps) {
  const regionSlug = decodeURIComponent(params.region);
  const region = await getRegionBySlug(regionSlug) || regionSlug;
  
  // Targeted Strapi query: fetch only centers for this region
  const regionStates = await getStatesByRegionFast(region);
  
  const states = regionStates;
  const statesByRegion: Record<string, StateData[]> = { [region]: states };
  
  // Calculate totals
  const totalCenters = states.reduce((sum, state) => sum + state.centerCount, 0);
  const totalDistricts = states.reduce((sum, state) => sum + state.districtCount, 0);
  
  // Base URL for structured data
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5400/centers' 
    : 'https://www.brahmakumaris.com/centers';

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: region, url: `${baseUrl}${formatCenterUrl(region)}` },
  ];

  // Page URL for Place schema
  const pageUrl = `${baseUrl}${formatCenterUrl(region)}`;

  const itemListItems = states.map((state, idx) => ({
    name: state.name,
    url: `${baseUrl}${formatCenterUrl(region, state.name)}`,
    position: idx + 1,
  }));

  // Find the max center count for bar scaling
  const maxCenters = states.length > 0 ? Math.max(...states.map(s => s.centerCount)) : 1;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      {/* Structured Data for SEO */}
      <BreadcrumbSchema items={breadcrumbItems} />
      <PlaceSchema 
        name={region}
        description={`Explore ${totalCenters} Brahma Kumaris Rajyoga Meditation Centers across ${states.length} states in ${region}.`}
        centerCount={totalCenters}
        pageUrl={pageUrl}
      />
      <ItemListSchema
        name={`Brahma Kumaris Centers in ${region} — States List`}
        description={`${states.length} states with Brahma Kumaris Rajyoga meditation centers in ${region}.`}
        url={pageUrl}
        items={itemListItems}
      />

      {/* ===== HERO SECTION ===== */}
      <div className="relative bg-gradient-to-br from-spirit-purple-700 via-spirit-blue-700 to-spirit-purple-800 dark:from-spirit-purple-900 dark:via-spirit-blue-900 dark:to-spirit-purple-900 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-spirit-gold-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-spirit-blue-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-6 pb-10 md:pb-14 relative z-10">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center text-sm flex-wrap gap-1">
              <li className="flex items-center">
                <Link href="/" className="text-white/60 hover:text-white text-xs transition-colors">Home</Link>
              </li>
            </ol>
          </nav>

          {/* Title & Badge */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 px-3 py-1 rounded-full text-xs font-medium mb-3">
              <Globe className="w-3.5 h-3.5" />
              Brahma Kumaris Meditation Centers
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">{region}</h1>
            <p className="text-white/70 text-sm max-w-2xl">
              Explore {totalCenters} Brahma Kumaris Rajyoga meditation centers across {states.length} {states.length === 1 ? 'state' : 'states'} and {totalDistricts} districts in {region}
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
                <p className="text-2xl font-bold text-white leading-none">{states.length}</p>
                <p className="text-xs text-white/60">States &amp; UTs</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-none">{totalDistricts}</p>
                <p className="text-xs text-white/60">Districts</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white leading-none">Free</p>
                <p className="text-xs text-white/60">All Classes &amp; Courses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="container mx-auto px-4 py-8 space-y-10">

        {/* ===== STATES GRID ===== */}
        {states.length > 0 ? (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                {region === 'INDIA' ? 'Explore States & Union Territories' : `States in ${region}`}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">Select a state to find meditation centers near you</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {states
                .sort((a, b) => b.centerCount - a.centerCount)
                .map((state, idx) => (
                <Link
                  key={state.name}
                  href={formatCenterUrl(region, state.name)}
                  className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:shadow-lg hover:border-spirit-purple-200 dark:hover:border-spirit-purple-700 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    {/* Rank / Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                      idx % 5 === 0 ? 'bg-gradient-to-br from-spirit-purple-500 to-spirit-blue-500' :
                      idx % 5 === 1 ? 'bg-gradient-to-br from-spirit-blue-500 to-spirit-teal-500' :
                      idx % 5 === 2 ? 'bg-gradient-to-br from-spirit-teal-500 to-spirit-purple-500' :
                      idx % 5 === 3 ? 'bg-gradient-to-br from-spirit-gold-500 to-spirit-purple-500' :
                      'bg-gradient-to-br from-spirit-rose-500 to-spirit-purple-500'
                    }`}>
                      {state.centerCount}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-spirit-purple-700 dark:group-hover:text-spirit-purple-400 transition-colors truncate">{state.name}</h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {state.centerCount} {state.centerCount === 1 ? 'center' : 'centers'} &middot; {state.districtCount} {state.districtCount === 1 ? 'district' : 'districts'}
                      </p>
                      {/* Progress bar */}
                      <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden mt-2.5">
                        <div 
                          className="h-full bg-gradient-to-r from-spirit-purple-400 to-spirit-blue-400 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max((state.centerCount / maxCenters) * 100, 5)}%` }}
                        />
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-spirit-purple-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-10 text-center">
            <Globe className="w-14 h-14 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3 text-neutral-700 dark:text-neutral-300">No States Found</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm max-w-md mx-auto">
              We couldn&apos;t find any states in {region}.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-spirit-purple-600 to-spirit-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg transition-all">
              Explore All Centers
            </Link>
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
          <Link href="/" className="inline-flex items-center gap-2 text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 