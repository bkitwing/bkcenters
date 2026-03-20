import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
// Use server-side data functions that read directly from JSON file (ISR-compatible)
import { getCenterByCode, getCentersByDistrict, getRegionForState, getNewsByEmail } from '@/lib/serverCenterData';
import DirectionsButton from '@/components/DirectionsButton';
import CenterCard from '@/components/CenterCard';
import ContactForm from '@/components/ContactForm';
import ShareCenter from '@/components/ShareCenter';
import ContactLink from '@/components/ContactLink';
import FAQSection from '@/components/FAQSection';
import CollapsibleSection from '@/components/CollapsibleSection';
import StickyBottomNav from '@/components/StickyBottomNav';
import SevenDayCourseSection from '@/components/SevenDayCourseSection';
import SoulSustenance from '@/components/SoulSustenance';
import { LocalBusinessSchema, BreadcrumbSchema, FAQPageSchema, CourseSchema, EventSchema, HowToSchema, NewsArticleListSchema } from '@/components/StructuredData';
import { Metadata } from 'next';
import { Center } from '@/lib/types';
import NewsSection from '@/components/NewsSection';
import { formatCenterUrl } from '@/lib/urlUtils';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { MapPin, Phone, Smartphone, Mail, Navigation, ChevronRight, ArrowLeft, Clock, Sparkles, BookOpen, Users, MessageCircle, HelpCircle, Newspaper, Map } from 'lucide-react';

const CenterMap = dynamic(() => import('@/components/CenterMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-neutral-100 rounded-lg animate-pulse" />,
});

// Fallback revalidation: 1 day. Sync script triggers on-demand revalidation via /api/revalidate.
export const revalidate = 86400;

// Extended interface for centers with optional service and timing data
interface CenterWithServices extends Center {
  services?: string[];
  timings?: string;
}

interface CenterPageProps {
  params: {
    region: string;
    state: string;
    district: string;
    branchCode: string;
  };
}

export async function generateMetadata({ params }: CenterPageProps): Promise<Metadata> {
  try {
    const center = await getCenterByCode(params.branchCode, params.state, params.district) as CenterWithServices;
    
    if (!center) {
      return {
        title: 'Center Not Found',
        description: 'The meditation center you are looking for could not be found.',
      };
    }
    
    const address = center.address ? 
      `${center.address.line1 || ''}, ${center.address.city || ''}, ${center.address.pincode || ''}` : 
      'Address not available';

    const title = `${center.name} - Brahma Kumaris Rajyog Meditation Center - ${center.state}`;
    const description = `Visit the Brahma Kumaris Rajyog meditation center at ${address} - ${center.state}, Contact information, Nearby Meditation Centers, directions, and more.`;
    
    // Format complete address
    const getCompleteAddress = () => {
      const { line1, line2, line3, city, pincode } = center.address || {};
      let parts = [];
      
      if (line1) parts.push(line1);
      if (line2) parts.push(line2);
      if (line3) parts.push(line3);
      if (city) parts.push(city);
      if (pincode) parts.push(pincode);
      
      return parts.join(', ');
    };

    const completeAddress = getCompleteAddress();
    
    // Format contact info for OG image with clean text labels
    const contactLines = [
      completeAddress,
      [
        center.contact ? `Tel: ${center.contact}` : null,
        center.mobile ? `Mob: ${center.mobile}` : null,
        center.email ? `Email: ${center.email}` : null
      ].filter(Boolean).join(' | ')
    ].filter(Boolean).join('\n');

    const ogImage = generateOgImageUrl({
      title: center.name, // Shorter title for OG image
      description: contactLines,
      type: 'center',
      location: `${center.address?.city || ''}, ${center.state}`,
    });

    // Build canonical URL
    const canonicalRegionSlug = (center.region || '').toLowerCase().replace(/\s+/g, '-');
    const canonicalStateSlug = (center.state || '').toLowerCase().replace(/\s+/g, '-');
    const canonicalDistrictSlug = (center.district || '').toLowerCase().replace(/\s+/g, '-');
    const canonicalUrl = `https://www.brahmakumaris.com/centers/${canonicalRegionSlug}/${canonicalStateSlug}/${canonicalDistrictSlug}/${params.branchCode}`;

    return {
      title,
      description,
      keywords: `Brahma Kumaris, meditation, ${center.name}, ${center.district}, ${center.state}, ${center.address?.city ? center.address.city + ', ' : ''}spiritual center, Rajyoga, free meditation classes, 7 day course`,
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
        title, // Keep original full title for meta tags
        description,
        type: 'website',
        url: canonicalUrl,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${center.name} - Brahma Kumaris Meditation Center`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title, // Keep original full title for Twitter
        description,
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Brahma Kumaris Meditation Center',
      description: 'Find a Brahma Kumaris meditation center near you.',
    };
  }
}

// ISR: Return empty array to skip pre-building at build time
// Pages will be generated on-demand (first request) and then cached
// This dramatically reduces build time while maintaining fast subsequent loads
export async function generateStaticParams() {
  // Return empty array - all center pages will be generated on first request
  // and cached indefinitely (until next build) thanks to revalidate = false
  return [];
}

// Helper function to get base URL for sharing (ISR-compatible, no headers() call)
function getBaseUrl(): string {
  // Use environment variable if available, otherwise use production URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  // For local development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5400/centers';
  }
  // Production default
  return 'https://www.brahmakumaris.com/centers';
}

export default async function CenterPage({ params }: CenterPageProps) {
  const urlRegion = decodeURIComponent(params.region).toUpperCase();
  const state = decodeURIComponent(params.state);
  const district = decodeURIComponent(params.district);
  const branchCode = decodeURIComponent(params.branchCode);
  
  // Get base URL for constructing absolute URLs (ISR-compatible)
  const baseUrl = getBaseUrl();

  // Initialize actualRegion with urlRegion as default
  let actualRegion = urlRegion;

  try {
    const center = await getCenterByCode(branchCode, state, district) as CenterWithServices;
    
    // Try to get the region from the center data
    if (center?.region) {
      actualRegion = center.region.toUpperCase();
    } else {
      try {
        // If no region in center data, try getting it from state mapping
        actualRegion = (await getRegionForState(state)).toUpperCase();
      } catch (error) {
        // If getRegionForState fails, keep using the URL region
        console.warn(`Failed to get region for state ${state}, using URL region ${urlRegion}`);
      }
    }
    
    // Check if the URL region matches the actual region (case-insensitive)
    if (urlRegion !== actualRegion && actualRegion !== 'INDIA' && center) {
      // For the redirect URL, use the original case from center.region or a lowercase version
      const redirectRegion = center?.region || actualRegion.toLowerCase();
      // Redirect to the correct URL
      const formattedUrl = formatCenterUrl(redirectRegion, state, district, center.name);
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl mb-4">Redirecting to correct region...</h1>
          <p>The state {state} belongs to region {actualRegion}, not {urlRegion}.</p>
          <p className="mt-4">
            <Link href={formattedUrl} className="text-primary">
              Click here if you are not redirected automatically.
            </Link>
          </p>
          <script dangerouslySetInnerHTML={{ __html: `window.location.href = "${formattedUrl}";` }} />
        </div>
      );
    }
    
    // Show empty view instead of notFound when center not found
    if (!center) {
      // Get centers from the district to find actual region
      const districCenters = await getCentersByDistrict(state, district);
      
      return (
        <EmptyCenterView region={actualRegion} state={state} district={district} branchCode={branchCode} />
      );
    }
    
    const formatAddress = () => {
      const { line1, line2, line3, city, pincode } = center.address || {};
      let parts = [];
      
      if (line1) parts.push(line1);
      if (line2) parts.push(line2);
      if (line3) parts.push(line3);
      if (city) parts.push(city);
      if (pincode) parts.push(pincode);
      if (center.state) parts.push(center.state);
      if (center.region) parts.push(center.region);
      
      return parts.join(', ');
    };
    
    const formattedAddress = formatAddress();
    
    const getGoogleMapsUrl = () => {
      if (center?.coords && Array.isArray(center.coords) && center.coords.length === 2) {
        const [lat, lng] = center.coords;
        const address = encodeURIComponent(formattedAddress);
        
        return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${address}`;
      } else {
        // If no coordinates, just use the address
        const address = encodeURIComponent(formattedAddress);
        return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
      }
    };
    
    const hasMobileOrContact = center.mobile || center.contact;

    // Prepare center with highlighted flag for map
    const centerForMap = {
      ...center,
      is_highlighted: true,
      description: formattedAddress
    };

    // Get nearby centers from same district (targeted query, no bulk fetch)
    // Fetch news posts in parallel with nearby centers for performance
    const [districtCenters, newsData] = await Promise.all([
      getCentersByDistrict(center.state, center.district),
      getNewsByEmail(center.email, 6),
    ]);
    const { posts: newsPosts, total: newsTotalCount } = newsData;
    const nearbyCenters = districtCenters
      .filter(c => c.branch_code !== center.branch_code)
      .slice(0, 6);

    // Prepare centers for map display
    const mapCenters = [
      centerForMap,
      ...nearbyCenters.map(nearby => ({
        ...nearby,
        is_nearby: true, // Mark as nearby for custom styling
        description: nearby.address ? 
          `${nearby.address.line1 || ''}, ${nearby.address.city || ''}, ${nearby.address.pincode || ''}` : 
          'Address not available'
      }))
    ];
    
    // Calculate the page URL for sharing in email (ISR-compatible)
    let absoluteUrl = baseUrl;
    
    if (center) {
      const centerUrl = formatCenterUrl(
        center.region || actualRegion, 
        center.state || state, 
        center.district || district, 
        center.name
      );
      absoluteUrl = `${baseUrl}${centerUrl}`;
    }
    
    // Prepare breadcrumb data for structured data
    const breadcrumbItems = [
      { name: 'Home', url: `${baseUrl}` },
      { name: center.region || actualRegion, url: `${baseUrl}${formatCenterUrl(center.region || actualRegion, "", "", "")}` },
      { name: center.state, url: `${baseUrl}${formatCenterUrl(center.region || actualRegion, center.state, "", "")}` },
      { name: center.district, url: `${baseUrl}${formatCenterUrl(center.region || actualRegion, center.state, center.district, "")}` },
      { name: center.name, url: absoluteUrl },
    ];

    // Prepare FAQ data for structured data (plain text versions)
    const faqData = [
      {
        question: "What is the Brahma Kumaris?",
        answer: "Brahma Kumaris is a worldwide spiritual movement led by women, dedicated to personal transformation and world renewal through Rajyoga Meditation. Founded in India in 1937, Brahma Kumaris has spread to over 110 countries on all continents and has had an extensive impact in many sectors as an international NGO."
      },
      {
        question: `How to Visit Meditation Center - ${center.name}?`,
        answer: `You can visit our center located at: ${formattedAddress}. ${center.contact || center.mobile ? `Contact: ${center.contact || center.mobile}` : ''}`
      },
      {
        question: "Can anyone visit a Brahma Kumaris center and try Rajyoga meditation?",
        answer: "Yes. Every soul is welcome. Whether young or old, student, professional, or homemaker — the doors are open for all. You can sit in silence, experience God's love, and learn meditation in a pure and peaceful atmosphere."
      },
      {
        question: "What do you teach in the meditation course?",
        answer: "In the introductory 7-day Rajyoga course, you learn about the soul, the Supreme Soul, the law of karma, the cycle of time, and the power of purity. Along with knowledge, you also practice connecting with God through meditation, which fills you with peace and strength."
      },
      {
        question: "Do you ask for any money or donation?",
        answer: "No, there are no fees for any of the courses or services. As a voluntary organization, everything is offered as a service to the community. If someone wishes, they may contribute voluntarily to support the continuation of this spiritual work."
      },
    ];

    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
        {/* Structured Data for SEO */}
        <LocalBusinessSchema center={center} pageUrl={absoluteUrl} />
        <BreadcrumbSchema items={breadcrumbItems} />
        <FAQPageSchema faqs={faqData} />
        <CourseSchema centerName={center.name} centerUrl={absoluteUrl} />
        <EventSchema center={center} centerUrl={absoluteUrl} />
        <HowToSchema center={center} centerUrl={absoluteUrl} />
        <NewsArticleListSchema posts={newsPosts} centerName={center.name} centerUrl={absoluteUrl} />

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
                  <Link href={formatCenterUrl(center.region || actualRegion, "", "", "")} className="text-white/60 hover:text-white text-xs transition-colors">{center.region || actualRegion}</Link>
                  <ChevronRight className="w-3 h-3 mx-1.5 text-white/40" />
                </li>
                <li className="flex items-center">
                  <Link href={formatCenterUrl(center.region || actualRegion, center.state, "", "")} className="text-white/60 hover:text-white text-xs transition-colors">{center.state}</Link>
                  <ChevronRight className="w-3 h-3 mx-1.5 text-white/40" />
                </li>
                <li>
                  <Link href={formatCenterUrl(center.region || actualRegion, center.state, center.district, "")} className="text-white/80 text-xs">{center.district}</Link>
                </li>
              </ol>
            </nav>

            {/* Center Name & Badge */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 px-3 py-1 rounded-full text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Brahma Kumaris Rajyoga Meditation Center
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">{center.name}</h1>
              <div className="flex items-start gap-2 text-white/80 text-sm max-w-2xl">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{formattedAddress}</p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {hasMobileOrContact && (
                <a
                  href={`tel:${(center.mobile || center.contact || '').split(',')[0].trim().replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-2 bg-white text-spirit-purple-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </a>
              )}
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white border border-white/25 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/25 transition-all duration-200"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </a>
              <a
                href="#seven-day-course"
                className="inline-flex items-center gap-2 bg-spirit-gold-400/90 text-spirit-purple-900 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-spirit-gold-400 transition-all duration-200"
              >
                <BookOpen className="w-4 h-4" />
                Free 7-Day Course
              </a>
            </div>
          </div>
        </div>

        {/* ===== SECTION NAVIGATION (Sticky) ===== */}
        <div className="sticky top-14 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex overflow-x-auto scrollbar-hide -mb-px">
              {[
                { id: 'info', label: 'Info', icon: MapPin },
                { id: 'seven-day-course', label: '7-Day Course', icon: BookOpen },
                ...(newsPosts.length > 0 ? [{ id: 'news', label: 'News', icon: Newspaper }] : []),
                ...(nearbyCenters.length > 0 ? [{ id: 'nearby', label: 'Nearby', icon: Map }] : []),
                { id: 'faq', label: 'FAQ', icon: HelpCircle },
                ...(center.email && center.email.includes('@') ? [{ id: 'contact', label: 'Contact', icon: MessageCircle }] : []),
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-spirit-purple-700 dark:hover:text-spirit-purple-400 border-b-2 border-transparent hover:border-spirit-purple-500 transition-all duration-200 whitespace-nowrap flex-shrink-0"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="container mx-auto px-4 py-8 space-y-12 md:space-y-16">

          {/* ===== CENTER INFO + MAP SECTION ===== */}
          <section id="info" className="scroll-mt-20">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Left: Contact Details Card */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Card */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-5 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-spirit-purple-100 dark:bg-spirit-purple-900/30 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-spirit-purple-600 dark:text-spirit-purple-400" />
                      </div>
                      Center Details
                    </h2>

                    {/* Address */}
                    <div className="mb-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">Address</p>
                      <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">{formattedAddress}</p>
                    </div>

                    {/* Contact Numbers */}
                    {hasMobileOrContact && (
                      <div className="mb-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Phone</p>
                        <div className="space-y-2">
                          {center.contact && center.contact.split(',').map((number, index) => {
                            const cleanNumber = number.trim().replace(/[^0-9+]/g, '');
                            return (
                              <div key={`contact-${index}`} className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-neutral-400" />
                                <ContactLink href={`tel:${cleanNumber}`} className="text-sm text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium transition-colors" center={center}>
                                  {number.trim()}
                                </ContactLink>
                              </div>
                            );
                          })}
                          {center.mobile && center.mobile.split(',').map((number, index) => {
                            const cleanNumber = number.trim();
                            return (
                              <div key={`mobile-${index}`} className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-neutral-400" />
                                <a href={`tel:${cleanNumber}`} className="text-sm text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium transition-colors">
                                  {number.trim()}
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {center.email && (
                      <div className="mb-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">Email</p>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                          <ContactLink href={`mailto:${center.email}`} className="text-sm text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium transition-colors" center={center}>
                            {center.email}
                          </ContactLink>
                        </div>
                      </div>
                    )}

                    {/* Timings */}
                    {center.timings && (
                      <div className="mb-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">Timings</p>
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-neutral-400 dark:text-neutral-500 mt-0.5" />
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">{center.timings}</p>
                        </div>
                      </div>
                    )}

                    {/* Services */}
                    {center.services && center.services.length > 0 && (
                      <div className="mb-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Services</p>
                        <div className="flex flex-wrap gap-1.5">
                          {center.services.map((service: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center text-xs bg-spirit-purple-50 dark:bg-spirit-purple-900/30 text-spirit-purple-700 dark:text-spirit-purple-300 px-2.5 py-1 rounded-full font-medium">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Directions Button */}
                  <div className="border-t border-neutral-100 dark:border-neutral-700 p-4">
                    <DirectionsButton center={center} address={formattedAddress} />
                  </div>
                </div>

                {/* Share Card */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <ShareCenter center={center} pageUrl={absoluteUrl} />
                  </div>
                </div>
              </div>

              {/* Right: Map */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden sticky top-20">
                  <div className="h-[400px] md:h-[500px] lg:h-[550px]">
                    <CenterMap 
                      centers={mapCenters} 
                      height="100%" 
                      autoZoom={true}
                      defaultZoom={13}
                      highlightCenter={true}
                      showInfoWindowOnLoad={true}
                    />
                  </div>
                  <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-700">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="font-semibold text-spirit-purple-600">Purple</span>: This Center
                      <span className="mx-2">•</span>
                      <span className="font-semibold text-green-600">Green</span>: Nearby Centers — Click markers for details
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== 7-DAY COURSE SECTION ===== */}
          <SevenDayCourseSection 
            centerName={center.name}
            contact={center.contact}
            mobile={center.mobile}
          />

          {/* ===== NEWS SECTION ===== */}
          {newsPosts.length > 0 && (
            <div id="news" className="scroll-mt-20">
              <NewsSection
                initialPosts={newsPosts}
                totalCount={newsTotalCount}
                email={center.email}
              />
            </div>
          )}

          {/* ===== NEARBY CENTERS SECTION ===== */}
          {nearbyCenters.length > 0 && (
            <section id="nearby" className="scroll-mt-20">
              <CollapsibleSection 
                title="Nearby Centers" 
                defaultExpanded={false}
                sectionId="nearby-centers"
                previewData={nearbyCenters}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nearbyCenters.map((nearbyCenter) => (
                    <div 
                      key={nearbyCenter.branch_code} 
                      id={`center-card-${nearbyCenter.branch_code}`}
                      className="block h-full transition-all duration-200 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-md"
                    >
                      <CenterCard 
                        center={nearbyCenter} 
                        distance={nearbyCenter.distance} 
                        showDistance={true} 
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </section>
          )}

          {/* ===== FAQ SECTION ===== */}
          <section id="faq" className="scroll-mt-20">
            <CollapsibleSection 
              title="Frequently Asked Questions" 
              defaultExpanded={false}
              sectionId="faq"
              faqPreviewData={[
                {
                  question: "What is the Brahma Kumaris?",
                  answer: "Brahma Kumaris is a worldwide spiritual movement led by women, dedicated to personal transformation and world renewal through Rajyoga Meditation. Founded in India in 1937, Brahma Kumaris has spread to over 110 countries on all continents and has had an extensive impact in many sectors as an international NGO."
                },
                {
                  question: `How to Visit Meditation Center - ${center.name}?`,
                  answer: `You can visit our center located at: ${formatAddress()}`
                },
                {
                  question: "Can anyone visit a Brahma Kumaris center and try Rajyoga meditation?",
                  answer: "Yes. Every soul is welcome. Whether young or old, student, professional, or homemaker — the doors are open for all. You can sit in silence, experience God's love, and learn meditation in a pure and peaceful atmosphere."
                },
                {
                  question: "What do you teach in the meditation course?",
                  answer: "In the introductory 7-day Rajyoga course, you learn about the soul, the Supreme Soul, the law of karma, the cycle of time, and the power of purity. Along with knowledge, you also practice connecting with God through meditation, which fills you with peace and strength."
                },
                {
                  question: "Do I need to wear any special dress when I come?",
                  answer: "There is no special dress required. We lovingly suggest wearing clean, simple, and modest clothing that reflects purity and helps maintain the peaceful atmosphere of the center. What matters most is your intention to connect with God."
                },
                {
                  question: "Do I have to become a full member to attend classes?",
                  answer: "Not at all. At the Brahma Kumaris, every soul is welcome to attend classes freely, without any formal joining or commitment. This is a spiritual university of God, where you may come, listen, reflect, and take benefit as much as you wish, in your own time and comfort. Everything is offered with love and humility."
                },
                {
                  question: "Do you ask for any money or donation?",
                  answer: "No, there are no fees for any of the courses or services. As a voluntary organization, everything is offered as a service to the community. If someone wishes, they may contribute voluntarily to support the continuation of this spiritual work."
                },
                {
                  question: "Is Brahma Kumaris connected to any one religion?",
                  answer: "No. This is a spiritual path. God belongs to everyone, and all souls are His children. People of every background and faith come together here to experience peace, purity, and God's love."
                },
                {
                  question: "What will I feel in the meditation class?",
                  answer: "You may feel deep peace, lightness, or a sweet connection with God. Some feel God's love, others find clarity or strength to face challenges. Each soul's experience is unique, but always uplifting."
                },
                {
                  question: "In which languages is the knowledge available?",
                  answer: "Spiritual knowledge is available in many languages — Hindi, English, Tamil, Telugu, Gujarati, Marathi, Bengali, and more. Centers usually teach in the local language so that everyone can understand with ease."
                },
                {
                  question: "If I visit the center, do I have to change my life?",
                  answer: "There is no compulsion. You can practice at your own pace. Many souls naturally feel inspired to live peacefully, wake up early, speak sweetly, or adopt pure vegetarian food."
                },
                {
                  question: "Is the Brahma Kumaris only for women?",
                  answer: "No. The Brahma Kumaris is open to all — men, women, youth, and elders. Both brothers and sisters walk this spiritual path together, as equal souls and children of the one Supreme Father."
                }
              ]}
            >
              <FAQSection center={center} />
            </CollapsibleSection>
          </section>

          {/* ===== CONTACT SECTION ===== */}
          {center.email && center.email.includes('@') && (
            <section id="contact" className="scroll-mt-20">
              <CollapsibleSection 
                title="Contact Us" 
                defaultExpanded={true}
                sectionId="contact"
              >
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Contact Info Card */}
                  <div className="lg:col-span-2 lg:order-2">
                    <div className="bg-gradient-to-br from-spirit-purple-50 to-spirit-blue-50 dark:from-spirit-purple-900/20 dark:to-spirit-blue-900/20 rounded-2xl p-6 border border-spirit-purple-100 dark:border-spirit-purple-800">
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-spirit-purple-600 dark:text-spirit-purple-400" />
                        Get in Touch
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-5 leading-relaxed">
                        Send a message to {center.name}. Whether you have a query, want to provide feedback, or are interested in learning Rajyoga Meditation — we are here to help.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-white dark:border-neutral-700 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">Free for Everyone</p>
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-11">All meditation sessions and courses are completely free of charge.</p>
                        </div>
                        
                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-white dark:border-neutral-700 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-spirit-blue-100 dark:bg-spirit-blue-900/30 flex items-center justify-center">
                              <Users className="w-4 h-4 text-spirit-blue-600 dark:text-spirit-blue-400" />
                            </div>
                            <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">Open to All</p>
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-11">No prior experience needed. Everyone is welcome, regardless of background.</p>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-white dark:border-neutral-700 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-spirit-purple-100 dark:bg-spirit-purple-900/30 flex items-center justify-center">
                              <Phone className="w-4 h-4 text-spirit-purple-600 dark:text-spirit-purple-400" />
                            </div>
                            <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">Prefer Calling?</p>
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-11">We recommend calling the center first for the quickest response.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div className="lg:col-span-3 lg:order-1">
                    <ContactForm 
                      center={center} 
                      pageUrl={absoluteUrl} 
                    />
                  </div>
                </div>
              </CollapsibleSection>
            </section>
          )}

          {/* ===== SOUL SUSTENANCE ===== */}
          <SoulSustenance />

          {/* ===== BACK LINK ===== */}
          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <Link href={formatCenterUrl(center.region || actualRegion, center.state, center.district, "")} className="inline-flex items-center gap-2 text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to {center.district} District
            </Link>
          </div>
        </div>
        
        {/* Sticky Bottom Navigation for Mobile */}
        <StickyBottomNav center={center} />
      </div>
    );
  } catch (error) {
    console.error('Error rendering center page:', error);
    return <EmptyCenterView region={actualRegion} state={state} district={district} branchCode={branchCode} />;
  }
}

function EmptyCenterView({ region, state, district, branchCode }: { region: string, state: string, district: string, branchCode: string }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="bg-light rounded-lg shadow-md p-8 text-center border border-neutral-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-2xl font-bold mb-4 text-neutral-700">Center Not Found</h1>
        <p className="text-neutral-600 mb-6">
          We couldn't find the meditation center you're looking for. It may have been moved or removed.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={formatCenterUrl(region, state, district, "")} className="btn-primary">
            View Other Centers in {district}
          </Link>
          <Link href="/centers" className="btn-secondary">
            Explore All Centers
          </Link>
        </div>
      </div>
    </div>
  );
}