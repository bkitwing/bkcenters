import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import { JB_CANONICAL, JB_OG_IMAGES, JB_RETREAT_NAME, JB_SEO } from '../content';
import { getJbGalleries } from '../jb-gallery-data';
import GalleriesClient from '../galleries/GalleriesClient';

export const revalidate = 86400;

const pageUrl = `${JB_CANONICAL}/galleries`;
const { title, description, keywords, ogAlt } = JB_SEO.galleries;
const ogImage = JB_OG_IMAGES.galleries;

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

export default async function JagdambaBhawanGalleriesPage() {
  const data = await getJbGalleries();
  const primary = data.groups[0];

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
          { name: 'Galleries', url: pageUrl },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ImageGallery',
            '@id': `${pageUrl}#webpage`,
            name: primary?.heading
              ? `${primary.heading} | ${JB_RETREAT_NAME}`
              : title,
            description,
            url: pageUrl,
            keywords: keywords.join(', '),
            numberOfItems: data.totalImages,
            isPartOf: { '@id': `${JB_CANONICAL}#webpage` },
            about: {
              '@type': 'Place',
              name: JB_RETREAT_NAME,
              url: JB_CANONICAL,
            },
            image: ogImage,
            primaryImageOfPage: {
              '@type': 'ImageObject',
              url: ogImage,
              width: 1200,
              height: 630,
              caption: ogAlt,
            },
            inLanguage: 'en-IN',
          }),
        }}
      />
      <GalleriesClient data={data} />
    </>
  );
}
