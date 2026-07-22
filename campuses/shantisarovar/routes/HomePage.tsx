import React from 'react';
import { Metadata } from 'next';
import { LocalBusinessSchema, BreadcrumbSchema } from '@/components/StructuredData';
import { SS_CANONICAL, SS_CENTER, SS_OG_IMAGES, SS_SEO } from '../content';
import ShantiSarovarClient from '../ShantiSarovarClient';
import { HomeEventsTeaser, HomeNewsTeaser } from '../HomeMediaTeasers';
import { getSsEvents, getSsNews } from '../ss-media-data';
import { getSsHome } from '../ss-home-data';

export const revalidate = 14400;

const { title, description, keywords, ogAlt } = SS_SEO.home;
const ogImage = SS_OG_IMAGES.home;

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
      canonical: SS_CANONICAL,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: SS_CANONICAL,
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

export default async function ShantiSarovarPage() {
  const intro =
    'Shanti Sarovar Retreat Center (Academy for a Better World) is a 34-acre Brahma Kumaris campus in Gachibowli, Hyderabad — the largest in South India — offering Rajyoga meditation, values courses, retreats and workshops.';

  const [newsData, eventsData, home] = await Promise.all([
    getSsNews(),
    getSsEvents(),
    getSsHome(),
  ]);
  const teaserEvents = [
    ...eventsData.ongoing,
    ...eventsData.upcoming,
    ...eventsData.past,
  ].slice(0, 3);
  const teaserNews = newsData.latest.slice(0, 3);

  return (
    <>
      <LocalBusinessSchema
        center={SS_CENTER}
        pageUrl={SS_CANONICAL}
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
          { name: 'Shanti Sarovar Retreat Center', url: SS_CANONICAL },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': `${SS_CANONICAL}#webpage`,
            name: title,
            description,
            url: SS_CANONICAL,
            keywords: keywords.join(', '),
            isPartOf: {
              '@type': 'WebSite',
              name: 'Brahma Kumaris Centers',
              url: 'https://www.brahmakumaris.com/centers',
            },
            about: { '@id': SS_CANONICAL },
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

      <ShantiSarovarClient
        home={home}
        eventsTeaser={<HomeEventsTeaser events={teaserEvents} />}
        newsTeaser={<HomeNewsTeaser news={teaserNews} />}
      />
    </>
  );
}
