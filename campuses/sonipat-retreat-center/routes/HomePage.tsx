import React from 'react';
import { Metadata } from 'next';
import { LocalBusinessSchema, BreadcrumbSchema } from '@/components/StructuredData';
import { SP_CANONICAL, SP_CENTER, SP_SEO } from '../content';
import { spOg } from '../og';
import SonipatRetreatClient from '../SonipatRetreatClient';
import { HomeNewsTeaser } from '../HomeMediaTeasers';
import { getSpNews } from '../sp-media-data';
import { getSpHome } from '../sp-home-data';

export const revalidate = 14400;

const { title, description, keywords, ogAlt } = SP_SEO.home;
const ogImage = spOg('home');

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
    alternates: {
      canonical: SP_CANONICAL,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: SP_CANONICAL,
      siteName: 'Brahma Kumaris Centers',
      locale: 'en_IN',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SonipatRetreatPage() {
  const intro =
    'Sonipat Retreat Center is a Brahma Kumaris campus in Sonipat, Haryana, for Rajyoga meditation, courses, retreats and inner growth.';

  const [newsData, home] = await Promise.all([getSpNews(), getSpHome()]);
  const teaserNews = newsData.latest.slice(0, 3);

  return (
    <>
      <LocalBusinessSchema
        center={SP_CENTER}
        pageUrl={SP_CANONICAL}
        description={intro}
        image={ogImage}
        omitOpeningHours
      />
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          {
            name: 'Retreat Centers',
            url: 'https://www.brahmakumaris.com/centers/retreat',
          },
          { name: 'Sonipat Retreat Center', url: SP_CANONICAL },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': `${SP_CANONICAL}#webpage`,
            name: title,
            description,
            url: SP_CANONICAL,
            keywords: keywords.join(', '),
            isPartOf: {
              '@type': 'WebSite',
              name: 'Brahma Kumaris Centers',
              url: 'https://www.brahmakumaris.com/centers',
            },
            about: { '@id': SP_CANONICAL },
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

      {home.heroImage || home.heroSlidesMobile[0] ? (
        <>
          {home.heroSlidesMobile[0] ? (
            // eslint-disable-next-line @next/next/no-head-element -- mobile LCP
            <link
              rel="preload"
              as="image"
              href={
                home.heroSlidesMobile[0].srcMobile ||
                home.heroSlidesMobile[0].src
              }
              media="(max-width: 767px)"
              fetchPriority="high"
            />
          ) : null}
          {home.heroImage ? (
            // eslint-disable-next-line @next/next/no-head-element -- desktop LCP
            <link
              rel="preload"
              as="image"
              href={home.heroImage}
              media="(min-width: 768px)"
              fetchPriority="high"
            />
          ) : null}
        </>
      ) : null}

      <SonipatRetreatClient
        home={home}
        newsTeaser={<HomeNewsTeaser news={teaserNews} />}
      />
    </>
  );
}
