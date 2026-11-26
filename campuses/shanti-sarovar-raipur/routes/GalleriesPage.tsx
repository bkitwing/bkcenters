import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import GalleriesClient from '../galleries/GalleriesClient';
import { getSrpGalleries } from '../gallery-data';
import { SRP_CANONICAL, SRP_OG_IMAGES, SRP_RETREAT_NAME, SRP_SEO } from '../content';

export const revalidate = 86400;

const pageUrl = `${SRP_CANONICAL}/galleries`;
const { title, description, keywords, ogAlt } = SRP_SEO.galleries;
const ogImage = SRP_OG_IMAGES.galleries;

export function generateMetadata(): Metadata {
  return {
    title,
    description,
    keywords: [...keywords],
    robots: { index: true, follow: true },
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      type: 'website',
      url: pageUrl,
      siteName: 'Brahma Kumaris Centers',
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1280, height: 720, alt: ogAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ShantiSarovarRaipurGalleriesPage() {
  const data = await getSrpGalleries();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          { name: 'Retreat Centers', url: 'https://www.brahmakumaris.com/centers/retreat' },
          { name: SRP_RETREAT_NAME, url: SRP_CANONICAL },
          { name: 'Gallery', url: pageUrl },
        ]}
      />
      <GalleriesClient data={data} />
    </>
  );
}
