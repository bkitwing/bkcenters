import React from 'react';
import { Metadata } from 'next';
import { LocalBusinessSchema, BreadcrumbSchema } from '@/components/StructuredData';
import { generateOgImageUrl } from '@/lib/ogUtils';
import { SS_CANONICAL, SS_CENTER } from '../content';
import ShantiSarovarClient from '../ShantiSarovarClient';
import { HomeEventsTeaser, HomeNewsTeaser } from '../HomeMediaTeasers';
import { getSsEvents, getSsNews } from '../ss-media-data';
import { getSsHome } from '../ss-home-data';

export const revalidate = 3600;

const title = 'Shanti Sarovar Hyderabad — Brahma Kumaris Retreat Campus';
const description =
  '34-acre Brahma Kumaris retreat campus in Gachibowli, Hyderabad. Rajyoga meditation, courses, retreats and how to visit.';

export async function generateMetadata(): Promise<Metadata> {
  const home = await getSsHome();
  const ogImage =
    home.heroImage ||
    generateOgImageUrl({
      title: 'Shanti Sarovar',
      description:
        'Academy for a Better World · Gachibowli, Hyderabad · 34-acre retreat campus',
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
          alt: 'Shanti Sarovar — Brahma Kumaris Retreat Campus, Hyderabad',
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
    'Shanti Sarovar (Academy for a Better World) is a 34-acre Brahma Kumaris retreat campus in Gachibowli, Hyderabad — the largest in South India — offering Rajyoga meditation, values courses, retreats and workshops.';

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
        omitOpeningHours
      />
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          {
            name: 'Retreat Centers',
            url: 'https://www.brahmakumaris.com/centers/retreat',
          },
          { name: 'Shanti Sarovar', url: SS_CANONICAL },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': `${SS_CANONICAL}#webpage`,
            name: 'Shanti Sarovar — Brahma Kumaris Retreat Campus',
            description: intro,
            url: SS_CANONICAL,
            isPartOf: {
              '@type': 'WebSite',
              name: 'Brahma Kumaris Centers',
              url: 'https://www.brahmakumaris.com/centers',
            },
            about: { '@id': SS_CANONICAL },
            inLanguage: 'en-IN',
            ...(home.heroImage
              ? {
                  primaryImageOfPage: {
                    '@type': 'ImageObject',
                    url: home.heroImage,
                  },
                }
              : {}),
          }),
        }}
      />

      {home.heroImage ? (
        // eslint-disable-next-line @next/next/no-head-element -- preload LCP slide only
        <link
          rel="preload"
          as="image"
          href={home.heroImage}
          fetchPriority="high"
          {...(home.heroSlides[0]?.srcMobile && home.heroSlides[0]?.srcDesktop
            ? {
                imageSrcSet: `${home.heroSlides[0].srcMobile} 900w, ${home.heroSlides[0].srcDesktop} 1920w`,
                imageSizes: '100vw',
              }
            : {})}
        />
      ) : null}

      <ShantiSarovarClient
        home={home}
        eventsTeaser={<HomeEventsTeaser events={teaserEvents} />}
        newsTeaser={<HomeNewsTeaser news={teaserNews} />}
      />
    </>
  );
}
