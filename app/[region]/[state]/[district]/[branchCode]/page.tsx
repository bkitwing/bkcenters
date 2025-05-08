import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCenterByCode, getCentersByDistrict, getDistrictsByState, getStatesList, getRegions, getRegionForState, getNearestCenters } from '@/lib/centerData';
import CenterMap from '@/components/CenterMap';
import DirectionsButton from '@/components/DirectionsButton';
import CenterCard from '@/components/CenterCard';
import ContactForm from '@/components/ContactForm';
import { Metadata } from 'next';
import { Center } from '@/lib/types';
import { formatCenterUrl } from '@/lib/urlUtils';
import { headers } from 'next/headers';
import { generateOgImageUrl } from '@/lib/ogUtils';

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

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: CenterPageProps): Promise<Metadata> {
  try {
    const center = await getCenterByCode(params.branchCode) as CenterWithServices;
    
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
    
    // Format contact info for OG image with modern minimal icons
    const contactLines = [
      `📍 ${completeAddress}`,  // Location pin
      [
        center.contact ? `📞 ${center.contact}` : null,  // Phone
        center.mobile ? `📱 ${center.mobile}` : null,    // Mobile
        center.email ? `✉️ ${center.email}` : null       // Email
      ].filter(Boolean).join('\n')
    ].filter(Boolean).join('\n');

    const ogImage = generateOgImageUrl({
      title: center.name, // Shorter title for OG image
      description: contactLines,
      type: 'center',
      location: `${center.address?.city || ''}, ${center.state}`,
    });

    return {
      title,
      description,
      keywords: `Brahma Kumaris, meditation, ${center.name}, ${center.address?.city || ''}, ${center.state}, spiritual center`,
      openGraph: {
        title, // Keep original full title for meta tags
        description,
        type: 'website',
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

export async function generateStaticParams() {
  try {
    const regions = await getRegions();
    const paths = [];
    
    // Limit the number of centers we pre-generate to avoid build timeouts
    const MAX_CENTERS_PER_DISTRICT = 30;
    
    for (const region of regions) {
      const states = await getStatesList(region);
      
      for (const state of states) {
        const districts = await getDistrictsByState(state);
        
        for (const district of districts) {
          const centers = await getCentersByDistrict(state, district);
          
          // Only pre-generate a limited number of centers per district
          const limitedCenters = centers.slice(0, MAX_CENTERS_PER_DISTRICT);
          
          for (const center of limitedCenters) {
            paths.push({
              region: center.region.toLowerCase(),
              state: state.toLowerCase().replace(/\s+/g, '-'),
              district: district.toLowerCase().replace(/\s+/g, '-'),
              branchCode: center.name.toLowerCase().replace(/\s+/g, '-'),
            });
          }
        }
      }
    }
    
    return paths;
  } catch (error) {
    console.error('Error generating center params:', error);
    return [];
  }
}

export default async function CenterPage({ params }: CenterPageProps) {
  const urlRegion = decodeURIComponent(params.region).toUpperCase();
  const state = decodeURIComponent(params.state);
  const district = decodeURIComponent(params.district);
  const branchCode = decodeURIComponent(params.branchCode);
  
  // Get the host from headers for constructing absolute URLs
  const headersList = headers();
  const host = headersList.get('host') || 'brahmakumaris.org';
  // const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const protocol = 'http' 

  // Initialize actualRegion with urlRegion as default
  let actualRegion = urlRegion;

  try {
    const center = await getCenterByCode(branchCode) as CenterWithServices;
    
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

    // Get nearby centers
    let nearbyCenters: Center[] = [];
    if (center?.coords && Array.isArray(center.coords) && center.coords.length === 2) {
      const [lat, lng] = center.coords.map(parseFloat);
      if (!isNaN(lat) && !isNaN(lng)) {
        // Get 7 nearest centers (including the current one)
        const allNearbyCenters = await getNearestCenters(lat, lng, 7);
        // Filter out the current center
        nearbyCenters = allNearbyCenters
          .filter(nearbyCenter => nearbyCenter.branch_code !== center.branch_code)
          .slice(0, 6); // Limit to 6 centers
      }
    }

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
    
    // Calculate the page URL for sharing in email
    let absoluteUrl = `${protocol}://${host}`;
    
    if (center) {
      const centerUrl = formatCenterUrl(
        center.region || actualRegion, 
        center.state || state, 
        center.district || district, 
        center.name
      );
      absoluteUrl = `${protocol}://${host}${centerUrl}`;
    } else {
      // Fallback if center is not found
      absoluteUrl = `${protocol}://${host}/centers`;
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Improved Responsive Breadcrumb Navigation */}
        <nav className="mb-4">
          <ol className="flex items-center text-sm flex-wrap">
            {/* Home */}
            <li className="flex items-center">
              <Link 
                href="/" 
                className="text-neutral-500 hover:text-primary text-xs"
                title="Home"
              >
                Home
              </Link>
              <span className="mx-2 text-neutral-400">&gt;</span>
            </li>
            
            {/* Region */}
            <li className="flex items-center">
              <Link 
                href={formatCenterUrl(center.region || actualRegion, "", "", "")} 
                className="text-neutral-500 hover:text-primary text-xs"
                title={center.region || actualRegion}
              >
                {center.region || actualRegion}
              </Link>
              <span className="mx-2 text-neutral-400">&gt;</span>
            </li>
            
            {/* State */}
            <li className="flex items-center">
              <Link 
                href={formatCenterUrl(center.region || actualRegion, center.state, "", "")} 
                className="text-neutral-500 hover:text-primary text-xs"
                title={center.state}
              >
                {center.state}
              </Link>
              <span className="mx-2 text-neutral-400">&gt;</span>
            </li>
            
            {/* District */}
            <li className="flex items-center">
              <Link 
                href={formatCenterUrl(center.region || actualRegion, center.state, center.district, "")} 
                className="text-neutral-500 hover:text-primary text-xs"
                title={center.district}
              >
                {center.district}
              </Link>
            </li>
          </ol>
        </nav>
        
        <div className="bg-light rounded-lg shadow-lg overflow-hidden mb-8 border border-neutral-200">
          <div className="p-6">
            <h1 className="text-3xl font-bold spiritual-text-gradient">{center.name}</h1>
            <p className="text-sm text-neutral-600">
              Brahma Kumaris Meditation Center
            </p>
            
            <div className="mt-6 grid md:grid-cols-2 gap-8">
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-1 text-spirit-blue-700">Address</h2>
                  <p className="text-neutral-700">{formattedAddress}</p>
                </div>
                
                {hasMobileOrContact && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2 text-spirit-blue-700">Contact</h2>
                    
                    {center.contact && (
                      <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${center.contact.replace(/[^0-9+]/g, '')}`} className="text-primary hover:underline">
                          {center.contact}
                        </a>
                      </div>
                    )}
                    
                    {center.mobile && (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <a href={`tel:${center.mobile}`} className="text-primary hover:underline">
                          {center.mobile}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {center.email && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2 text-spirit-blue-700">Email</h2>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${center.email}`} className="text-primary hover:underline">
                        {center.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Replace the Get Directions button with our new component */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-3 text-spirit-blue-700">Get Directions</h2>
                  <DirectionsButton center={center} address={formattedAddress} />
                </div>
              </div>
              
              <div>
                <div className="h-[300px] md:h-[400px] lg:h-[450px] border border-neutral-200 rounded-lg overflow-hidden">
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
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {center.services && center.services.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3 text-spirit-blue-700">Services</h2>
                  <ul className="list-disc list-inside text-neutral-700 space-y-1">
                    {center.services.map((service: string, idx: number) => (
                      <li key={idx}>{service}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {center.timings && (
                <div>
                  <h2 className="text-xl font-semibold mb-3 text-spirit-blue-700">Timings</h2>
                  <div className="text-neutral-700 space-y-1">
                    <p>{center.timings}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Nearby Centers Section */}
            {nearbyCenters.length > 0 && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-6 text-spirit-purple-700">Nearby Centers</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nearbyCenters.map((nearbyCenter) => (
                    <div 
                      key={nearbyCenter.branch_code} 
                      id={`center-card-${nearbyCenter.branch_code}`}
                      className="block h-full transition-all duration-200 rounded-lg border border-neutral-200 hover:shadow-md"
                    >
                      <CenterCard 
                        center={nearbyCenter} 
                        distance={nearbyCenter.distance} 
                        showDistance={true} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Contact Form Section - Add only if the center has an email */}
            {center.email && center.email.includes('@') && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-6 text-spirit-purple-700">Contact {center.name}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="lg:order-2">
                    <div className="bg-light rounded-lg shadow-md p-6 border border-neutral-200">
                      <h3 className="text-xl font-semibold mb-3 text-spirit-blue-700">About Contacting Us</h3>
                      <p className="text-neutral-700 mb-4">
                        You can use this form to send a message directly to the {center.name} Rajyog Meditation center. 
                        Whether you want to provide feedback, have a query, or are interested in learning Rajyog Meditation, 
                        we're here to help.
                      </p>
                      
                      <h3 className="text-xl font-semibold mb-3 text-spirit-blue-700">What to Expect</h3>
                      <ul className="list-disc list-inside text-neutral-700 space-y-2 mb-4">
                        <li>Free meditation sessions are available for beginners</li>
                        <li>All our programs are offered free of charge</li>
                      </ul>
                      
                      {(center.services || center.timings) && (
                        <>
                          <h3 className="text-xl font-semibold mb-3 text-spirit-blue-700">Available Services</h3>
                          {center.services && (
                            <ul className="list-disc list-inside text-neutral-700 space-y-1 mb-4">
                              {center.services.map((service: string, idx: number) => (
                                <li key={idx}>{service}</li>
                              ))}
                            </ul>
                          )}
                          
                          {center.timings && (
                            <div className="text-neutral-700 mb-4">
                              <p><strong>Timings:</strong> {center.timings}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="lg:order-1">
                    <ContactForm 
                      center={center} 
                      pageUrl={absoluteUrl} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <Link href={formatCenterUrl(center.region || actualRegion, center.state, center.district, "")} className="text-primary hover:underline inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to {center.district} District
          </Link>
        </div>
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