/**
 * Sonipat Retreat Center home — Strapi website-section #72
 * logo | Hero Mobile | Hero Section | About Section | Courses offered Section
 * | Photo Gallery Section | video
 *
 * https://webapp.brahmakumaris.com/admin/content-manager/collection-types/api::website-section.website-section/72
 */

import { cache } from 'react';
import { SP_CONTENT, type CourseItem, type MediaSlot } from './content';

export const SP_HOME_SECTION_ID = 72;
const ISR = 14400;

const IS_PROD = process.env.NODE_ENV === 'production';
const STRAPI_URL =
  process.env.STRAPI_BASE_URL ||
  (IS_PROD ? 'https://portal.brahmakumaris.com/api' : 'https://webapp.brahmakumaris.com/api');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

export type SpHomeImage = {
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

export type SpHomeCourse = CourseItem & {
  image: SpHomeImage;
};

export type SpHomeGalleryThumb = MediaSlot & {
  href?: string;
  image: SpHomeImage;
};

export type SpHomePageData = {
  heroSlides: SpHomeImage[];
  heroSlidesMobile: SpHomeImage[];
  aboutImage: SpHomeImage | null;
  courses: SpHomeCourse[];
  galleryThumbs: SpHomeGalleryThumb[];
  heroImage: string | null;
  /** Header mark from the "logo" gallery. */
  logo: SpHomeImage | null;
  /** Full-viewport band from wisdom.post-video. */
  videoEmbedUrl: string | null;
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
  SP_CONTENT.courses.items.map((c) => [slugify(c.title), c.blurb])
);

/** Strapi filenames that shorten a local course title. */
const COURSE_BLURB_ALIASES: Record<string, string> = {
  'harmony-in-relations': 'harmony-in-relationships',
};

const GALLERY_HASH: Record<string, string> = {
  campus: 'campus',
  workshops: 'workshops',
  'conference-workshops': 'workshops',
  'conference-and-workshops': 'workshops',
  'trainings-retreats': 'trainings-retreats',
  'trainings-and-retreats': 'trainings-retreats',
  'with-seniors': 'with-seniors',
  'health-environment': 'health-environment',
  'health-and-environment': 'health-environment',
  celebration: 'celebration',
  'art-culture': 'art-culture',
  'art-and-culture': 'art-culture',
  nation: 'serving-the-nation',
  'serving-the-nation': 'serving-the-nation',
  enviornement: 'serving-the-nature',
  environment: 'serving-the-nature',
  'serving-the-nature': 'serving-the-nature',
  'with-eminent-personalities': 'with-eminent-personalities',
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
  return n.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatUrl(formats: ImageFormats | null | undefined, key: keyof ImageFormats): string | null {
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

function mapHeroImage(raw: unknown, index: number): SpHomeImage | null {
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

function mapImage(raw: unknown, index: number): SpHomeImage | null {
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
    typeof attrs.id === 'number' || typeof attrs.id === 'string' ? String(attrs.id) : `home-${index}`;
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

/** Logo keeps the original upload so the mark stays sharp and transparent. */
function mapLogo(raw: unknown): SpHomeImage | null {
  const image = mapHeroImage(raw, 0);
  if (!image) return null;
  const attrs = unwrap(raw);
  const url = typeof attrs.url === 'string' ? attrs.url : image.src;
  return {
    ...image,
    src: url,
    srcDesktop: url,
    thumbSrc: url,
    alt: image.alt || 'Sonipat Retreat Center',
    label: 'Sonipat Retreat Center',
  };
}

function mediaList(gallery: unknown): unknown[] {
  if (Array.isArray(gallery)) return gallery;
  if (gallery && typeof gallery === 'object' && Array.isArray((gallery as { data?: unknown }).data)) {
    return (gallery as { data: unknown[] }).data;
  }
  return [];
}

function findGallery(components: unknown[], titleMatch: RegExp, options?: { exclude?: RegExp }): unknown[] {
  for (const raw of components) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;
    if (c.__component !== 'wisdom.post-gallery') continue;
    const title = typeof c.gallery_title === 'string' ? c.gallery_title.trim() : '';
    if (options?.exclude?.test(title)) continue;
    if (titleMatch.test(title)) return mediaList(c.gallery);
  }
  return [];
}

function youtubeEmbedUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
      const parts = u.pathname.split('/').filter(Boolean);
      const embedIdx = parts.indexOf('embed');
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}?rel=0`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function findVideoEmbed(components: unknown[]): string | null {
  for (const raw of components) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;
    if (c.__component !== 'wisdom.post-video') continue;
    const link = typeof c.videolink === 'string' ? c.videolink : '';
    const embed = youtubeEmbedUrl(link);
    if (embed) return embed;
  }
  return null;
}

async function strapiGet(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${STRAPI_URL}/${path}`, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: ISR, tags: ['sp-home'] },
    } as RequestInit);
    if (!res.ok) {
      console.error(`Sonipat home API ${res.status} for ${path}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('Sonipat home fetch failed:', err);
    return null;
  }
}

const EMPTY: SpHomePageData = {
  heroSlides: [],
  heroSlidesMobile: [],
  aboutImage: null,
  courses: [],
  galleryThumbs: [],
  heroImage: null,
  logo: null,
  videoEmbedUrl: null,
};

export const getSpHome = cache(async (): Promise<SpHomePageData> => {
  const populate = [
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][0]=url',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][1]=formats',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][2]=alternativeText',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][3]=caption',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][4]=name',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][5]=width',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][6]=height',
    'populate[section_type][on][wisdom.post-video][fields][0]=videolink',
  ].join('&');

  const json = (await strapiGet(`website-sections/${SP_HOME_SECTION_ID}?${populate}`)) as {
    data?: unknown;
  } | null;

  if (!json?.data) return EMPTY;

  const attrs = unwrap(json.data);
  const sectionType = Array.isArray(attrs.section_type) ? attrs.section_type : [];

  const heroSlides = findGallery(sectionType, /hero/i, { exclude: /mobile/i })
    .map((m, i) => mapHeroImage(m, i))
    .filter((img): img is SpHomeImage => Boolean(img));

  const heroSlidesMobile = findGallery(sectionType, /hero\s*mobile|mobile\s*hero/i)
    .map((m, i) => mapHeroImage(m, i))
    .filter((img): img is SpHomeImage => Boolean(img));

  const aboutImage =
    findGallery(sectionType, /about/i)
      .map((m, i) => mapHeroImage(m, i))
      .filter((img): img is SpHomeImage => Boolean(img))[0] ?? null;

  const logo =
    findGallery(sectionType, /^logo$/i)
      .map((m) => mapLogo(m))
      .filter((img): img is SpHomeImage => Boolean(img))[0] ?? null;

  const courseImages = findGallery(sectionType, /courses offered/i)
    .map((m, i) => mapImage(m, i))
    .filter((img): img is SpHomeImage => Boolean(img));

  const courses: SpHomeCourse[] = courseImages.map((image, i) => {
    const title = image.label;
    const id = slugify(title) || `course-${i}`;
    return {
      id,
      title,
      blurb:
        COURSE_BLURBS[id] ||
        COURSE_BLURBS[COURSE_BLURB_ALIASES[id] || ''] ||
        'A course for everyday life — offered as service.',
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
    .filter((img): img is SpHomeImage => Boolean(img));

  const galleryThumbs: SpHomeGalleryThumb[] = galleryImages.map((image, i) => {
    const hash = GALLERY_HASH[slugify(image.label)];
    return {
      id: image.id || `g-${i}`,
      src: image.thumbSrc || image.src,
      alt: image.alt,
      label: image.label,
      href: hash ? `/sonipat-retreat-center/galleries#${hash}` : '/sonipat-retreat-center/galleries',
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
    logo,
    videoEmbedUrl: findVideoEmbed(sectionType),
  };
});
