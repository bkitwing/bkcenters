/**
 * Shanti Sarovar home — Strapi website-section #60
 * Galleries: About Section | Hero Mobile | Hero Section | Courses offered | Photo Gallery
 *
 * https://portal.brahmakumaris.com/admin/content-manager/collection-types/api::website-section.website-section/60
 */

import { cache } from 'react';
import { SS_CONTENT, type CourseItem, type MediaSlot } from './content';

export const SS_HOME_SECTION_ID = 60;
const ISR = 3600;

const IS_PROD = process.env.NODE_ENV === 'production';
const STRAPI_URL =
  process.env.STRAPI_BASE_URL ||
  (IS_PROD ? 'https://portal.brahmakumaris.com/api' : 'https://webapp.brahmakumaris.com/api');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

export type SsHomeImage = {
  id: string;
  /** Primary display URL (HD for hero, thumb for courses/gallery). */
  src: string;
  /** Lightweight stand-in (miniHD / microHD). */
  thumbSrc: string;
  /** Hero: miniHD for phones. */
  srcMobile?: string;
  /** Hero: HD for desktop / large screens. */
  srcDesktop?: string;
  alt: string;
  label: string;
  width?: number;
  height?: number;
};

export type SsHomeCourse = CourseItem & {
  image: SsHomeImage;
};

export type SsHomeGalleryThumb = MediaSlot & {
  href?: string;
  image: SsHomeImage;
};

export type SsHomePageData = {
  /** Desktop / tablet hero (Strapi "Hero Section"). */
  heroSlides: SsHomeImage[];
  /** Phone hero (Strapi "Hero Mobile"); falls back to heroSlides when empty. */
  heroSlidesMobile: SsHomeImage[];
  /** About section featured image (Strapi "About Section"). */
  aboutImage: SsHomeImage | null;
  courses: SsHomeCourse[];
  galleryThumbs: SsHomeGalleryThumb[];
  heroImage: string | null;
};

type ImageFormats = {
  thumbnail?: { url: string };
  Thumbnail?: { url: string };
  microHD?: { url: string };
  miniHD?: { url: string };
  HD?: { url: string };
  FullHD?: { url: string };
};

const COURSE_BLURBS: Record<string, string> = Object.fromEntries(
  SS_CONTENT.courses.items.map((c) => [slugify(c.title), c.blurb])
);

const GALLERY_HASH: Record<string, string> = {
  'with-seniors': 'with-seniors',
  'with-eminent-personalities': 'with-eminent-personalities',
  'conference-workshops': 'conference-and-workshops',
  nation: 'serving-the-nation',
  enviornement: 'serving-the-nature',
  environment: 'serving-the-nature',
  'art-culture': 'art-and-culture',
};

function unwrap(item: unknown): Record<string, unknown> {
  if (!item || typeof item !== 'object') return {};
  const o = item as Record<string, unknown>;
  if (o.attributes && typeof o.attributes === 'object') {
    return { id: o.id, ...(o.attributes as Record<string, unknown>) };
  }
  return o;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function titleFromName(name: string): string {
  let n = name.replace(/\.[a-z0-9]+$/i, '');
  n = n.replace(/[-_]+/g, ' ');
  n = n.replace(/\b\d{3,4}\s*[x×]\s*\d{3,4}\b/gi, '');
  n = n.replace(/\b\d{3,4}x\b/gi, '');
  n = n.replace(/\bresult\b/gi, '');
  n = n.replace(/^\d+\s+/, '');
  n = n.replace(/\s+/g, ' ').trim();
  n = n.replace(/^shanti sarovar\s+/i, '').trim();
  return n.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatUrl(
  formats: ImageFormats | null | undefined,
  key: keyof ImageFormats
): string | null {
  const u = formats?.[key]?.url;
  return u || null;
}

function pickUrl(formats: ImageFormats | null | undefined, fallback: string, thumb = false): string {
  if (!formats) return fallback;
  const order = thumb
    ? (['miniHD', 'microHD', 'HD', 'thumbnail', 'Thumbnail'] as const)
    : (['HD', 'FullHD', 'miniHD', 'microHD'] as const);
  for (const key of order) {
    const u = formats[key]?.url;
    if (u) return u;
  }
  return fallback;
}

/** Hero landing: FullHD on desktop, miniHD on mobile — fall back through HD → miniHD. */
function mapHeroImage(raw: unknown, index: number): SsHomeImage | null {
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
      : `home-hero-${index}`;

  const desktop =
    formatUrl(formats, 'FullHD') ||
    formatUrl(formats, 'HD') ||
    formatUrl(formats, 'miniHD') ||
    url;
  const mobile =
    formatUrl(formats, 'miniHD') ||
    formatUrl(formats, 'microHD') ||
    formatUrl(formats, 'HD') ||
    url;

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

function mapImage(raw: unknown, index: number): SsHomeImage | null {
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
      : `home-${index}`;
  return {
    id,
    src: pickUrl(formats, url, true),
    thumbSrc: pickUrl(formats, url, true),
    alt,
    label,
    width: typeof attrs.width === 'number' ? attrs.width : undefined,
    height: typeof attrs.height === 'number' ? attrs.height : undefined,
  };
}

function mediaList(gallery: unknown): unknown[] {
  if (Array.isArray(gallery)) return gallery;
  if (gallery && typeof gallery === 'object' && Array.isArray((gallery as { data?: unknown }).data)) {
    return (gallery as { data: unknown[] }).data;
  }
  return [];
}

function findGallery(
  components: unknown[],
  titleMatch: RegExp,
  options?: { exclude?: RegExp }
): unknown[] {
  for (const raw of components) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;
    if (c.__component !== 'wisdom.post-gallery') continue;
    const title = typeof c.gallery_title === 'string' ? c.gallery_title : '';
    if (options?.exclude?.test(title)) continue;
    if (titleMatch.test(title)) return mediaList(c.gallery);
  }
  return [];
}

async function strapiGet(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${STRAPI_URL}/${path}`, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: ISR, tags: ['ss-home'] },
    } as RequestInit);
    if (!res.ok) {
      console.error(`SS home API ${res.status} for ${path}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('SS home fetch failed:', err);
    return null;
  }
}

const EMPTY: SsHomePageData = {
  heroSlides: [],
  heroSlidesMobile: [],
  aboutImage: null,
  courses: [],
  galleryThumbs: [],
  heroImage: null,
};

export const getSsHome = cache(async (): Promise<SsHomePageData> => {
  const populate = [
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][0]=url',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][1]=formats',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][2]=alternativeText',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][3]=caption',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][4]=name',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][5]=width',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][6]=height',
  ].join('&');

  const json = (await strapiGet(
    `website-sections/${SS_HOME_SECTION_ID}?${populate}`
  )) as { data?: unknown } | null;

  if (!json?.data) return EMPTY;

  const attrs = unwrap(json.data);
  const sectionType = Array.isArray(attrs.section_type) ? attrs.section_type : [];

  // Desktop/tablet: "Hero Section" (exclude "Hero Mobile")
  const heroSlides = findGallery(sectionType, /hero/i, { exclude: /mobile/i })
    .map((m, i) => mapHeroImage(m, i))
    .filter((img): img is SsHomeImage => Boolean(img));

  // Phones: dedicated "Hero Mobile" gallery from the same website-section
  const heroSlidesMobile = findGallery(sectionType, /hero\s*mobile|mobile\s*hero/i)
    .map((m, i) => mapHeroImage(m, i))
    .filter((img): img is SsHomeImage => Boolean(img));

  // About visual: "About Section" (single featured image)
  const aboutImage =
    findGallery(sectionType, /about/i)
      .map((m, i) => mapHeroImage(m, i))
      .filter((img): img is SsHomeImage => Boolean(img))[0] ?? null;

  const courseImages = findGallery(sectionType, /course/i)
    .map((m, i) => mapImage(m, i))
    .filter((img): img is SsHomeImage => Boolean(img));

  const courses: SsHomeCourse[] = courseImages.map((image, i) => {
    const title = image.label;
    const id = slugify(title) || `course-${i}`;
    return {
      id,
      title,
      blurb: COURSE_BLURBS[id] || 'Values and meditation for everyday life — free to all.',
      media: {
        id: image.id,
        src: image.thumbSrc || image.src,
        alt: image.alt,
        label: title,
      },
      image,
    };
  });

  const galleryImages = findGallery(sectionType, /photo\s*gallery/i)
    .map((m, i) => mapImage(m, i))
    .filter((img): img is SsHomeImage => Boolean(img));

  const galleryThumbs: SsHomeGalleryThumb[] = galleryImages.map((image, i) => {
    const key = slugify(image.label);
    const hash = GALLERY_HASH[key];
    return {
      id: image.id || `g-${i}`,
      src: image.thumbSrc || image.src,
      alt: image.alt,
      label: image.label,
      href: hash
        ? `/shantisarovar/galleries#${hash}`
        : '/shantisarovar/galleries',
      image,
    };
  });

  return {
    heroSlides,
    heroSlidesMobile,
    aboutImage,
    courses,
    galleryThumbs,
    heroImage: heroSlides[0]?.srcDesktop || heroSlides[0]?.src || null,
  };
});
