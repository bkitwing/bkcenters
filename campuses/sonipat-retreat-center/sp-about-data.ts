/**
 * Sonipat Retreat Center about — Strapi website-section #74
 * Galleries named like the page: SRC journey, Esteemed faculty, Our campus.
 *
 * https://webapp.brahmakumaris.com/admin/content-manager/collection-types/api::website-section.website-section/74
 */

import { cache } from 'react';

export const SP_ABOUT_SECTION_ID = 74;
const ISR = 86400;

const IS_PROD = process.env.NODE_ENV === 'production';
const STRAPI_URL =
  process.env.STRAPI_BASE_URL ||
  (IS_PROD ? 'https://portal.brahmakumaris.com/api' : 'https://webapp.brahmakumaris.com/api');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

export type SpAboutImage = {
  id: string;
  src: string;
  alt: string;
  label: string;
  width?: number;
  height?: number;
};

export type SpAboutPageData = {
  journeyImage: SpAboutImage | null;
  facultyImage: SpAboutImage | null;
  spaceImages: Record<string, SpAboutImage>;
};

type ImageFormats = {
  thumbnail?: { url: string };
  Thumbnail?: { url: string };
  microHD?: { url: string };
  miniHD?: { url: string };
  HD?: { url: string };
  FullHD?: { url: string };
};

/** Filename titles on "Our campus" → existing space anchors. */
const SPACE_IDS: Record<string, string> = {
  auditorium: 'auditorium',
  '3d-theatre': 'theatre',
  theatre: 'theatre',
  'history-hall': 'history',
  history: 'history',
  'serenity-cells': 'serenity-cells',
  'training-centre': 'training',
  'training-center': 'training',
  'tapasya-dham': 'tapasya',
  'tapasya-dhaam': 'tapasya',
  'yogic-farming-and-lawns': 'farming',
  museum: 'museum',
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
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function titleFromName(name: string): string {
  let n = name.replace(/\.[a-z0-9]+$/i, '');
  n = n.replace(/[-_]+/g, ' ');
  n = n.replace(/\s+/g, ' ').trim();
  return n.replace(/\b\w/g, (c) => c.toUpperCase());
}

function pickUrl(formats: ImageFormats | null | undefined, fallback: string): string {
  if (!formats) return fallback;
  for (const key of ['HD', 'FullHD', 'miniHD', 'microHD'] as const) {
    const u = formats[key]?.url;
    if (u) return u;
  }
  return fallback;
}

function mediaList(gallery: unknown): unknown[] {
  if (Array.isArray(gallery)) return gallery;
  if (gallery && typeof gallery === 'object' && Array.isArray((gallery as { data?: unknown }).data)) {
    return (gallery as { data: unknown[] }).data;
  }
  return [];
}

function mapImage(raw: unknown, index: number): SpAboutImage | null {
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
    typeof attrs.id === 'number' || typeof attrs.id === 'string' ? String(attrs.id) : `about-${index}`;
  return {
    id,
    src: pickUrl(formats, url),
    alt,
    label,
    width: typeof attrs.width === 'number' ? attrs.width : undefined,
    height: typeof attrs.height === 'number' ? attrs.height : undefined,
  };
}

function findGallery(components: unknown[], titleMatch: RegExp): unknown[] {
  for (const raw of components) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;
    if (c.__component !== 'wisdom.post-gallery') continue;
    const title = typeof c.gallery_title === 'string' ? c.gallery_title.trim() : '';
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
      next: { revalidate: ISR, tags: ['sp-about'] },
    } as RequestInit);
    if (!res.ok) {
      console.error(`Sonipat about API ${res.status} for ${path}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('Sonipat about fetch failed:', err);
    return null;
  }
}

const EMPTY: SpAboutPageData = {
  journeyImage: null,
  facultyImage: null,
  spaceImages: {},
};

export const getSpAbout = cache(async (): Promise<SpAboutPageData> => {
  const populate = [
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][0]=url',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][1]=formats',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][2]=alternativeText',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][3]=caption',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][4]=name',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][5]=width',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][6]=height',
  ].join('&');

  const json = (await strapiGet(`website-sections/${SP_ABOUT_SECTION_ID}?${populate}`)) as {
    data?: unknown;
  } | null;
  if (!json?.data) return EMPTY;

  const attrs = unwrap(json.data);
  const sectionType = Array.isArray(attrs.section_type) ? attrs.section_type : [];

  const journeyImage =
    findGallery(sectionType, /^src journey$/i)
      .map((m, i) => mapImage(m, i))
      .find((img): img is SpAboutImage => Boolean(img)) ?? null;

  const facultyImage =
    findGallery(sectionType, /esteemed faculty/i)
      .map((m, i) => mapImage(m, i))
      .find((img): img is SpAboutImage => Boolean(img)) ?? null;

  const spaceImages: Record<string, SpAboutImage> = {};
  findGallery(sectionType, /^our campus$/i).forEach((raw, i) => {
    const image = mapImage(raw, i);
    if (!image) return;
    const id = SPACE_IDS[slugify(image.label)];
    if (id && !spaceImages[id]) spaceImages[id] = image;
  });

  return { journeyImage, facultyImage, spaceImages };
});
