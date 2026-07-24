import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import { SS_CANONICAL, SS_OG_IMAGES, SS_SEO } from '../content';
import CsrPageClient from '../csr/CsrPageClient';

export const revalidate = 86400;

const pageUrl = `${SS_CANONICAL}/csr`;
const { title, description, keywords, ogAlt } = SS_SEO.csr;
const ogImage = SS_OG_IMAGES.csr;

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
      title: 'CSR Partnerships at Shanti Sarovar',
      description:
        'Discover values-led CSR initiatives that support community wellbeing, environmental sustainability and lasting social impact.',
      type: 'website',
      url: pageUrl,
      siteName: 'Brahma Kumaris Centers',
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'CSR Partnerships at Shanti Sarovar',
      description:
        'Discover values-led CSR initiatives that support community wellbeing, environmental sustainability and lasting social impact.',
      images: [ogImage],
    },
  };
}

export default function ShantiSarovarCsrPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          {
            name: 'Retreat Centers',
            url: 'https://www.brahmakumaris.com/centers/retreat',
          },
          { name: 'Shanti Sarovar', url: SS_CANONICAL },
          { name: 'CSR Partnerships', url: pageUrl },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': `${pageUrl}#webpage`,
            name: title,
            description,
            url: pageUrl,
            keywords: keywords.join(', '),
            isPartOf: { '@id': `${SS_CANONICAL}#webpage` },
            about: {
              '@type': 'Place',
              name: 'Shanti Sarovar Retreat Center',
              url: SS_CANONICAL,
            },
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
      <CsrPageClient />
    </>
  );
}
