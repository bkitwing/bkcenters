/**
 * Sonipat Retreat Center galleries — Strapi website-section #73
 * Album titles match the page: Campus, Workshops, Trainings & Retreats,
 * With Seniors, Health & Environment, Celebration, and the later collections.
 *
 * https://webapp.brahmakumaris.com/admin/content-manager/collection-types/api::website-section.website-section/73
 */

import { cache } from 'react';

export const SP_GALLERY_SECTION_ID = 73;
const ISR = 86400;

const IS_PROD = process.env.NODE_ENV === 'production';
const STRAPI_URL =
  process.env.STRAPI_BASE_URL ||
  (IS_PROD ? 'https://portal.brahmakumaris.com/api' : 'https://webapp.brahmakumaris.com/api');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

export type SpGalleryImage = {
  id: string;
  src: string;
  thumbSrc: string;
  alt: string;
  width?: number;
  height?: number;
};

export type SpGalleryAlbum = {
  id: string;
  title: string;
  items: SpGalleryImage[];
};

export type SpGalleryGroup = {
  id: string;
  heading: string;
  subheading: string;
  albums: SpGalleryAlbum[];
};

export type SpGalleriesPageData = {
  sectionTitle: string;
  groups: SpGalleryGroup[];
  totalImages: number;
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

const DEFAULT_GROUP: SpGalleryGroup = {
  id: 'serving-people',
  heading: 'Serving People, Blissful Memories',
  subheading:
    'Campus life, retreats, celebrations, moments with seniors, and service at Sonipat Retreat Center.',
  albums: [],
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
    .slice(0, 64);
}

function richTextParts(blocks: unknown): { heading: string; body: string } {
  if (!Array.isArray(blocks)) {
    return { heading: '', body: typeof blocks === 'string' ? blocks : '' };
  }
  let heading = '';
  const bodyParts: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const b = block as { type?: string; children?: unknown[] };
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
  return { heading, body: bodyParts.join(' ').replace(/\s+/g, ' ').trim() };
}

function pickUrl(formats: ImageFormats | null | undefined, fallback: string, thumb = false): string {
  if (!formats) return fallback;
  const order = thumb
    ? (['microHD', 'miniHD', 'thumbnail', 'Thumbnail', 'HD'] as const)
    : (['HD', 'FullHD', 'miniHD', 'microHD'] as const);
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

function mapImage(raw: unknown, albumId: string, index: number): SpGalleryImage | null {
  const attrs = unwrap(raw);
  const url = typeof attrs.url === 'string' ? attrs.url : '';
  if (!url) return null;
  const formats = (attrs.formats as ImageFormats) || null;
  const name = typeof attrs.name === 'string' ? attrs.name : '';
  const altText =
    (typeof attrs.alternativeText === 'string' && attrs.alternativeText) ||
    (typeof attrs.caption === 'string' && attrs.caption) ||
    (name ? altFromName(name) : 'Sonipat Retreat Center photograph');
  const id =
    typeof attrs.id === 'number' || typeof attrs.id === 'string'
      ? String(attrs.id)
      : `${albumId}-${index}`;
  return {
    id,
    src: pickUrl(formats, url, false),
    thumbSrc: pickUrl(formats, url, true),
    alt: altText,
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

function parseSectionType(components: unknown[]): SpGalleryGroup[] {
  const groups: SpGalleryGroup[] = [];
  let current: SpGalleryGroup | null = null;

  for (const raw of components) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;
    const comp = typeof c.__component === 'string' ? c.__component : '';

    if (comp === 'wisdom.description') {
      const { heading, body } = richTextParts(c.description);
      if (!heading && !body) continue;
      current = {
        id: slugify(heading || `group-${groups.length + 1}`),
        heading: heading || 'Gallery',
        subheading: body,
        albums: [],
      };
      groups.push(current);
      continue;
    }

    if (comp !== 'wisdom.post-gallery') continue;

    if (!current) {
      current = { ...DEFAULT_GROUP, albums: [] };
      groups.push(current);
    }

    const title =
      typeof c.gallery_title === 'string' && c.gallery_title.trim()
        ? c.gallery_title.trim()
        : `Album ${current.albums.length + 1}`;
    let albumId = slugify(title) || `album-${current.albums.length + 1}`;
    const used = new Set(groups.flatMap((g) => g.albums.map((a) => a.id)));
    if (used.has(albumId)) albumId = `${current.id}-${albumId}`;
    const items = mediaList(c.gallery)
      .map((m, i) => mapImage(m, albumId, i))
      .filter((img): img is SpGalleryImage => Boolean(img));
    if (items.length === 0) continue;
    current.albums.push({ id: albumId, title, items });
  }

  return groups.filter((g) => g.albums.length > 0);
}

async function strapiGet(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${STRAPI_URL}/${path}`, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: ISR, tags: ['sp-galleries'] },
    } as RequestInit);
    if (!res.ok) {
      console.error(`Sonipat gallery API ${res.status} for ${path}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('Sonipat gallery fetch failed:', err);
    return null;
  }
}

const EMPTY: SpGalleriesPageData = {
  sectionTitle: 'Sonipat Retreat Center',
  groups: [],
  totalImages: 0,
  heroImage: null,
};

export const getSpGalleries = cache(async (): Promise<SpGalleriesPageData> => {
  const populate = [
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
    `website-sections/${SP_GALLERY_SECTION_ID}?${populate}`
  )) as { data?: unknown } | null;

  if (!json?.data) return EMPTY;

  const attrs = unwrap(json.data);
  const sectionTitle =
    typeof attrs.title === 'string' && attrs.title ? attrs.title : EMPTY.sectionTitle;
  const sectionType = Array.isArray(attrs.section_type) ? attrs.section_type : [];
  const groups = parseSectionType(sectionType);
  const totalImages = groups.reduce(
    (n, g) => n + g.albums.reduce((m, a) => m + a.items.length, 0),
    0
  );
  const heroImage = groups[0]?.albums[0]?.items[0]?.src ?? null;

  return { sectionTitle, groups, totalImages, heroImage };
});
