import React from 'react';
import { Metadata } from 'next';
import { LocalBusinessSchema, BreadcrumbSchema } from '@/components/StructuredData';
import { JB_CANONICAL, JB_CENTER, JB_OG_IMAGES, JB_RETREAT_NAME, JB_SEO } from '../content';
import JagdambaBhawanClient from '../JagdambaBhawanClient';
import { HomeEventsTeaser, HomeNewsTeaser } from '../HomeMediaTeasers';
import { getJbEvents, getJbNews } from '../jb-media-data';
import { getJbHome } from '../jb-home-data';
import { getJbTestimonials } from '../jb-testimonials-data';

export const revalidate = 14400;

const { title, description, keywords, ogAlt } = JB_SEO.home;
const ogImage = JB_OG_IMAGES.home;

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
      canonical: JB_CANONICAL,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: JB_CANONICAL,
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

export default async function JagdambaBhawanPage() {
  const intro =
    'Jagdamba Bhawan Retreat Center is a 3.5-acre Brahma Kumaris campus in Pisoli, Pune — opened 28 January 2018 in honour of Mateshwari Jagdamba Saraswati (Mamma) — offering Rajyoga meditation, courses and workshops.';

  const [newsData, eventsData, home, testimonials] = await Promise.all([
    getJbNews(),
    getJbEvents(),
    getJbHome(),
    getJbTestimonials(),
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
        center={JB_CENTER}
        pageUrl={JB_CANONICAL}
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
          { name: JB_RETREAT_NAME, url: JB_CANONICAL },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': `${JB_CANONICAL}#webpage`,
            name: title,
            description,
            url: JB_CANONICAL,
            keywords: keywords.join(', '),
            isPartOf: {
              '@type': 'WebSite',
              name: 'Brahma Kumaris Centers',
              url: 'https://www.brahmakumaris.com/centers',
            },
            about: { '@id': JB_CANONICAL },
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

      <JagdambaBhawanClient
        home={home}
        testimonials={testimonials.videos.length ? testimonials : null}
        eventsTeaser={<HomeEventsTeaser events={teaserEvents} />}
        newsTeaser={<HomeNewsTeaser news={teaserNews} />}
      />
    </>
  );
}
