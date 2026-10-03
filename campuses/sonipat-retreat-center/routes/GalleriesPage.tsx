import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import { SP_CANONICAL, SP_SEO } from '../content';
import { spOg } from '../og';
import { getSpGalleries } from '../sp-gallery-data';
import GalleriesClient from '../galleries/GalleriesClient';

export const revalidate = 86400;

const pageUrl = `${SP_CANONICAL}/galleries`;
const { title, description, keywords, ogAlt } = SP_SEO.galleries;
const ogImage = spOg('galleries');

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

export default async function SonipatRetreatGalleriesPage() {
  const data = await getSpGalleries();
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
          { name: 'Sonipat Retreat Center', url: SP_CANONICAL },
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
              ? `${primary.heading} | Sonipat Retreat Center`
              : title,
            description,
            url: pageUrl,
            keywords: keywords.join(', '),
            numberOfItems: data.totalImages,
            isPartOf: { '@id': `${SP_CANONICAL}#webpage` },
            about: {
              '@type': 'Place',
              name: 'Sonipat Retreat Center',
              url: SP_CANONICAL,
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
