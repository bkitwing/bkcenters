/**
 * Shanti Shikhar — Strapi website-section #76.
 * logo | Hero Section (web carousel) | About Section | Services offered Section | Photo Gallery Section
 *
 * https://webapp.brahmakumaris.com/admin/content-manager/collection-types/api::website-section.website-section/76
 */

import { cache } from 'react';
import { SHK_CONTENT } from './content';

export const SHK_SECTION_ID = 76;
const ISR = 14400;

const IS_PROD = process.env.NODE_ENV === 'production';
const STRAPI_URL =
  process.env.STRAPI_BASE_URL ||
  (IS_PROD ? 'https://portal.brahmakumaris.com/api' : 'https://webapp.brahmakumaris.com/api');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

export type ShkLogo = {
  src: string;
  alt: string;
};

/** Web hero slide from the "Hero Section" gallery. */
export type ShkHeroSlide = {
  id: string;
  src: string;
  thumbSrc: string;
  srcMobile?: string;
  srcDesktop?: string;
  alt: string;
  label: string;
  width?: number;
  height?: number;
};

type ImageFormats = {
  thumbnail?: { url: string };
  Thumbnail?: { url: string };
  microHD?: { url: string };
  miniHD?: { url: string };
  HD?: { url: string };
  FullHD?: { url: string };
};

/** Card from the "Services offered Section" gallery. */
export type ShkService = {
  id: string;
  title: string;
  blurb: string;
  src: string;
  alt: string;
};

/** Home "Campus in pictures" card from the "Photo Gallery Section" gallery. */
export type ShkGalleryThumb = {
  id: string;
  title: string;
  src: string;
  alt: string;
};

type ShkSection = {
  logo: ShkLogo | null;
  heroSlides: ShkHeroSlide[];
  aboutImage: ShkHeroSlide | null;
  services: ShkService[];
  gallery: ShkGalleryThumb[];
};

function unwrap(item: unknown): Record<string, unknown> {
  if (!item || typeof item !== 'object') return {};
  const record = item as Record<string, unknown>;
  if (record.attributes && typeof record.attributes === 'object') {
    return { id: record.id, ...(record.attributes as Record<string, unknown>) };
  }
  return record;
}

function mediaList(gallery: unknown): unknown[] {
  if (Array.isArray(gallery)) return gallery;
  if (gallery && typeof gallery === 'object' && Array.isArray((gallery as { data?: unknown }).data)) {
    return (gallery as { data: unknown[] }).data;
  }
  return [];
}

function imageUrl(raw: unknown): ShkLogo | null {
  const attrs = unwrap(raw);
  const url = typeof attrs.url === 'string' ? attrs.url : '';
  if (!url) return null;
  const alt =
    (typeof attrs.alternativeText === 'string' && attrs.alternativeText) ||
    (typeof attrs.caption === 'string' && attrs.caption) ||
    'Shanti Shikhar';
  return { src: url, alt };
}

function formatUrl(formats: ImageFormats | null | undefined, key: keyof ImageFormats): string | null {
  const url = formats?.[key]?.url;
  return url || null;
}

function titleFromName(name: string): string {
  const cleaned = name
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\d{3,4}\s*[x×]\s*\d{3,4}\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function pickThumb(formats: ImageFormats | null | undefined, fallback: string): string {
  if (!formats) return fallback;
  const order = ['miniHD', 'microHD', 'HD', 'thumbnail', 'Thumbnail'] as const;
  for (const key of order) {
    const url = formats[key]?.url;
    if (url) return url;
  }
  return fallback;
}

/** Web hero keeps a large format so the full-bleed carousel stays sharp. */
function mapHeroSlide(raw: unknown, index: number): ShkHeroSlide | null {
  const attrs = unwrap(raw);
  const url = typeof attrs.url === 'string' ? attrs.url : '';
  if (!url) return null;
  const formats = (attrs.formats as ImageFormats) || null;
  const name = typeof attrs.name === 'string' ? attrs.name : '';
  const label = titleFromName(name) || `Photograph ${index + 1}`;
  const alt =
    (typeof attrs.alternativeText === 'string' && attrs.alternativeText) ||
    (typeof attrs.caption === 'string' && attrs.caption) ||
    label;
  const id =
    typeof attrs.id === 'number' || typeof attrs.id === 'string'
      ? String(attrs.id)
      : `shk-hero-${index}`;
  const desktop =
    formatUrl(formats, 'FullHD') || formatUrl(formats, 'HD') || formatUrl(formats, 'miniHD') || url;
  const mobile =
    formatUrl(formats, 'miniHD') || formatUrl(formats, 'microHD') || formatUrl(formats, 'HD') || url;
  return {
    id,
    src: desktop,
    srcDesktop: desktop,
    srcMobile: mobile,
    thumbSrc: mobile,
    alt,
    label,
    width: typeof attrs.width === 'number' ? attrs.width : undefined,
    height: typeof attrs.height === 'number' ? attrs.height : undefined,
  };
}

function mapService(raw: unknown, index: number): ShkService | null {
  const attrs = unwrap(raw);
  const url = typeof attrs.url === 'string' ? attrs.url : '';
  if (!url) return null;
  const formats = (attrs.formats as ImageFormats) || null;
  const name = typeof attrs.name === 'string' ? attrs.name : '';
  const fromFile = titleFromName(name) || `Service ${index + 1}`;
  const id = slugify(fromFile) || `service-${index}`;
  const labeled =
    SHK_CONTENT.services.labels[id as keyof typeof SHK_CONTENT.services.labels];
  const title = labeled?.title || fromFile;
  const blurb = labeled?.blurb || 'Offered as service at Shanti Shikhar.';
  return {
    id,
    title,
    blurb,
    src: pickThumb(formats, url),
    alt: title,
  };
}

function galleryTitle(name: string): string {
  const titled = titleFromName(name);
  const withoutBrand = titled.replace(/^shanti shikhar\s*(?:[–—-]\s*)?/i, '').trim();
  return withoutBrand || titled;
}

function mapGalleryThumb(raw: unknown, index: number): ShkGalleryThumb | null {
  const attrs = unwrap(raw);
  const url = typeof attrs.url === 'string' ? attrs.url : '';
  if (!url) return null;
  const formats = (attrs.formats as ImageFormats) || null;
  const name = typeof attrs.name === 'string' ? attrs.name : '';
  const title = galleryTitle(name) || `Photograph ${index + 1}`;
  const id =
    typeof attrs.id === 'number' || typeof attrs.id === 'string'
      ? String(attrs.id)
      : `shk-gallery-${index}`;
  const alt =
    (typeof attrs.alternativeText === 'string' && attrs.alternativeText) ||
    (typeof attrs.caption === 'string' && attrs.caption) ||
    title;
  return {
    id,
    title,
    src: pickThumb(formats, url),
    alt,
  };
}

function findGallery(components: unknown[], titleMatch: RegExp): unknown[] {
  for (const raw of components) {
    if (!raw || typeof raw !== 'object') continue;
    const component = raw as Record<string, unknown>;
    if (component.__component !== 'wisdom.post-gallery') continue;
    const title = typeof component.gallery_title === 'string' ? component.gallery_title.trim() : '';
    if (titleMatch.test(title)) return mediaList(component.gallery);
  }
  return [];
}

/** The dynamic-zone entry titled "logo" (wisdom.post-gallery). */
function findLogo(components: unknown[]): ShkLogo | null {
  for (const file of findGallery(components, /^logo$/i)) {
    const logo = imageUrl(file);
    if (logo) return logo;
  }
  return null;
}

async function strapiGet(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(
      `${STRAPI_URL}/${path}`,
      IS_PROD
        ? {
            headers: {
              Authorization: `Bearer ${STRAPI_TOKEN}`,
              'Content-Type': 'application/json',
            },
            next: { revalidate: ISR, tags: ['shk-section'] },
          }
        : {
            headers: {
              Authorization: `Bearer ${STRAPI_TOKEN}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          }
    );
    if (!res.ok) {
      console.error(`Shanti Shikhar section API ${res.status} for ${path}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('Shanti Shikhar section fetch failed:', err);
    return null;
  }
}

const EMPTY_SECTION: ShkSection = {
  logo: null,
  heroSlides: [],
  aboutImage: null,
  services: [],
  gallery: [],
};

/** One fetch of website-section 76, shared by the header logo and the home hero. */
const getShkSection = cache(async (): Promise<ShkSection> => {
  const populate = [
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][0]=url',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][1]=formats',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][2]=alternativeText',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][3]=caption',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][4]=name',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][5]=width',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][6]=height',
  ].join('&');

  const json = (await strapiGet(`website-sections/${SHK_SECTION_ID}?${populate}`)) as {
    data?: unknown;
  } | null;

  if (!json?.data) return EMPTY_SECTION;
  const attrs = unwrap(json.data);
  const sectionType = Array.isArray(attrs.section_type) ? attrs.section_type : [];

  const heroSlides = findGallery(sectionType, /^hero section$/i)
    .map((file, index) => mapHeroSlide(file, index))
    .filter((slide): slide is ShkHeroSlide => Boolean(slide));

  const aboutImage =
    findGallery(sectionType, /^about section$/i)
      .map((file, index) => mapHeroSlide(file, index))
      .filter((slide): slide is ShkHeroSlide => Boolean(slide))[0] ?? null;

  const services = findGallery(sectionType, /^services offered section$/i)
    .map((file, index) => mapService(file, index))
    .filter((service): service is ShkService => Boolean(service));

  const gallery = findGallery(sectionType, /^photo gallery section$/i)
    .map((file, index) => mapGalleryThumb(file, index))
    .filter((thumb): thumb is ShkGalleryThumb => Boolean(thumb));

  return { logo: findLogo(sectionType), heroSlides, aboutImage, services, gallery };
});

export const getShkLogo = cache(async (): Promise<ShkLogo | null> => {
  const section = await getShkSection();
  return section.logo;
});

/** Portrait beside the home story, from the component titled "About Section". */
export const getShkAboutImage = cache(async (): Promise<ShkHeroSlide | null> => {
  const section = await getShkSection();
  return section.aboutImage;
});

/** Desktop / web carousel from the component titled "Hero Section". */
export const getShkHeroSlides = cache(async (): Promise<ShkHeroSlide[]> => {
  const section = await getShkSection();
  return section.heroSlides;
});

/** Cards from the component titled "Services offered Section". */
export const getShkServices = cache(async (): Promise<ShkService[]> => {
  const section = await getShkSection();
  return section.services;
});

/** Campus pictures from the component titled "Photo Gallery Section". */
export const getShkGallery = cache(async (): Promise<ShkGalleryThumb[]> => {
  const section = await getShkSection();
  return section.gallery;
});
