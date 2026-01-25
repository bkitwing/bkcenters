'use client';

import { Center } from '@/lib/types';

interface OrganizationSchemaProps {
  baseUrl?: string;
}

export function OrganizationSchema({ baseUrl = 'https://www.brahmakumaris.com' }: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Brahma Kumaris',
    alternateName: 'Prajapita Brahma Kumaris Ishwariya Vishwa Vidyalaya',
    url: baseUrl,
    logo: 'https://www.brahmakumaris.com/centers/brahma-kumaris-logo.webp',
    description: 'Brahma Kumaris is a worldwide spiritual movement dedicated to personal transformation and world renewal through Rajyoga Meditation.',
    foundingDate: '1937',
    foundingLocation: {
      '@type': 'Place',
      name: 'Hyderabad, Sindh (now in Pakistan)',
    },
    location: {
      '@type': 'Place',
      name: 'Shantivan Complex',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Shantivan Complex, Post Box No-1',
        addressLocality: 'Abu Road',
        addressRegion: 'Rajasthan',
        postalCode: '307510',
        addressCountry: 'IN',
      },
    },
    sameAs: [
      'https://www.youtube.com/brahmakumaris',
      'https://www.instagram.com/brahmakumaris/',
      'https://en.wikipedia.org/wiki/Brahma_Kumaris',
      'https://x.com/BrahmaKumaris',
      'https://www.facebook.com/brahmakumaris',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Spiritual Helpline',
      availableLanguage: ['English', 'Hindi'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface LocalBusinessSchemaProps {
  center: Center;
  pageUrl: string;
}

export function LocalBusinessSchema({ center, pageUrl }: LocalBusinessSchemaProps) {
  const formatAddress = () => {
    const { line1, line2, line3, city, pincode } = center.address || {};
    let parts = [];
    if (line1) parts.push(line1);
    if (line2) parts.push(line2);
    if (line3) parts.push(line3);
    return parts.join(', ');
  };

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'Place', 'ReligiousOrganization'],
    '@id': pageUrl,
    name: center.name,
    description: `Brahma Kumaris Rajyoga Meditation Center - ${center.name}. Free meditation classes and spiritual courses available.`,
    url: pageUrl,
    image: 'https://www.brahmakumaris.com/centers/brahma-kumaris-logo.webp',
    address: {
      '@type': 'PostalAddress',
      streetAddress: formatAddress(),
      addressLocality: center.address?.city || center.district,
      addressRegion: center.state,
      postalCode: center.address?.pincode || '',
      addressCountry: center.country || 'IN',
    },
    geo: center.coords && center.coords.length === 2 ? {
      '@type': 'GeoCoordinates',
      latitude: parseFloat(center.coords[0]),
      longitude: parseFloat(center.coords[1]),
    } : undefined,
    telephone: center.contact || center.mobile || undefined,
    email: center.email || undefined,
    priceRange: 'Free',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '07:00',
        closes: '10:00',
        description: 'Morning Session - Please contact center to confirm timings',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '17:00',
        closes: '20:00',
        description: 'Evening Session - Please contact center to confirm timings',
      },
    ],
    parentOrganization: {
      '@type': 'Organization',
      name: 'Brahma Kumaris',
      url: 'https://www.brahmakumaris.com',
    },
    sameAs: [
      'https://www.brahmakumaris.com',
    ],
    hasMap: center.coords && center.coords.length === 2 
      ? `https://www.google.com/maps?q=${center.coords[0]},${center.coords[1]}`
      : undefined,
    isAccessibleForFree: true,
    publicAccess: true,
  };

  // Remove undefined values
  const cleanSchema = JSON.parse(JSON.stringify(schema));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQPageSchemaProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQPageSchema({ faqs }: FAQPageSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebSiteSchemaProps {
  baseUrl?: string;
}

export function WebSiteSchema({ baseUrl = 'https://www.brahmakumaris.com/centers' }: WebSiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Brahma Kumaris Center Locator',
    alternateName: 'BK Centers',
    url: baseUrl,
    description: 'Find Brahma Kumaris Rajyoga Meditation Centers near you across India and Nepal.',
    publisher: {
      '@type': 'Organization',
      name: 'Brahma Kumaris',
      url: 'https://www.brahmakumaris.com',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface PlaceSchemaProps {
  name: string;
  description: string;
  region?: string;
  state?: string;
  centerCount: number;
  pageUrl: string;
}

export function PlaceSchema({ name, description, region, state, centerCount, pageUrl }: PlaceSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `Brahma Kumaris Centers in ${name}`,
    description,
    url: pageUrl,
    containedInPlace: region ? {
      '@type': 'Place',
      name: region,
    } : undefined,
    numberOfItems: centerCount,
  };

  const cleanSchema = JSON.parse(JSON.stringify(schema));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema) }}
    />
  );
}
