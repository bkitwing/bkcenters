/**
 * Shanti Sarovar Raipur galleries — Strapi website-section (id pending).
 * Each `wisdom.post-gallery` component becomes one album.
 *
 * Until SRP_GALLERY_SECTION_ID is set, the page shows placeholder albums
 * named after the photo collections on the source page.
 */

import { cache } from 'react';
import { SRP_CONTENT, SRP_GALLERY_TITLES } from './content';
import { srpPlaceholderSrc } from './placeholder';

export const SRP_GALLERY_SECTION_ID: number | null = null;
const ISR = 86400;

const IS_PROD = process.env.NODE_ENV === 'production';
const STRAPI_URL =
  process.env.STRAPI_BASE_URL ||
  (IS_PROD ? 'https://portal.brahmakumaris.com/api' : 'https://webapp.brahmakumaris.com/api');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

export type SrpGalleryImage = {
  id: string;
  src: string;
  thumbSrc: string;
  alt: string;
  width?: number;
  height?: number;
};

export type SrpGalleryAlbum = {
  id: string;
  title: string;
  items: SrpGalleryImage[];
};

export type SrpGalleryGroup = {
  id: string;
  heading: string;
  subheading: string;
  albums: SrpGalleryAlbum[];
};

export type SrpGalleriesPageData = {
  sectionTitle: string;
  groups: SrpGalleryGroup[];
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

function unwrap(item: unknown): Record<string, unknown> {
  if (!item || typeof item !== 'object') return {};
  const record = item as Record<string, unknown>;
  if (record.attributes && typeof record.attributes === 'object') {
    return { id: record.id, ...(record.attributes as Record<string, unknown>) };
  }
  return record;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function mediaList(gallery: unknown): unknown[] {
  if (Array.isArray(gallery)) return gallery;
  if (gallery && typeof gallery === 'object' && Array.isArray((gallery as { data?: unknown }).data)) {
    return (gallery as { data: unknown[] }).data;
  }
  return [];
}

function pickUrl(formats: ImageFormats | null | undefined, fallback: string, thumb = false): string {
  if (!formats) return fallback;
  const order = thumb
    ? (['miniHD', 'microHD', 'HD', 'thumbnail', 'Thumbnail'] as const)
    : (['HD', 'FullHD', 'miniHD', 'microHD'] as const);
  for (const key of order) {
    const url = formats[key]?.url;
    if (url) return url;
  }
  return fallback;
}

function altFromName(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strapi titles the album "Celebration"; the page section is Celebrations. */
function albumTitle(raw: string): string {
  const title = raw.trim();
  if (/^celebrations?$/i.test(title)) return 'Celebrations';
  return title;
}

function mapImage(raw: unknown, albumId: string, index: number): SrpGalleryImage | null {
  const attrs = unwrap(raw);
  const url = typeof attrs.url === 'string' ? attrs.url : '';
  if (!url) return null;
  const formats = (attrs.formats as ImageFormats) || null;
  const name = typeof attrs.name === 'string' ? attrs.name : '';
  const alt =
    (typeof attrs.alternativeText === 'string' && attrs.alternativeText) ||
    (typeof attrs.caption === 'string' && attrs.caption) ||
    (name ? altFromName(name) : 'Shanti Sarovar photograph');
  const id =
    typeof attrs.id === 'number' || typeof attrs.id === 'string'
      ? String(attrs.id)
      : `${albumId}-${index}`;
  return {
    id,
    src: pickUrl(formats, url, false),
    thumbSrc: pickUrl(formats, url, true),
    alt,
    width: typeof attrs.width === 'number' ? attrs.width : undefined,
    height: typeof attrs.height === 'number' ? attrs.height : undefined,
  };
}

function albumsFromSection(components: unknown[]): SrpGalleryAlbum[] {
  const albums: SrpGalleryAlbum[] = [];
  const used = new Set<string>();

  for (const raw of components) {
    if (!raw || typeof raw !== 'object') continue;
    const component = raw as Record<string, unknown>;
    if (component.__component !== 'wisdom.post-gallery') continue;
    const rawTitle = typeof component.gallery_title === 'string' ? component.gallery_title : '';
    const title = albumTitle(rawTitle) || `Album ${albums.length + 1}`;
    let id = slugify(title) || `album-${albums.length + 1}`;
    if (used.has(id)) id = `${id}-${albums.length + 1}`;
    used.add(id);
    const items = mediaList(component.gallery)
      .map((file, index) => mapImage(file, id, index))
      .filter((image): image is SrpGalleryImage => Boolean(image));
    if (items.length === 0) continue;
    albums.push({ id, title, items });
  }

  return albums;
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
            next: { revalidate: ISR, tags: ['srp-galleries'] },
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
      console.error(`Shanti Sarovar Raipur gallery API ${res.status} for ${path}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('Shanti Sarovar Raipur gallery fetch failed:', err);
    return null;
  }
}

const GROUP_HEADING = 'Campus in pictures';
const GROUP_SUBHEADING = SRP_CONTENT.gallery.intro;

const EMPTY: SrpGalleriesPageData = {
  sectionTitle: 'Gallery',
  groups: [],
  totalImages: 0,
  heroImage: null,
};

/** Placeholder albums — three labelled tiles per collection on the source page. */
function placeholderGalleries(): SrpGalleriesPageData {
  const albums: SrpGalleryAlbum[] = SRP_GALLERY_TITLES.map((title, ai) => {
    const id = slugify(title) || `album-${ai + 1}`;
    return {
      id,
      title,
      items: [0, 1, 2].map((n) => {
        const src = srpPlaceholderSrc(title, { tone: ai + n });
        return {
          id: `${id}-${n + 1}`,
          src,
          thumbSrc: src,
          alt: `${title} — photograph ${n + 1} (placeholder)`,
          width: 1200,
          height: 900,
        };
      }),
    };
  });
  return {
    sectionTitle: 'Gallery',
    groups: [
      { id: 'campus-life', heading: GROUP_HEADING, subheading: GROUP_SUBHEADING, albums },
    ],
    totalImages: albums.reduce((sum, album) => sum + album.items.length, 0),
    heroImage: null,
  };
}

export const getSrpGalleries = cache(async (): Promise<SrpGalleriesPageData> => {
  if (SRP_GALLERY_SECTION_ID == null) return placeholderGalleries();

  const populate = [
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][0]=url',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][1]=formats',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][2]=alternativeText',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][3]=caption',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][4]=name',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][5]=width',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][6]=height',
  ].join('&');

  const json = (await strapiGet(`website-sections/${SRP_GALLERY_SECTION_ID}?${populate}`)) as {
    data?: unknown;
  } | null;

  if (!json?.data) return EMPTY;

  const attrs = unwrap(json.data);
  const sectionType = Array.isArray(attrs.section_type) ? attrs.section_type : [];
  const albums = albumsFromSection(sectionType);
  if (albums.length === 0) return EMPTY;

  const totalImages = albums.reduce((sum, album) => sum + album.items.length, 0);

  return {
    sectionTitle: 'Gallery',
    groups: [
      {
        id: 'campus-life',
        heading: GROUP_HEADING,
        subheading: GROUP_SUBHEADING,
        albums,
      },
    ],
    totalImages,
    heroImage: albums[0]?.items[0]?.src ?? null,
  };
});
