'use client';

import { Center, NewsPost } from '@/lib/types';

interface OrganizationSchemaProps {
  baseUrl?: string;
}

export function OrganizationSchema({ baseUrl = 'https://www.brahmakumaris.com' }: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://www.brahmakumaris.com/#organization',
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
    areaServed: [
      { '@type': 'Country', name: 'India' },
      { '@type': 'Country', name: 'Nepal' },
    ],
    sameAs: [
      'https://www.youtube.com/brahmakumaris',
      'https://www.instagram.com/brahmakumaris/',
      'https://en.wikipedia.org/wiki/Brahma_Kumaris',
      'https://www.wikidata.org/wiki/Q897299',
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
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Free Spiritual Courses & Services',
      itemListElement: [
        {
          '@type': 'Offer',
          name: '7-Day Rajyoga Meditation Course',
          price: '0',
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          url: 'https://courses.brahmakumaris.com',
          itemOffered: {
            '@type': 'Course',
            name: '7-Day Rajyoga Meditation Course',
            url: 'https://courses.brahmakumaris.com',
          },
        },
        {
          '@type': 'Offer',
          name: 'Daily Meditation Classes',
          price: '0',
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          itemOffered: {
            '@type': 'Service',
            name: 'Daily Rajyoga Meditation Classes',
          },
        },
      ],
    },
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
    mainEntity: {
      '@type': 'Organization',
      '@id': 'https://www.brahmakumaris.com/#organization',
      name: 'Brahma Kumaris',
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
  placeType?: 'Place' | 'AdministrativeArea';
}

export function PlaceSchema({ name, description, region, state, centerCount, pageUrl, placeType = 'Place' }: PlaceSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': placeType,
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

interface ItemListSchemaProps {
  name: string;
  description: string;
  url: string;
  items: Array<{ name: string; url: string; position: number }>;
}

export function ItemListSchema({ name, description, url, items }: ItemListSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    url,
    numberOfItems: items.length,
    itemListElement: items.map(item => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface CourseSchemaProps {
  centerName: string;
  centerUrl: string;
}

export function CourseSchema({ centerName, centerUrl }: CourseSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: '7-Day Rajyoga Meditation Course',
    description: 'A free 7-day introductory course in Rajyoga meditation covering knowledge of the soul, Supreme Soul, law of karma, cycle of time, and the power of purity. Open to all, no prior experience required.',
    url: 'https://courses.brahmakumaris.com',
    educationalLevel: 'Beginner',
    teaches: ['Rajyoga Meditation', 'Spiritual Knowledge', 'Self-realization', 'Soul consciousness'],
    inLanguage: ['en', 'hi'],
    isAccessibleForFree: true,
    provider: {
      '@type': 'Organization',
      '@id': 'https://www.brahmakumaris.com/#organization',
      name: 'Brahma Kumaris',
      url: 'https://www.brahmakumaris.com',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: 'https://courses.brahmakumaris.com',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'onsite',
      location: {
        '@type': 'Place',
        name: centerName,
        url: centerUrl,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface EventSchemaProps {
  center: Center;
  centerUrl: string;
}

export function EventSchema({ center, centerUrl }: EventSchemaProps) {
  const address = {
    '@type': 'PostalAddress',
    streetAddress: [center.address?.line1, center.address?.line2, center.address?.line3].filter(Boolean).join(', '),
    addressLocality: center.address?.city || center.district,
    addressRegion: center.state,
    postalCode: center.address?.pincode || '',
    addressCountry: center.country || 'IN',
  };

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `Rajyoga Meditation Class at ${center.name}`,
    description: `Free Rajyoga meditation class at ${center.name}, a Brahma Kumaris center in ${center.district}, ${center.state}. Open to all, no prior experience required.`,
    organizer: {
      '@type': 'Organization',
      '@id': 'https://www.brahmakumaris.com/#organization',
      name: 'Brahma Kumaris',
      url: 'https://www.brahmakumaris.com',
    },
    location: {
      '@type': 'Place',
      name: center.name,
      address,
      ...(center.coords && center.coords.length === 2 ? {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: parseFloat(center.coords[0]),
          longitude: parseFloat(center.coords[1]),
        },
      } : {}),
    },
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    isAccessibleForFree: true,
    url: 'https://www.brahmakumaris.com/events',
    inLanguage: 'en',
    audience: {
      '@type': 'Audience',
      audienceType: 'General Public',
    },
  };

  const cleanEventSchema = JSON.parse(JSON.stringify(schema));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanEventSchema) }}
    />
  );
}

interface HowToSchemaProps {
  center: Center;
  centerUrl: string;
}

export function HowToSchema({ center, centerUrl }: HowToSchemaProps) {
  const formatAddress = () => {
    const { line1, line2, line3, city, pincode } = center.address || {};
    return [line1, line2, line3, city, pincode, center.state].filter(Boolean).join(', ');
  };

  const contact = center.contact || center.mobile;
  const address = formatAddress();

  const steps: Array<Record<string, any>> = [
    {
      '@type': 'HowToStep',
      position: '1',
      name: 'Find the Center Location',
      text: `The center is located at: ${address}.`,
    },
  ];

  if (contact) {
    steps.push({
      '@type': 'HowToStep',
      position: '2',
      name: 'Contact Before Visiting',
      text: `Call ${contact} to confirm class timings and get directions if needed.`,
    });
  }

  steps.push({
    '@type': 'HowToStep',
    position: String(steps.length + 1),
    name: 'Get Directions',
    text: `Use Google Maps or any navigation app to reach ${address}.`,
  });

  steps.push({
    '@type': 'HowToStep',
    position: String(steps.length + 1),
    name: 'Attend the Meditation Class',
    text: 'Morning classes: 7:00\u201310:00. Evening classes: 17:00\u201320:00. All are welcome. Classes are free. No registration or membership required.',
  });

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Visit ${center.name} Meditation Center`,
    description: `Step-by-step guide to visiting the Brahma Kumaris Rajyoga Meditation Center at ${address}. All classes are free and open to everyone.`,
    url: centerUrl,
    isAccessibleForFree: true,
    totalTime: 'PT1H',
    step: steps,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface DatasetSchemaProps {
  totalCenters?: number;
}

export function DatasetSchema({ totalCenters }: DatasetSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Brahma Kumaris Meditation Centers \u2014 India & Nepal',
    description: `A comprehensive directory of ${totalCenters ? totalCenters + ' ' : ''}Brahma Kumaris Rajyoga meditation centers across India and Nepal, including address, contact information, and geographic coordinates.`,
    url: 'https://www.brahmakumaris.com/centers',
    creator: {
      '@type': 'Organization',
      '@id': 'https://www.brahmakumaris.com/#organization',
      name: 'Brahma Kumaris',
      url: 'https://www.brahmakumaris.com',
    },
    keywords: ['meditation centers', 'Brahma Kumaris', 'Rajyoga', 'India', 'Nepal', 'spiritual centers', 'free meditation'],
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,
    spatialCoverage: {
      '@type': 'Place',
      name: 'India and Nepal',
    },
    temporalCoverage: '2024/..',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface NewsArticleListSchemaProps {
  posts: NewsPost[];
  centerName: string;
  centerUrl: string;
}

export function NewsArticleListSchema({ posts, centerName, centerUrl }: NewsArticleListSchemaProps) {
  if (!posts || posts.length === 0) return null;

  const NEWS_BASE_URL = 'https://www.brahmakumaris.com/news/post';

  const articleSchemas = posts.map((post) => {
    const imageUrl =
      post.featuredImage?.formats?.HD?.url ||
      post.featuredImage?.formats?.miniHD?.url ||
      post.featuredImage?.url ||
      undefined;

    const schema: Record<string, any> = {
      '@type': 'NewsArticle',
      headline: post.title,
      url: `${NEWS_BASE_URL}/${post.slug}`,
      datePublished: post.date,
      publisher: {
        '@type': 'Organization',
        '@id': 'https://www.brahmakumaris.com/#organization',
        name: 'Brahma Kumaris',
        url: 'https://www.brahmakumaris.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.brahmakumaris.com/centers/brahma-kumaris-logo.webp',
        },
      },
      author: {
        '@type': 'Organization',
        name: 'Brahma Kumaris',
        url: 'https://www.brahmakumaris.com',
      },
      about: {
        '@type': 'Place',
        name: centerName,
        url: centerUrl,
      },
    };

    if (imageUrl) {
      schema.image = {
        '@type': 'ImageObject',
        url: imageUrl,
        caption: post.featuredImage?.alternativeText || post.title,
      };
    }

    return schema;
  });

  const listSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `News & Updates from ${centerName}`,
    description: `Latest news and updates from ${centerName}, a Brahma Kumaris Rajyoga Meditation Center.`,
    numberOfItems: posts.length,
    itemListElement: articleSchemas.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: article,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }}
    />
  );
}
