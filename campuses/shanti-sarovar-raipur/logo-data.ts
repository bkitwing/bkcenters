/**
 * Shanti Sarovar Raipur — Strapi website-section #80.
 * logo | Hero Section (web carousel) | About Section | Courses offered Section | Photo Gallery Section
 *
 * https://webapp.brahmakumaris.com/admin/content-manager/collection-types/api::website-section.website-section/80
 */

import { cache } from 'react';
import { SRP_CONTENT } from './content';

export const SRP_SECTION_ID = 80;
const ISR = 14400;

const IS_PROD = process.env.NODE_ENV === 'production';
const STRAPI_URL =
  process.env.STRAPI_BASE_URL ||
  (IS_PROD ? 'https://portal.brahmakumaris.com/api' : 'https://webapp.brahmakumaris.com/api');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

export type SrpLogo = {
  src: string;
  alt: string;
};

/** Web hero slide from the "Hero Section" gallery. */
export type SrpHeroSlide = {
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

/** Card from the "Courses offered Section" gallery. */
export type SrpService = {
  id: string;
  title: string;
  blurb: string;
  src: string;
  alt: string;
};

/** Home "Campus in pictures" card from the "Photo Gallery Section" gallery. */
export type SrpGalleryThumb = {
  id: string;
  title: string;
  src: string;
  alt: string;
};

type SrpSection = {
  logo: SrpLogo | null;
  heroSlides: SrpHeroSlide[];
  services: SrpService[];
  gallery: SrpGalleryThumb[];
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

function imageUrl(raw: unknown): SrpLogo | null {
  const attrs = unwrap(raw);
  const url = typeof attrs.url === 'string' ? attrs.url : '';
  if (!url) return null;
  const alt =
    (typeof attrs.alternativeText === 'string' && attrs.alternativeText) ||
    (typeof attrs.caption === 'string' && attrs.caption) ||
    'Shanti Sarovar, Raipur';
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
function mapHeroSlide(raw: unknown, index: number): SrpHeroSlide | null {
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
      : `srp-hero-${index}`;
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

function mapService(raw: unknown, index: number): SrpService | null {
  const attrs = unwrap(raw);
  const url = typeof attrs.url === 'string' ? attrs.url : '';
  if (!url) return null;
  const formats = (attrs.formats as ImageFormats) || null;
  const name = typeof attrs.name === 'string' ? attrs.name : '';
  const fromFile = titleFromName(name) || `Service ${index + 1}`;
  const id = slugify(fromFile) || `service-${index}`;
  const labeled =
    SRP_CONTENT.services.labels[id as keyof typeof SRP_CONTENT.services.labels];
  const title = labeled?.title || fromFile;
  const blurb = labeled?.blurb || '';
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
  const withoutBrand = titled.replace(/^shanti sarovar(?: raipur)?\s*(?:[–—-]\s*)?/i, '').trim();
  return withoutBrand || titled;
}

function mapGalleryThumb(raw: unknown, index: number): SrpGalleryThumb | null {
  const attrs = unwrap(raw);
  const url = typeof attrs.url === 'string' ? attrs.url : '';
  if (!url) return null;
  const formats = (attrs.formats as ImageFormats) || null;
  const name = typeof attrs.name === 'string' ? attrs.name : '';
  const title = galleryTitle(name) || `Photograph ${index + 1}`;
  const id =
    typeof attrs.id === 'number' || typeof attrs.id === 'string'
      ? String(attrs.id)
      : `srp-gallery-${index}`;
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
function findLogo(components: unknown[]): SrpLogo | null {
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
            next: { revalidate: ISR, tags: ['srp-section'] },
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
      console.error(`Shanti Sarovar Raipur section API ${res.status} for ${path}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('Shanti Sarovar Raipur section fetch failed:', err);
    return null;
  }
}

const EMPTY_SECTION: SrpSection = {
  logo: null,
  heroSlides: [],
  services: [],
  gallery: [],
};

/** One fetch of the campus website-section, shared by the header logo and the home hero. */
const getSrpSection = cache(async (): Promise<SrpSection> => {
  if (SRP_SECTION_ID == null) return EMPTY_SECTION;
  const populate = [
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][0]=url',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][1]=formats',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][2]=alternativeText',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][3]=caption',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][4]=name',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][5]=width',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][6]=height',
  ].join('&');

  const json = (await strapiGet(`website-sections/${SRP_SECTION_ID}?${populate}`)) as {
    data?: unknown;
  } | null;

  if (!json?.data) return EMPTY_SECTION;
  const attrs = unwrap(json.data);
  const sectionType = Array.isArray(attrs.section_type) ? attrs.section_type : [];

  const heroSlides = findGallery(sectionType, /^hero section$/i)
    .map((file, index) => mapHeroSlide(file, index))
    .filter((slide): slide is SrpHeroSlide => Boolean(slide));

  const services = findGallery(sectionType, /^courses offered section$/i)
    .map((file, index) => mapService(file, index))
    .filter((service): service is SrpService => Boolean(service));

  const gallery = findGallery(sectionType, /^photo gallery section$/i)
    .map((file, index) => mapGalleryThumb(file, index))
    .filter((thumb): thumb is SrpGalleryThumb => Boolean(thumb));

  return { logo: findLogo(sectionType), heroSlides, services, gallery };
});

export const getSrpLogo = cache(async (): Promise<SrpLogo | null> => {
  const section = await getSrpSection();
  return section.logo;
});

/** Desktop / web carousel from the component titled "Hero Section". */
export const getSrpHeroSlides = cache(async (): Promise<SrpHeroSlide[]> => {
  const section = await getSrpSection();
  return section.heroSlides;
});

/** Cards from the component titled "Courses offered Section". */
export const getSrpServices = cache(async (): Promise<SrpService[]> => {
  const section = await getSrpSection();
  return section.services;
});

/** Campus pictures from the component titled "Photo Gallery Section". */
export const getSrpGallery = cache(async (): Promise<SrpGalleryThumb[]> => {
  const section = await getSrpSection();
  return section.gallery;
});
