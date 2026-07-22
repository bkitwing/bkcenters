import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { SS_CANONICAL } from '../content';
import { getSsNews } from '../ss-media-data';
import NewsClient from '../news/NewsClient';

export const revalidate = 3600;

const pageUrl = `${SS_CANONICAL}/news`;
const title = 'News — Shanti Sarovar | Brahma Kumaris Hyderabad';
const description =
  'Campus news from Shanti Sarovar, Hyderabad — retreats, conferences, seva and campus highlights.';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSsNews();
  const ogImage =
    data.heroImage ||
    generateOgImageUrl({
      title: 'Shanti Sarovar News',
      description: `${data.total || ''} campus stories · Hyderabad`,
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

export default async function ShantiSarovarNewsPage() {
  const data = await getSsNews();

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
          { name: 'News', url: pageUrl },
        ]}
      />
      {data.posts.length > 0 ? (
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
                itemListElement: data.latest.map((p, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  url: p.href,
                  name: p.title,
                })),
              },
            }),
          }}
        />
      ) : null}
      <NewsClient data={data} />
    </>
  );
}
