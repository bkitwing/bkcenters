import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import { SP_CANONICAL, SP_SEO } from '../content';
import { spOg } from '../og';
import { getSpNews } from '../sp-media-data';
import NewsClient from '../news/NewsClient';

export const revalidate = 14400;

const pageUrl = `${SP_CANONICAL}/news`;
const { title, description, keywords, ogAlt } = SP_SEO.news;
const ogImage = spOg('news');

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

export default async function SonipatRetreatNewsPage() {
  const data = await getSpNews();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          {
            name: 'Retreat Centers',
            url: 'https://www.brahmakumaris.com/centers/retreat',
          },
          { name: 'Sonipat Retreat Center', url: SP_CANONICAL },
          { name: 'Service News', url: pageUrl },
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
            isPartOf: { '@id': `${SP_CANONICAL}#webpage` },
            about: {
              '@type': 'Place',
              name: 'Sonipat Retreat Center',
              url: SP_CANONICAL,
            },
            primaryImageOfPage: {
              '@type': 'ImageObject',
              url: ogImage,
              width: 1200,
              height: 630,
              caption: ogAlt,
            },
            inLanguage: 'en-IN',
            ...(data.posts.length > 0
              ? {
                  mainEntity: {
                    '@type': 'ItemList',
                    name: 'Service News from Sonipat Retreat Center',
                    numberOfItems: data.total,
                    itemListElement: data.latest.map((p, i) => ({
                      '@type': 'ListItem',
                      position: i + 1,
                      url: p.href,
                      name: p.title,
                    })),
                  },
                }
              : {}),
          }),
        }}
      />
      <NewsClient data={data} />
    </>
  );
}
