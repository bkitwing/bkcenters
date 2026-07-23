/**
 * Jagdamba Bhawan About — Strapi website-section #63
 * Dynamic zone: wisdom.ctavideo (hero) + wisdom.cta (story) +
 * wisdom.description / post-gallery (campus tour, incl. Our Campus image).
 *
 * https://webapp.brahmakumaris.com/admin/content-manager/collection-types/api::website-section.website-section/63
 */

import { cache } from 'react';

export const JB_ABOUT_SECTION_ID = 63;
const ISR = 86400;

const IS_PROD = process.env.NODE_ENV === 'production';
const STRAPI_URL =
  process.env.STRAPI_BASE_URL ||
  (IS_PROD ? 'https://portal.brahmakumaris.com/api' : 'https://webapp.brahmakumaris.com/api');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

export type JbAboutImage = {
  id: string;
  src: string;
  thumbSrc: string;
  alt: string;
  width?: number;
  height?: number;
};

export type JbAboutChapter = {
  id: string;
  title: string;
  body: string;
  image: JbAboutImage | null;
};

export type JbAboutHero = {
  title: string;
  body: string;
  /** YouTube watch/embed URL from wisdom.ctavideo */
  videoUrl: string | null;
  image: JbAboutImage | null;
};

export type JbAboutSpace = {
  id: string;
  title: string;
  body: string;
  images: JbAboutImage[];
};

export type JbAboutPageData = {
  sectionTitle: string;
  hero: JbAboutHero | null;
  chapters: JbAboutChapter[];
  campusIntro: { title: string; body: string; image: JbAboutImage | null } | null;
  spaces: JbAboutSpace[];
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
    .slice(0, 64);
}

function pickUrl(
  formats: ImageFormats | null | undefined,
  fallback: string,
  thumb = false
): string {
  if (!formats) return fallback;
  const order = thumb
    ? (['miniHD', 'microHD', 'HD', 'thumbnail', 'Thumbnail'] as const)
    : (['FullHD', 'HD', 'miniHD', 'microHD'] as const);
  for (const key of order) {
    const u = formats[key]?.url;
    if (u) return u;
  }
  return fallback;
}

function altFromName(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapImage(raw: unknown, prefix: string, index: number): JbAboutImage | null {
  const attrs = unwrap(raw);
  const url = typeof attrs.url === 'string' ? attrs.url : '';
  if (!url) return null;
  const formats = (attrs.formats as ImageFormats) || null;
  const name = typeof attrs.name === 'string' ? attrs.name : '';
  const alt =
    (typeof attrs.alternativeText === 'string' && attrs.alternativeText) ||
    altFromName(name) ||
    `Photograph ${index + 1}`;
  const id =
    typeof attrs.id === 'number' || typeof attrs.id === 'string'
      ? String(attrs.id)
      : `${prefix}-${index}`;
  return {
    id,
    src: pickUrl(formats, url, false),
    thumbSrc: pickUrl(formats, url, true),
    alt,
    width: typeof attrs.width === 'number' ? attrs.width : undefined,
    height: typeof attrs.height === 'number' ? attrs.height : undefined,
  };
}

function richTextBody(blocks: unknown): string {
  if (!Array.isArray(blocks)) {
    return typeof blocks === 'string' ? blocks : '';
  }
  const parts: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const b = block as { type?: string; children?: unknown[] };
    if (b.type === 'image') continue;
    const text = (b.children || [])
      .map((c) =>
        c && typeof c === 'object' && typeof (c as { text?: unknown }).text === 'string'
          ? (c as { text: string }).text
          : ''
      )
      .join('')
      .trim();
    if (text) parts.push(text);
  }
  return parts.join('\n\n').replace(/[ \t]+\n/g, '\n').trim();
}

function richTextParts(blocks: unknown): {
  heading: string;
  body: string;
  image: JbAboutImage | null;
} {
  if (!Array.isArray(blocks)) {
    return {
      heading: '',
      body: typeof blocks === 'string' ? blocks : '',
      image: null,
    };
  }
  let heading = '';
  const bodyParts: string[] = [];
  let image: JbAboutImage | null = null;
  let imgIndex = 0;
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const b = block as { type?: string; children?: unknown[]; image?: unknown };
    if (b.type === 'image' && b.image && !image) {
      image = mapImage(b.image, 'desc', imgIndex++);
      continue;
    }
    const text = (b.children || [])
      .map((c) =>
        c && typeof c === 'object' && typeof (c as { text?: unknown }).text === 'string'
          ? (c as { text: string }).text
          : ''
      )
      .join('')
      .trim();
    if (!text) continue;
    if (b.type === 'heading' && !heading) heading = text;
    else bodyParts.push(text);
  }
  return { heading, body: bodyParts.join('\n\n').trim(), image };
}

function toEmbedUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = u.pathname.split('/').filter(Boolean);
      const embedIdx = parts.indexOf('embed');
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function mapCtaImage(raw: unknown): JbAboutImage | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as { data?: unknown };
  const node = o.data !== undefined ? o.data : raw;
  return mapImage(node, 'cta', 0);
}

function mediaList(gallery: unknown): unknown[] {
  if (Array.isArray(gallery)) return gallery;
  if (gallery && typeof gallery === 'object' && Array.isArray((gallery as { data?: unknown }).data)) {
    return (gallery as { data: unknown[] }).data;
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
      next: { revalidate: ISR, tags: ['jb-about'] },
    } as RequestInit);
    if (!res.ok) {
      console.error(`JB about API ${res.status} for ${path}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('JB about fetch failed:', err);
    return null;
  }
}

const EMPTY: JbAboutPageData = {
  sectionTitle: 'About Jagdamba Bhawan',
  hero: null,
  chapters: [],
  campusIntro: null,
  spaces: [],
  heroImage: null,
};

function parseSection(sectionType: unknown[]): JbAboutPageData {
  let hero: JbAboutHero | null = null;
  const chapters: JbAboutChapter[] = [];
  let campusIntro: JbAboutPageData['campusIntro'] = null;
  const spaces: JbAboutSpace[] = [];
  let pendingSpace: { title: string; body: string } | null = null;

  for (const raw of sectionType) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;
    const comp = typeof c.__component === 'string' ? c.__component : '';

    if (comp === 'wisdom.ctavideo') {
      const title = typeof c.heading === 'string' ? c.heading.trim() : '';
      const body = richTextBody(c.para);
      const videoRaw = typeof c.video === 'string' ? c.video : '';
      if (!hero) {
        hero = {
          title: title || 'About Jagdamba Bhawan',
          body,
          videoUrl: toEmbedUrl(videoRaw),
          image: mapCtaImage(c.image),
        };
      }
      continue;
    }

    if (comp === 'wisdom.cta') {
      const title = typeof c.heading === 'string' ? c.heading.trim() : '';
      const body = richTextBody(c.para);
      if (!title && !body) continue;
      // Legacy: first CTA becomes hero only if ctavideo missing
      if (!hero) {
        hero = {
          title: title || 'About',
          body,
          videoUrl: null,
          image: mapCtaImage(c.image),
        };
      } else {
        chapters.push({
          id: slugify(title) || `chapter-${chapters.length + 1}`,
          title: title || 'About',
          body,
          image: mapCtaImage(c.image),
        });
      }
      continue;
    }

    if (comp === 'wisdom.description') {
      const { heading, body, image } = richTextParts(c.description);
      const title = heading || `Space ${spaces.length + 1}`;
      if (/our\s*campus/i.test(title) && !campusIntro) {
        campusIntro = { title, body, image };
        pendingSpace = null;
        continue;
      }
      pendingSpace = { title, body };
      continue;
    }

    if (comp === 'wisdom.post-gallery') {
      const galleryTitle =
        typeof c.gallery_title === 'string' && c.gallery_title.trim()
          ? c.gallery_title.trim()
          : pendingSpace?.title || `Gallery ${spaces.length + 1}`;
      const title = pendingSpace?.title || galleryTitle;
      const body = pendingSpace?.body || '';
      const items = mediaList(c.gallery)
        .map((m, i) => mapImage(m, slugify(title), i))
        .filter((img): img is JbAboutImage => Boolean(img));
      pendingSpace = null;
      if (items.length === 0 && !body) continue;
      spaces.push({
        id: slugify(title) || `space-${spaces.length + 1}`,
        title,
        body,
        images: items,
      });
    }
  }

  if (pendingSpace) {
    if (!campusIntro) campusIntro = { ...pendingSpace, image: null };
    else {
      spaces.push({
        id: slugify(pendingSpace.title) || `space-${spaces.length + 1}`,
        title: pendingSpace.title,
        body: pendingSpace.body,
        images: [],
      });
    }
  }

  const heroImage =
    hero?.image?.src ||
    campusIntro?.image?.src ||
    chapters.find((c) => c.image)?.image?.src ||
    spaces[0]?.images[0]?.src ||
    null;

  return {
    sectionTitle: hero?.title || EMPTY.sectionTitle,
    hero,
    chapters,
    campusIntro,
    spaces,
    heroImage,
  };
}

export const getJbAbout = cache(async (): Promise<JbAboutPageData> => {
  const populate = [
    'populate[section_type][on][wisdom.ctavideo][populate][image][fields][0]=url',
    'populate[section_type][on][wisdom.ctavideo][populate][image][fields][1]=formats',
    'populate[section_type][on][wisdom.ctavideo][populate][image][fields][2]=alternativeText',
    'populate[section_type][on][wisdom.ctavideo][populate][image][fields][3]=name',
    'populate[section_type][on][wisdom.ctavideo][populate][image][fields][4]=width',
    'populate[section_type][on][wisdom.ctavideo][populate][image][fields][5]=height',
    'populate[section_type][on][wisdom.ctavideo][populate][para]=*',
    'populate[section_type][on][wisdom.cta][populate][image][fields][0]=url',
    'populate[section_type][on][wisdom.cta][populate][image][fields][1]=formats',
    'populate[section_type][on][wisdom.cta][populate][image][fields][2]=alternativeText',
    'populate[section_type][on][wisdom.cta][populate][image][fields][3]=caption',
    'populate[section_type][on][wisdom.cta][populate][image][fields][4]=name',
    'populate[section_type][on][wisdom.cta][populate][image][fields][5]=width',
    'populate[section_type][on][wisdom.cta][populate][image][fields][6]=height',
    'populate[section_type][on][wisdom.cta][populate][para]=*',
    'populate[section_type][on][wisdom.description][populate]=*',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][0]=url',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][1]=formats',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][2]=alternativeText',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][3]=caption',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][4]=name',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][5]=width',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][6]=height',
  ].join('&');

  const json = (await strapiGet(
    `website-sections/${JB_ABOUT_SECTION_ID}?${populate}`
  )) as { data?: unknown } | null;

  if (!json?.data) return EMPTY;

  const attrs = unwrap(json.data);
  const sectionType = Array.isArray(attrs.section_type) ? attrs.section_type : [];
  const parsed = parseSection(sectionType);
  const sectionTitle =
    (typeof attrs.title === 'string' && attrs.title) ||
    (typeof attrs.name === 'string' && attrs.name) ||
    parsed.sectionTitle;

  return { ...parsed, sectionTitle };
});
