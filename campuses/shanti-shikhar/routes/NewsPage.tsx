import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import NewsClient from '../news/NewsClient';
import { getShkNews } from '../news-data';
import { SHK_CANONICAL, SHK_OG_IMAGE, SHK_RETREAT_NAME, SHK_SEO } from '../content';

export const revalidate = 14400;

const pageUrl = `${SHK_CANONICAL}/news`;
const { title, description, keywords, ogAlt } = SHK_SEO.news;

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
      images: [{ url: SHK_OG_IMAGE, width: 1200, height: 630, alt: ogAlt }],
    },
  };
}

export default function ShantiShikharNewsPage() {
  const data = getShkNews();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          { name: 'Retreat Centers', url: 'https://www.brahmakumaris.com/centers/retreat' },
          { name: SHK_RETREAT_NAME, url: SHK_CANONICAL },
          { name: 'News', url: pageUrl },
        ]}
      />
      <NewsClient data={data} />
    </>
  );
}
