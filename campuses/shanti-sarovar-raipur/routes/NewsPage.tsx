import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import NewsClient from '../news/NewsClient';
import { getSrpNews } from '../news-data';
import { SRP_CANONICAL, SRP_OG_IMAGES, SRP_RETREAT_NAME, SRP_SEO } from '../content';

export const revalidate = 14400;

const pageUrl = `${SRP_CANONICAL}/news`;
const { title, description, keywords, ogAlt } = SRP_SEO.news;
const ogImage = SRP_OG_IMAGES.news;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title,
    description,
    keywords: [...keywords],
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

export default async function ShantiSarovarRaipurNewsPage() {
  const data = await getSrpNews();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          { name: 'Retreat Centers', url: 'https://www.brahmakumaris.com/centers/retreat' },
          { name: SRP_RETREAT_NAME, url: SRP_CANONICAL },
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
            isPartOf: { '@id': `${SRP_CANONICAL}#webpage` },
            about: {
              '@type': 'Place',
              name: SRP_RETREAT_NAME,
              url: SRP_CANONICAL,
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
                    name: `Service News from ${SRP_RETREAT_NAME}`,
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
