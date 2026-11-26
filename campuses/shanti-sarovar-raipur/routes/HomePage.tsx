import { Metadata } from 'next';
import { BreadcrumbSchema, LocalBusinessSchema } from '@/components/StructuredData';
import { HomeNewsTeaser } from '../HomeMediaTeasers';
import ShantiSarovarRaipurClient from '../ShantiSarovarRaipurClient';
import { getSrpGallery, getSrpHeroSlides, getSrpServices } from '../logo-data';
import { getSrpNews } from '../news-data';
import {
  SRP_CANONICAL,
  SRP_CENTER,
  SRP_CONTENT,
  SRP_OG_IMAGES,
  SRP_RETREAT_NAME,
  SRP_SEO,
} from '../content';

export const revalidate = 14400;

const { title, description, keywords, ogAlt } = SRP_SEO.home;
const ogImage = SRP_OG_IMAGES.home;

export function generateMetadata(): Metadata {
  return {
    title,
    description,
    keywords: [...keywords],
    robots: { index: true, follow: true },
    alternates: { canonical: SRP_CANONICAL },
    openGraph: {
      title,
      description,
      type: 'website',
      url: SRP_CANONICAL,
      siteName: 'Brahma Kumaris Centers',
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1280, height: 720, alt: ogAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ShantiSarovarRaipurHomePage() {
  const [news, heroSlides, services, gallery] = await Promise.all([
    getSrpNews(),
    getSrpHeroSlides(),
    getSrpServices(),
    getSrpGallery(),
  ]);

  return (
    <>
      <LocalBusinessSchema
        center={SRP_CENTER}
        pageUrl={SRP_CANONICAL}
        description={SRP_CONTENT.about.paragraphs[0]}
        image={ogImage}
        omitOpeningHours
      />
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          { name: 'Retreat Centers', url: 'https://www.brahmakumaris.com/centers/retreat' },
          { name: SRP_RETREAT_NAME, url: SRP_CANONICAL },
        ]}
      />
      <ShantiSarovarRaipurClient
        heroSlides={heroSlides}
        services={services}
        gallery={gallery}
        newsTeaser={<HomeNewsTeaser news={news.latest} />}
      />
    </>
  );
}
