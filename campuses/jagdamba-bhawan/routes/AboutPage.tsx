import { Metadata } from 'next';
import { BreadcrumbSchema } from '@/components/StructuredData';
import { JB_CANONICAL, JB_OG_IMAGES, JB_RETREAT_NAME, JB_SEO } from '../content';
import { getJbAbout } from '../jb-about-data';
import AboutClient from '../about/AboutClient';

export const revalidate = 86400;

const pageUrl = `${JB_CANONICAL}/about`;
const { title, description, keywords, ogAlt } = JB_SEO.about;
const ogImage = JB_OG_IMAGES.about;

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

export default async function JagdambaBhawanAboutPage() {
  const data = await getJbAbout();
  const og = data.heroImage || ogImage;

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
            isPartOf: { '@id': `${JB_CANONICAL}#webpage` },
            about: {
              '@type': 'Place',
              name: JB_RETREAT_NAME,
              url: JB_CANONICAL,
            },
            primaryImageOfPage: {
              '@type': 'ImageObject',
              url: og,
              width: 1200,
              height: 630,
              caption: ogAlt,
            },
            inLanguage: 'en-IN',
          }),
        }}
      />
      {data.heroImage ? (
        // eslint-disable-next-line @next/next/no-head-element -- LCP
        <link rel="preload" as="image" href={data.heroImage} fetchPriority="high" />
      ) : null}
      <AboutClient data={data} />
    </>
  );
}
