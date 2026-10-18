import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import GalleriesClient from '../galleries/GalleriesClient';
import { getShkGalleries } from '../gallery-data';
import { SHK_CANONICAL, SHK_OG_IMAGES, SHK_RETREAT_NAME, SHK_SEO } from '../content';

export const revalidate = 86400;

const pageUrl = `${SHK_CANONICAL}/galleries`;
const { title, description, keywords, ogAlt } = SHK_SEO.galleries;
const ogImage = SHK_OG_IMAGES.galleries;

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
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogAlt }],
    },
  };
}

export default async function ShantiShikharGalleriesPage() {
  const data = await getShkGalleries();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          { name: 'Retreat Centers', url: 'https://www.brahmakumaris.com/centers/retreat' },
          { name: SHK_RETREAT_NAME, url: SHK_CANONICAL },
          { name: 'Gallery', url: pageUrl },
        ]}
      />
      <GalleriesClient data={data} />
    </>
  );
}
