import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import { SS_CANONICAL, SS_OG_IMAGES, SS_SEO } from '../content';
import { getSsEvents } from '../ss-media-data';
import EventsClient from '../events/EventsClient';

export const revalidate = 14400;

const pageUrl = `${SS_CANONICAL}/events`;
const { title, description, keywords, ogAlt } = SS_SEO.events;
const ogImage = SS_OG_IMAGES.events;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title,
    description,
    keywords,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      type: 'website',
      url: pageUrl,
      siteName: 'Brahma Kumaris Centers',
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ShantiSarovarEventsPage() {
  const data = await getSsEvents();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          {
            name: 'Retreat Centers',
            url: 'https://www.brahmakumaris.com/centers/retreat',
          },
          { name: 'Shanti Sarovar Retreat Center', url: SS_CANONICAL },
          { name: 'Events', url: pageUrl },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            '@id': `${pageUrl}#webpage`,
            name: title,
            description,
            url: pageUrl,
            keywords: keywords.join(', '),
            isPartOf: { '@id': `${SS_CANONICAL}#webpage` },
            about: {
              '@type': 'Place',
              name: 'Shanti Sarovar Retreat Center',
              url: SS_CANONICAL,
            },
            primaryImageOfPage: {
              '@type': 'ImageObject',
              url: ogImage,
              width: 1200,
              height: 630,
              caption: ogAlt,
            },
            inLanguage: 'en-IN',
            ...(data.events.length > 0
              ? {
                  mainEntity: {
                    '@type': 'ItemList',
                    name: 'Events at Shanti Sarovar Retreat Center',
                    numberOfItems: data.total,
                    itemListElement: [
                      ...data.ongoing,
                      ...data.upcoming,
                      ...data.past,
                    ]
                      .slice(0, 8)
                      .map((e, i) => ({
                        '@type': 'ListItem',
                        position: i + 1,
                        url: e.href,
                        name: e.title,
                      })),
                  },
                }
              : {}),
          }),
        }}
      />
      <EventsClient data={data} />
    </>
  );
}
