import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { SS_CANONICAL } from '../content';
import { getSsGalleries } from '../ss-gallery-data';
import GalleriesClient from '../galleries/GalleriesClient';

export const revalidate = 86400;

const pageUrl = `${SS_CANONICAL}/galleries`;
const defaultTitle = 'Photo Galleries — Shanti Sarovar | Brahma Kumaris Hyderabad';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSsGalleries();
  const primary = data.groups[0];
  const title = defaultTitle;
  const description =
    primary?.subheading ||
    `Browse ${data.totalImages || ''} photos from Shanti Sarovar — campus, retreats, conferences and service at the Brahma Kumaris Academy for a Better World, Hyderabad.`.replace(
      /\s+/g,
      ' '
    );

  const ogImage =
    data.heroImage ||
    generateOgImageUrl({
      title: primary?.heading || 'Shanti Sarovar Galleries',
      description: `${data.totalImages || ''} photos · Hyderabad retreat campus`,
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

export default async function ShantiSarovarGalleriesPage() {
  const data = await getSsGalleries();
  const primary = data.groups[0];
  const description =
    primary?.subheading ||
    `Browse ${data.totalImages} photos from Shanti Sarovar — campus, retreats, conferences and service at the Brahma Kumaris Academy for a Better World, Hyderabad.`;

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
          { name: 'Galleries', url: pageUrl },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ImageGallery',
            name: primary?.heading
              ? `${primary.heading} — Shanti Sarovar`
              : 'Shanti Sarovar Photo Galleries',
            description,
            url: pageUrl,
            numberOfItems: data.totalImages,
            isPartOf: { '@type': 'WebPage', url: SS_CANONICAL },
            ...(data.heroImage
              ? { image: data.heroImage }
              : {}),
          }),
        }}
      />
      <GalleriesClient data={data} />
    </>
  );
}
