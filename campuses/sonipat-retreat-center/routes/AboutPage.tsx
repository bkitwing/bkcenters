import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import { SP_CANONICAL, SP_RETREAT_NAME, SP_SEO } from '../content';
import { spOg } from '../og';
import AboutClient from '../about/AboutClient';
import { getSpAbout } from '../sp-about-data';

export const revalidate = 86400;

const pageUrl = `${SP_CANONICAL}/about`;
const { title, description, keywords, ogAlt } = SP_SEO.about;

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = spOg('about');
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

export default async function SonipatAboutPage() {
  const { title, description, keywords, ogAlt } = SP_SEO.about;
  const ogImage = spOg('about');
  const about = await getSpAbout();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          {
            name: 'Retreat Centers',
            url: 'https://www.brahmakumaris.com/centers/retreat',
          },
          { name: SP_RETREAT_NAME, url: SP_CANONICAL },
          { name: 'About', url: pageUrl },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            '@id': `${pageUrl}#webpage`,
            name: title,
            description,
            url: pageUrl,
            keywords: keywords.join(', '),
            isPartOf: { '@id': `${SP_CANONICAL}#webpage` },
            about: {
              '@type': 'Place',
              name: SP_RETREAT_NAME,
              url: SP_CANONICAL,
            },
            primaryImageOfPage: {
              '@type': 'ImageObject',
              url: ogImage,
              caption: ogAlt,
            },
            inLanguage: 'en-IN',
          }),
        }}
      />
      <AboutClient about={about} />
    </>
  );
}
