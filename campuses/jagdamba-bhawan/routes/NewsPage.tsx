import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import { JB_CANONICAL, JB_OG_IMAGES, JB_RETREAT_NAME, JB_SEO } from '../content';
import { getJbNews } from '../jb-media-data';
import NewsClient from '../news/NewsClient';

export const revalidate = 14400;

const pageUrl = `${JB_CANONICAL}/news`;
const { title, description, keywords, ogAlt } = JB_SEO.news;
const ogImage = JB_OG_IMAGES.news;

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

export default async function JagdambaBhawanNewsPage() {
  const data = await getJbNews();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          {
            name: 'Retreat Centers',
            url: 'https://www.brahmakumaris.com/centers/retreat',
          },
          { name: JB_RETREAT_NAME, url: JB_CANONICAL },
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
            isPartOf: { '@id': `${JB_CANONICAL}#webpage` },
            about: {
              '@type': 'Place',
              name: JB_RETREAT_NAME,
              url: JB_CANONICAL,
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
                    name: `Service News from ${JB_RETREAT_NAME}`,
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
