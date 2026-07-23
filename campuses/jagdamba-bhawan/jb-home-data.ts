/**
 * Jagdamba Bhawan home — Strapi website-section #62
 * Galleries: About Section | Hero Mobile | Hero Section | Courses offered | Photo Gallery
 *
 * https://portal.brahmakumaris.com/admin/content-manager/collection-types/api::website-section.website-section/62
 */

import { cache } from 'react';
import { JB_CONTENT, type CourseItem, type MediaSlot } from './content';

export const JB_HOME_SECTION_ID = 62;
const ISR = 14400;

const IS_PROD = process.env.NODE_ENV === 'production';
const STRAPI_URL =
  process.env.STRAPI_BASE_URL ||
  (IS_PROD ? 'https://portal.brahmakumaris.com/api' : 'https://webapp.brahmakumaris.com/api');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

export type JbHomeImage = {
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

export type JbHomeCourse = CourseItem & {
  image: JbHomeImage;
};

export type JbHomeGalleryThumb = MediaSlot & {
  href?: string;
  image: JbHomeImage;
};

export type JbHomePageData = {
  /** Desktop / tablet hero (Strapi "Hero Section"). */
  heroSlides: JbHomeImage[];
  /** Phone hero (Strapi "Hero Mobile"); falls back to heroSlides when empty. */
  heroSlidesMobile: JbHomeImage[];
  /** About section featured image (Strapi "About Section"). */
  aboutImage: JbHomeImage | null;
  courses: JbHomeCourse[];
  galleryThumbs: JbHomeGalleryThumb[];
  heroImage: string | null;
  /** YouTube embed URL from wisdom.post-video (full-viewport band). */
  videoEmbedUrl: string | null;
  /** Closing tribute (Dadi Janki image from last wisdom.description). */
  tribute: {
    imageSrc: string;
    imageAlt: string;
    eyebrow: string;
    title: string;
    body: string;
  } | null;
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
  JB_CONTENT.courses.items.map((c) => [slugify(c.title), c.blurb])
);

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
  n = n.replace(/^jagdamba bhawan\s+/i, '').trim();
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
function mapHeroImage(raw: unknown, index: number): JbHomeImage | null {
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

function mapImage(raw: unknown, index: number): JbHomeImage | null {
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
      next: { revalidate: ISR, tags: ['jb-home'] },
    } as RequestInit);
    if (!res.ok) {
      console.error(`JB home API ${res.status} for ${path}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('JB home fetch failed:', err);
    return null;
  }
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

/** Last description block that is primarily an image (Dadi Janki tribute). */
function findTribute(
  components: unknown[]
): JbHomePageData['tribute'] {
  for (let i = components.length - 1; i >= 0; i--) {
    const raw = components[i];
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;
    if (c.__component !== 'wisdom.description') continue;
    const blocks = Array.isArray(c.description) ? c.description : [];
    for (const block of blocks) {
      if (!block || typeof block !== 'object') continue;
      const b = block as { type?: string; image?: Record<string, unknown> };
      if (b.type !== 'image' || !b.image) continue;
      const img = unwrap(b.image);
      const url = typeof img.url === 'string' ? img.url : '';
      if (!url) continue;
      // Prefer original upload URL so tribute shows full-resolution artwork
      const name = typeof img.name === 'string' ? img.name : '';
      const alt =
        (typeof img.alternativeText === 'string' && img.alternativeText) ||
        titleFromName(name) ||
        'Dadi Janki';
      return {
        imageSrc: url,
        imageAlt: alt,
        eyebrow: 'In loving remembrance',
        title: 'Dadi Janki',
        body: 'Jagdamba Bhawan was inaugurated on 28 January 2018 by Dadi Janki, former Administrative Head of the Brahma Kumaris — whose wisdom and quiet strength continue to light this campus of peace in Pune.',
      };
    }
  }
  return null;
}

const EMPTY: JbHomePageData = {
  heroSlides: [],
  heroSlidesMobile: [],
  aboutImage: null,
  courses: [],
  galleryThumbs: [],
  heroImage: null,
  videoEmbedUrl: null,
  tribute: null,
};

export const getJbHome = cache(async (): Promise<JbHomePageData> => {
  const populate = [
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][0]=url',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][1]=formats',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][2]=alternativeText',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][3]=caption',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][4]=name',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][5]=width',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][6]=height',
    'populate[section_type][on][wisdom.post-video][fields][0]=videolink',
    'populate[section_type][on][wisdom.description][populate]=*',
  ].join('&');

  const json = (await strapiGet(
    `website-sections/${JB_HOME_SECTION_ID}?${populate}`
  )) as { data?: unknown } | null;

  if (!json?.data) return EMPTY;

  const attrs = unwrap(json.data);
  const sectionType = Array.isArray(attrs.section_type) ? attrs.section_type : [];

  // Desktop/tablet: "Hero Section" (exclude "Hero Mobile")
  const heroSlides = findGallery(sectionType, /hero/i, { exclude: /mobile/i })
    .map((m, i) => mapHeroImage(m, i))
    .filter((img): img is JbHomeImage => Boolean(img));

  // Phones: dedicated "Hero Mobile" gallery from the same website-section
  const heroSlidesMobile = findGallery(sectionType, /hero\s*mobile|mobile\s*hero/i)
    .map((m, i) => mapHeroImage(m, i))
    .filter((img): img is JbHomeImage => Boolean(img));

  // About visual: "About Section" (single featured image)
  const aboutImage =
    findGallery(sectionType, /about/i)
      .map((m, i) => mapHeroImage(m, i))
      .filter((img): img is JbHomeImage => Boolean(img))[0] ?? null;

  const courseImages = findGallery(sectionType, /course/i)
    .map((m, i) => mapImage(m, i))
    .filter((img): img is JbHomeImage => Boolean(img));

  const courses: JbHomeCourse[] = courseImages.map((image, i) => {
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
    .filter((img): img is JbHomeImage => Boolean(img));

  const galleryThumbs: JbHomeGalleryThumb[] = galleryImages.map((image, i) => {
    return {
      id: image.id || `g-${i}`,
      src: image.thumbSrc || image.src,
      alt: image.alt,
      label: image.label,
      href: '/jagdamba-bhawan/galleries',
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
    videoEmbedUrl: findVideoEmbed(sectionType),
    tribute: findTribute(sectionType),
  };
});
