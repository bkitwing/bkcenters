import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CanonicalRedirect from '@/components/CanonicalRedirect';
import dynamic from 'next/dynamic';
// Use server-side data functions that read directly from JSON file (ISR-compatible)
import { getCenterByCode, getCentersByDistrict, getRegionForState, getNewsByEmail, getEventsByEmail, getCentersNearCenter } from '@/lib/serverCenterData';
import NearbyResultCard from '@/components/NearbyResultCard';
import CenterPageSection, { type SectionTone } from '@/components/CenterPageSection';
import ExpandableBlock from '@/components/ExpandableBlock';
import { directionsUrl, splitPhoneField } from '@/lib/phone';
import { EmailLink, PhoneLink } from '@/components/ContactSheet';
import ContactForm from '@/components/ContactForm';
import ShareCenter from '@/components/ShareCenter';
import FindOtherCenters from '@/components/FindOtherCenters';
import FAQSection from '@/components/FAQSection';
import StickyBottomNav from '@/components/StickyBottomNav';
import SectionNav from '@/components/SectionNav';
import SevenDayCourseSection from '@/components/SevenDayCourseSection';
import SoulSustenance from '@/components/SoulSustenance';
import CallNowButton from '@/components/CallNowButton';
import GuidedMeditationSection from '@/components/GuidedMeditationSection';
import { LocalBusinessSchema, BreadcrumbSchema, FAQPageSchema, CourseSchema, EventSchema, HowToSchema, NewsArticleListSchema, EventListSchema } from '@/components/StructuredData';
import { Metadata } from 'next';
import { Center } from '@/lib/types';
import NewsSection from '@/components/NewsSection';
import EventsSection from '@/components/EventsSection';
import { formatCenterUrl } from '@/lib/urlUtils';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { getCenterTimings, generateCenterIntro, getLocalizedFaqs, getLocalityLabel } from '@/lib/centerContent';
import { countryLabelFromRegion, districtLevelLabel } from '@/lib/countryUtils';
import { MapPin, Phone, Smartphone, Mail, Navigation, ChevronRight, ChevronDown, ArrowLeft, Clock, Sparkles, MessageCircle, HelpCircle, Newspaper, Map, CalendarDays, Headphones, BookOpen } from 'lucide-react';
import { exclusiveCampusContactByBranch } from '@/lib/campuses/registry';

const EXCLUSIVE_CAMPUS_CONTACT = exclusiveCampusContactByBranch();

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

    // Exclusive retreat campuses: their micro-site contact page is canonical
    const campusContact = EXCLUSIVE_CAMPUS_CONTACT[center.branch_code];
    if (campusContact) {
      return {
        title: center.name,
        alternates: { canonical: `https://www.brahmakumaris.com/centers${campusContact}` },
        robots: { index: false, follow: true },
      };
    }
    
    const address = center.address ? 
      `${center.address.line1 || ''}, ${center.address.city || ''}, ${center.address.pincode || ''}` : 
      'Address not available';

    const localityLabel = getLocalityLabel(center);
    const country = countryLabelFromRegion(center.region, center.country);
    const title = `${center.name} - Brahma Kumaris Rajyog Meditation Center - ${center.state}${country ? `, ${country}` : ''}`;
    // Unique, localized description (name + locality + timings) so each of the
    // 5,600+ pages has a differentiated snippet rather than duplicate boilerplate.
    const description = `Learn Rajyoga meditation for free at Brahma Kumaris ${center.name}${localityLabel ? ` in ${localityLabel}, ` : ' in '}${center.state}${country ? `, ${country}` : ''}. Kindly call to confirm timings, then visit for the free 7-day course. Approximate daily hours: morning (7–9 AM) & evening (5–8 PM). Address, contact numbers, timings & directions.`;
    
    // Link-preview image: name and where it is (address and phones are in the
    // preview text and the page itself)
    const ogImage = generateOgImageUrl({
      title: center.name,
      type: 'center',
      subtitle: [center.address?.city?.trim() || center.district, center.state, country].filter(Boolean).join(', '),
    });

    // Build canonical URL
    const canonicalRegionSlug = (center.region || '').toLowerCase().replace(/\s+/g, '-');
    const canonicalStateSlug = (center.state || '').toLowerCase().replace(/\s+/g, '-');
    const canonicalDistrictSlug = (center.district || '').toLowerCase().replace(/\s+/g, '-');
    const canonicalUrl = `https://www.brahmakumaris.com/centers/${canonicalRegionSlug}/${canonicalStateSlug}/${canonicalDistrictSlug}/${params.branchCode}`;

    return {
      title,
      description,
      keywords: `Brahma Kumaris, meditation, ${center.name}, ${center.district}, ${center.state}${country ? `, ${country}` : ''}, ${center.address?.city ? center.address.city + ', ' : ''}spiritual center, Rajyoga, free meditation classes, 7 day course`,
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

    // Exclusive retreat campuses use their micro-site contact as the canonical
    // detail URL (see CanonicalRedirect for why it isn't permanentRedirect)
    const campusContact = EXCLUSIVE_CAMPUS_CONTACT[center.branch_code];
    if (campusContact) {
      return <CanonicalRedirect href={campusContact} />;
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
    
    // By coordinates when known (destination_place_id would need a Google place ID)
    const getGoogleMapsUrl = () => directionsUrl(center?.coords, formattedAddress);
    
    const hasMobileOrContact = center.mobile || center.contact;

    // Prepare center with highlighted flag for map
    const centerForMap = {
      ...center,
      is_highlighted: true,
      description: formattedAddress
    };

    // Nearest centers by distance (any district) from the in-memory index, in
    // parallel with news/events; same-district centers if the index isn't ready
    const [nearestCenters, newsData, eventsData] = await Promise.all([
      getCentersNearCenter(center, 6),
      getNewsByEmail(center.email, 6),
      getEventsByEmail(center.email, 20),
    ]);
    const { posts: newsPosts, total: newsTotalCount } = newsData;
    const { events: eventPosts, total: eventsTotalCount } = eventsData;
    const nearbyCenters: (Center & { distance?: number })[] =
      nearestCenters ??
      (await getCentersByDistrict(center.state, center.district))
        .filter(c => c.branch_code !== center.branch_code)
        .slice(0, 6);
    const centerLat = parseFloat(center.coords?.[0] ?? '');
    const centerLng = parseFloat(center.coords?.[1] ?? '');
    // "See all on the map" → nearby search around this center
    const nearbySearchUrl = Number.isFinite(centerLat) && Number.isFinite(centerLng)
      ? `/?lat=${centerLat}&lng=${centerLng}&address=${encodeURIComponent(`${center.name}, ${center.district}`)}`
      : formatCenterUrl(center.region || actualRegion, center.state, center.district, "");

    // Localized, unique-per-center content (intro paragraph, timings, FAQs)
    const nearbyLocalities = nearbyCenters
      .map(c => c.address?.city || c.district)
      .filter((v): v is string => !!v);
    const centerIntro = generateCenterIntro(center, nearbyLocalities);
    const timings = getCenterTimings(center);
    const localizedFaqs = getLocalizedFaqs(center);

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

    // Hero visit cards (timings / address / contact) share one look
    const heroCardClass =
      'rounded-2xl border border-[rgba(168,122,42,0.18)] dark:border-[rgba(226,197,106,0.18)] bg-white/75 dark:bg-neutral-900/50 p-4 text-[color:var(--bk-hero-ink)]';
    const heroCardLabelClass =
      'inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--bk-hero-gold)]';
    const heroChipClass =
      'inline-flex items-center gap-1.5 rounded-full border border-[rgba(168,122,42,0.22)] bg-white/80 dark:bg-neutral-800/70 px-3 py-1.5 text-sm font-medium text-[color:var(--bk-hero-gold)] hover:border-[color:var(--bk-hero-gold)] transition-colors';
    // "Om Shanti. A peaceful space in Raviwar Peth…" — the center's own locality
    const locality = getLocalityLabel(center);
    // Sheet subtitle + contact analytics (only what's needed crosses to the client)
    const contactInfo = { name: center.name, state: center.state, district: center.district };

    // Prepare FAQ data for structured data (plain text versions).
    // Localized FAQs are prepended so each page's FAQPage schema is unique.
    const faqData = [
      ...localizedFaqs,
      {
        question: "What is the Brahma Kumaris?",
        answer: "Brahma Kumaris is a worldwide spiritual movement led by women, dedicated to personal transformation and world renewal through Rajyoga Meditation. Founded in India in 1937, Brahma Kumaris has spread to over 110 countries on all continents and has had an extensive impact in many sectors as an international NGO."
      },
      {
        question: `How to Visit Meditation Center - ${center.name}?`,
        answer: `Kindly call to confirm class hours, then visit. Address: ${formattedAddress}. ${center.mobile || center.contact ? `Phone: ${center.mobile || center.contact}` : ''}`
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
      // Page background = the first band's (white), so the sticky section menu
      // sits on the same surface as the section under it, not its own grey strip
      <div className="min-h-screen bg-white dark:bg-neutral-900 transition-colors duration-300">
        {/* Structured Data for SEO */}
        <LocalBusinessSchema center={center} pageUrl={absoluteUrl} description={centerIntro} />
        <BreadcrumbSchema items={breadcrumbItems} />
        <FAQPageSchema faqs={faqData} />
        <CourseSchema centerName={center.name} centerUrl={absoluteUrl} />
        <EventSchema center={center} centerUrl={absoluteUrl} />
        <HowToSchema center={center} centerUrl={absoluteUrl} />
        <NewsArticleListSchema posts={newsPosts} centerName={center.name} centerUrl={absoluteUrl} />
        <EventListSchema events={eventPosts} center={center} centerUrl={absoluteUrl} />

        {/* ===== HERO: who + what to do (left) · compact map (right), one screen ===== */}
        <section
          id="info"
          className="bk-center-hero bk-hero-underlap relative scroll-mt-bk overflow-hidden"
        >
          <div className="bk-center-hero__glow" aria-hidden />

          <div className="container mx-auto px-4 pt-4 pb-8 md:pb-10 relative z-10">
            <nav className="mb-4" aria-label="Breadcrumb">
              <ol className="flex items-center text-sm flex-wrap gap-1">
                <li className="flex items-center">
                  <Link href="/" className="text-[color:var(--bk-hero-muted)] hover:text-[color:var(--bk-hero-ink)] text-xs transition-colors">Home</Link>
                  <ChevronRight className="w-3 h-3 mx-1.5 text-[color:var(--bk-hero-muted)] opacity-60" />
                </li>
                <li className="flex items-center">
                  <Link href={formatCenterUrl(center.region || actualRegion, "", "", "")} className="text-[color:var(--bk-hero-muted)] hover:text-[color:var(--bk-hero-ink)] text-xs transition-colors">{center.region || actualRegion}</Link>
                  <ChevronRight className="w-3 h-3 mx-1.5 text-[color:var(--bk-hero-muted)] opacity-60" />
                </li>
                <li className="flex items-center">
                  <Link href={formatCenterUrl(center.region || actualRegion, center.state, "", "")} className="text-[color:var(--bk-hero-muted)] hover:text-[color:var(--bk-hero-ink)] text-xs transition-colors">{center.state}</Link>
                  <ChevronRight className="w-3 h-3 mx-1.5 text-[color:var(--bk-hero-muted)] opacity-60" />
                </li>
                <li>
                  <Link href={formatCenterUrl(center.region || actualRegion, center.state, center.district, "")} className="text-[color:var(--bk-hero-ink-soft)] text-xs font-medium">{center.district}</Link>
                </li>
              </ol>
            </nav>

            {/* Columns stretch to the same height, so the map lines up with the
                left column's top and bottom edges on desktop */}
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Left — who this is and what to do */}
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <div className="bk-center-hero__badge mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    Brahma Kumaris Rajyoga Meditation Center
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-[2.6rem] font-bold text-[color:var(--bk-hero-ink)] leading-tight tracking-tight">
                    {center.name}
                  </h1>
                  <p className="mt-2 max-w-xl text-[15px] md:text-base leading-relaxed text-[color:var(--bk-hero-ink-soft)]">
                    Om Shanti. A peaceful space{locality ? ` in ${locality}` : ''} to know yourself and feel
                    God&apos;s love — everyone is welcome, every class is free.
                  </p>
                  {/* Intro kept for SEO only — not shown in the visual UI */}
                  {centerIntro ? (
                    <p className="sr-only">{centerIntro}</p>
                  ) : null}
                </div>

                {/* What visitors came for — Call, Directions, Share — right under the
                    name, so they're on the first screen on phones too */}
                <div
                  className="bk-center-hero__actions max-w-xl"
                  role="group"
                  aria-label="Center actions"
                  data-center-actions
                >
                  {hasMobileOrContact && (
                    <CallNowButton
                      mobile={center.mobile}
                      contact={center.contact}
                      region={center.region}
                      center={contactInfo}
                      className="bk-center-hero__action bk-center-hero__action--primary cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call</span>
                    </CallNowButton>
                  )}
                  <a
                    href={getGoogleMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bk-center-hero__action"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Directions</span>
                  </a>
                  <ShareCenter center={center} pageUrl={absoluteUrl} variant="hero" />
                </div>

                {/* Visit details: three small labelled cards instead of one long list */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className={heroCardClass}>
                    <p className={heroCardLabelClass}>
                      <Clock className="w-3.5 h-3.5" aria-hidden />
                      Class timings
                    </p>
                    {timings.custom ? (
                      <p className="mt-2 text-[15px] font-semibold">{timings.custom}</p>
                    ) : (
                      <div className="mt-2 space-y-1 text-[15px]">
                        <p><span className="font-semibold">Morning</span> {timings.morning}</p>
                        <p><span className="font-semibold">Evening</span> {timings.evening}</p>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-[color:var(--bk-hero-muted)]">Open daily · times are approximate, please call ahead</p>
                  </div>

                  <div className={heroCardClass}>
                    <p className={heroCardLabelClass}>
                      <MapPin className="w-3.5 h-3.5" aria-hidden />
                      Address
                    </p>
                    <p className="mt-2 text-[15px] leading-snug">{formattedAddress}</p>
                    <a
                      href={getGoogleMapsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--bk-hero-gold)] hover:text-[color:var(--bk-hero-gold-soft)]"
                    >
                      Get directions
                      <ChevronRight className="w-4 h-4" aria-hidden />
                    </a>
                  </div>

                  {(hasMobileOrContact || center.email) && (
                    <div className={`${heroCardClass} sm:col-span-2`}>
                      <p className={heroCardLabelClass}>
                        <Phone className="w-3.5 h-3.5" aria-hidden />
                        Contact
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {/* Each opens a small sheet: Call / Email plus Copy, so it
                            also works in in-app browsers that block tel:/mailto: */}
                        {center.mobile &&
                          splitPhoneField(center.mobile, center.region).map((number, index) => {
                            const shown = number.trim();
                            if (!shown) return null;
                            return (
                              <PhoneLink
                                key={`mobile-${index}`}
                                number={shown}
                                region={center.region}
                                center={contactInfo}
                                className={heroChipClass}
                              >
                                <Smartphone className="w-3.5 h-3.5 opacity-70" aria-hidden />
                                {shown}
                              </PhoneLink>
                            );
                          })}
                        {center.contact &&
                          splitPhoneField(center.contact, center.region).map((number, index) => {
                            const shown = number.trim();
                            if (!shown.replace(/[^0-9+]/g, '')) return null;
                            return (
                              <PhoneLink
                                key={`contact-${index}`}
                                number={shown}
                                region={center.region}
                                center={contactInfo}
                                className={heroChipClass}
                              >
                                <Phone className="w-3.5 h-3.5 opacity-70" aria-hidden />
                                {shown}
                              </PhoneLink>
                            );
                          })}
                        {center.email && (
                          <EmailLink
                            email={center.email}
                            formHref="#contact"
                            center={contactInfo}
                            className={`${heroChipClass} break-all`}
                          >
                            <Mail className="w-3.5 h-3.5 opacity-70 shrink-0" aria-hidden />
                            {center.email}
                          </EmailLink>
                        )}
                      </div>
                      {center.services && center.services.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {center.services.map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center text-[11px] bg-[rgba(184,134,11,0.1)] text-[color:var(--bk-hero-ink-soft)] px-2.5 py-1 rounded-full font-medium border border-[rgba(168,122,42,0.14)]"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right — compact map: this center and the nearest ones */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="flex flex-1 flex-col rounded-2xl overflow-hidden border border-[rgba(168,122,42,0.2)] shadow-[0_18px_40px_-24px_rgba(74,42,28,0.35)] bg-white dark:bg-neutral-900 dark:border-[rgba(226,197,106,0.22)]">
                  <div className="relative h-[240px] sm:h-[300px] lg:h-auto lg:flex-1 lg:min-h-[340px]">
                    <div className="absolute inset-0">
                      <CenterMap
                        centers={mapCenters}
                        height="100%"
                        autoZoom={true}
                        defaultZoom={13}
                        highlightCenter={true}
                        showInfoWindowOnLoad={true}
                      />
                    </div>
                  </div>
                  <div className="px-3.5 py-2.5 bg-[#fffdf9]/95 dark:bg-neutral-900/95 border-t border-[rgba(168,122,42,0.12)] dark:border-neutral-800">
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#B8860B]" aria-hidden />
                        This center
                      </span>
                      {nearbyCenters.length > 0 && (
                        <a href="#nearby" className="inline-flex items-center gap-1.5 hover:text-spirit-purple-700 dark:hover:text-spirit-purple-300">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#4CAF50]" aria-hidden />
                          Other centers nearby ({nearbyCenters.length})
                        </a>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION NAVIGATION (Sticky) ===== */}
        <SectionNav
          items={[
            { id: 'info', label: 'Info', iconName: 'MapPin' },
            ...(nearbyCenters.length > 0 ? [{ id: 'nearby', label: 'Nearby', iconName: 'Map' }] : []),
            { id: 'seven-day-course', label: '7-Day Course', iconName: 'BookOpen' },
            { id: 'guided-meditation', label: 'Meditation', iconName: 'Headphones' },
            ...(eventPosts.length > 0 ? [{ id: 'events', label: 'Events', iconName: 'CalendarDays' }] : []),
            ...(newsPosts.length > 0 ? [{ id: 'news', label: 'News', iconName: 'Newspaper' }] : []),
            { id: 'faq', label: 'FAQ', iconName: 'HelpCircle' },
            { id: 'contact', label: 'Questions', iconName: 'MessageCircle' },
          ]}
        />

        {/* ===== SECTIONS: full-width bands, alternating backgrounds, one header style ===== */}
        {(() => {
          // Alternate band backgrounds in display order so neighbours never match
          let band = 0;
          const nextTone = (): SectionTone => (band++ % 2 === 0 ? 'white' : 'tint');
          return (
            <>
              <CenterPageSection
                id="nearby"
                eyebrow="Nearby"
                icon={Map}
                title={nearbyCenters.length > 0 ? 'Other centers nearby' : 'Find another center'}
                intent={nearbyCenters.length > 0
                  ? 'Every center offers the same free classes — choose the one easiest for you to reach.'
                  : 'Every center offers the same free classes — search for one near you.'}
                divider={false}
                action={nearbyCenters.length > 0 ? (
                  <Link
                    href={nearbySearchUrl}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-spirit-purple-700 dark:text-spirit-purple-300 hover:underline underline-offset-2"
                  >
                    See all on the map
                    <ChevronRight className="w-4 h-4" aria-hidden />
                  </Link>
                ) : undefined}
                tone={nextTone()}
              >
                {nearbyCenters.length > 0 && (
                  // Phones: one swipeable row (next card peeks in); larger screens: grid
                  <ol className="mb-3 flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1">
                    {nearbyCenters.map((nearbyCenter, index) => (
                      <li key={nearbyCenter.branch_code} className="w-[85%] shrink-0 snap-start md:w-auto">
                        <NearbyResultCard center={nearbyCenter} index={index} />
                      </li>
                    ))}
                  </ol>
                )}
                <FindOtherCenters variant="inline" />
              </CenterPageSection>

              <CenterPageSection
                id="seven-day-course"
                eyebrow="Free course"
                icon={BookOpen}
                title="7-Day Rajyoga Meditation Course"
                intent="Seven short sessions to rediscover the soul, the Supreme and the peace that is already within you."
                tone={nextTone()}
              >
                <SevenDayCourseSection
                  centerName={center.name}
                  contact={center.contact}
                  mobile={center.mobile}
                  directionsUrl={getGoogleMapsUrl()}
                  region={center.region}
                />
              </CenterPageSection>

              {eventPosts.length > 0 && (
                <CenterPageSection
                  id="events"
                  eyebrow="At this center"
                  icon={CalendarDays}
                  title="Events"
                  intent="Come and experience peace together — programs and gatherings at this center."
                  tone={nextTone()}
                >
                  <EventsSection
                    initialEvents={eventPosts}
                    totalCount={eventsTotalCount}
                    email={center.email}
                    showHeader={false}
                  />
                </CenterPageSection>
              )}

              {newsPosts.length > 0 && (
                <CenterPageSection
                  id="news"
                  eyebrow="At this center"
                  icon={Newspaper}
                  title="News & updates"
                  intent="Recent moments of service and celebration from this center."
                  tone={nextTone()}
                >
                  <NewsSection
                    initialPosts={newsPosts}
                    totalCount={newsTotalCount}
                    email={center.email}
                    showHeader={false}
                  />
                </CenterPageSection>
              )}

              <CenterPageSection
                id="guided-meditation"
                eyebrow="Meditate anywhere"
                icon={Headphones}
                title="Guided meditation"
                intent="Carry the silence home — short guided meditations for peace, rest and focus."
                tone={nextTone()}
              >
                <GuidedMeditationSection />
              </CenterPageSection>

              <CenterPageSection
                id="faq"
                eyebrow="Before you visit"
                icon={HelpCircle}
                title="Frequently asked questions"
                intent="Simple answers for your first visit."
                tone={nextTone()}
              >
                <FAQSection center={center} initialVisible={5} />
              </CenterPageSection>

              {/* Always shown — inquiries route to a central inbox, so centers
                  without their own email still receive enquiries via the team. */}
              <CenterPageSection
                id="contact"
                eyebrow="We're here to help"
                icon={MessageCircle}
                title="Ask a question"
                intent="Write to us about anything not answered above. To join a class, simply call and come."
                tone={nextTone()}
              >
                <ExpandableBlock id="contact" openLabel="Write your question" closeLabel="Hide the form">
                  {/* Full section width on desktop (fields share rows), like the other sections */}
                  <div>
                    <ContactForm
                      center={center}
                      pageUrl={absoluteUrl}
                      walkIn={{
                        morning: timings.morning,
                        evening: timings.evening,
                        custom: timings.custom,
                        directionsUrl: getGoogleMapsUrl(),
                        contact: center.contact,
                        mobile: center.mobile,
                      }}
                    />
                  </div>
                </ExpandableBlock>
              </CenterPageSection>

              {/* ===== STAY CONNECTED ===== */}
              <CenterPageSection id="stay-connected" tone={nextTone()}>
                <SoulSustenance />
                <div className="mt-8">
                  <Link href={formatCenterUrl(center.region || actualRegion, center.state, center.district, "")} className="inline-flex items-center gap-2 text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 font-medium text-sm transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    All centers in {center.district} {districtLevelLabel(center.region || actualRegion)}
                  </Link>
                </div>
              </CenterPageSection>
            </>
          );
        })()}

        {/* Sticky Bottom Navigation for Mobile */}
        <StickyBottomNav center={center} pageUrl={absoluteUrl} />
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