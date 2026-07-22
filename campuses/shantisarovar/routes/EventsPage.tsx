import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { SS_CANONICAL } from '../content';
import { getSsEvents } from '../ss-media-data';
import EventsClient from '../events/EventsClient';

export const revalidate = 3600;

const pageUrl = `${SS_CANONICAL}/events`;
const title = 'Events — Shanti Sarovar | Brahma Kumaris Hyderabad';
const description =
  'Upcoming and past events at Shanti Sarovar, Hyderabad — retreats, workshops and campus programmes.';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSsEvents();
  const ogImage =
    data.heroImage ||
    generateOgImageUrl({
      title: 'Shanti Sarovar Events',
      description: `${data.total || ''} programmes · Hyderabad`,
      type: 'retreat',
      location: 'Hyderabad, Telangana',
    });

  return {
    title,
    description,
    keywords: [],
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
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
      {/* JSON-LD BreadcrumbList only — not rendered as visible UI */}
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          {
            name: 'Retreat Centers',
            url: 'https://www.brahmakumaris.com/centers/retreat',
          },
          { name: 'Shanti Sarovar', url: SS_CANONICAL },
          { name: 'Events', url: pageUrl },
        ]}
      />
      {data.events.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: title,
              description,
              url: pageUrl,
              isPartOf: { '@type': 'WebPage', url: SS_CANONICAL },
              mainEntity: {
                '@type': 'ItemList',
                numberOfItems: data.total,
                itemListElement: [...data.ongoing, ...data.upcoming, ...data.past]
                  .slice(0, 8)
                  .map((e, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    url: e.href,
                    name: e.title,
                  })),
              },
            }),
          }}
        />
      ) : null}
      <EventsClient data={data} />
    </>
  );
}
