import { Metadata } from 'next';
import { BreadcrumbSchema, LocalBusinessSchema } from '@/components/StructuredData';
import { HomeNewsTeaser } from '../HomeMediaTeasers';
import ShantiShikharClient from '../ShantiShikharClient';
import { getShkAboutImage, getShkGallery, getShkHeroSlides, getShkServices } from '../logo-data';
import { getShkNews } from '../news-data';
import {
  SHK_CANONICAL,
  SHK_CENTER,
  SHK_CONTENT,
  SHK_OG_IMAGES,
  SHK_RETREAT_NAME,
  SHK_SEO,
} from '../content';

export const revalidate = 14400;

const { title, description, keywords, ogAlt } = SHK_SEO.home;
const ogImage = SHK_OG_IMAGES.home;

export function generateMetadata(): Metadata {
  return {
    title,
    description,
    keywords: [...keywords],
    robots: { index: true, follow: true },
    alternates: { canonical: SHK_CANONICAL },
    openGraph: {
      title,
      description,
      type: 'website',
      url: SHK_CANONICAL,
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

export default async function ShantiShikharHomePage() {
  const [news, heroSlides, aboutImage, services, gallery] = await Promise.all([
    getShkNews(),
    getShkHeroSlides(),
    getShkAboutImage(),
    getShkServices(),
    getShkGallery(),
  ]);

  return (
    <>
      <LocalBusinessSchema
        center={SHK_CENTER}
        pageUrl={SHK_CANONICAL}
        description={SHK_CONTENT.about.paragraphs[0]}
        image={ogImage}
        omitOpeningHours
      />
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          { name: 'Retreat Centers', url: 'https://www.brahmakumaris.com/centers/retreat' },
          { name: SHK_RETREAT_NAME, url: SHK_CANONICAL },
        ]}
      />
      <ShantiShikharClient
        heroSlides={heroSlides}
        aboutImage={aboutImage}
        services={services}
        gallery={gallery}
        newsTeaser={<HomeNewsTeaser news={news.latest} />}
      />
    </>
  );
}
