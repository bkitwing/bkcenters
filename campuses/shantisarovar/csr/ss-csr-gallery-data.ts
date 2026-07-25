/**
 * Shanti Sarovar CSR cinema gallery — Strapi website-section #65
 * https://webapp.brahmakumaris.com/admin/content-manager/collection-types/api::website-section.website-section/65
 */

import { cache } from 'react';
import type { SsHomeImage } from '../ss-home-data';

export const SS_CSR_GALLERY_SECTION_ID = 65;
const ISR = 86400;

const IS_PROD = process.env.NODE_ENV === 'production';
const STRAPI_URL =
  process.env.STRAPI_BASE_URL ||
  (IS_PROD ? 'https://portal.brahmakumaris.com/api' : 'https://webapp.brahmakumaris.com/api');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

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

function formatUrl(
  formats: ImageFormats | null | undefined,
  key: keyof ImageFormats
): string | null {
  return formats?.[key]?.url || null;
}

function leadingIndex(name: string): number {
  const m = name.match(/^(\d+)/);
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
}

function mediaList(gallery: unknown): unknown[] {
  if (Array.isArray(gallery)) return gallery;
  if (
    gallery &&
    typeof gallery === 'object' &&
    Array.isArray((gallery as { data?: unknown }).data)
  ) {
    return (gallery as { data: unknown[] }).data;
  }
  return [];
}

function mapSlide(raw: unknown, index: number): SsHomeImage | null {
  const attrs = unwrap(raw);
  const url = typeof attrs.url === 'string' ? attrs.url : '';
  if (!url) return null;
  const formats = (attrs.formats as ImageFormats) || null;
  const name = typeof attrs.name === 'string' ? attrs.name : '';
  const label =
    name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() ||
    `Photograph ${index + 1}`;
  const alt =
    (typeof attrs.alternativeText === 'string' && attrs.alternativeText) ||
    (typeof attrs.caption === 'string' && attrs.caption) ||
    label;
  const id =
    typeof attrs.id === 'number' || typeof attrs.id === 'string'
      ? String(attrs.id)
      : `ss-csr-slide-${index}`;

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

export const getSsCsrGallery = cache(async (): Promise<SsHomeImage[]> => {
  const populate = [
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][0]=url',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][1]=formats',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][2]=alternativeText',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][3]=caption',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][4]=name',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][5]=width',
    'populate[section_type][on][wisdom.post-gallery][populate][gallery][fields][6]=height',
  ].join('&');

  try {
    const res = await fetch(
      `${STRAPI_URL}/website-sections/${SS_CSR_GALLERY_SECTION_ID}?${populate}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: ISR, tags: ['ss-csr-gallery'] },
      } as RequestInit
    );
    if (!res.ok) {
      console.error(`SS CSR gallery API ${res.status}`);
      return [];
    }
    const json = (await res.json()) as { data?: unknown };
    if (!json?.data) return [];

    const attrs = unwrap(json.data);
    const sectionType = Array.isArray(attrs.section_type) ? attrs.section_type : [];
    const media: { raw: unknown; name: string }[] = [];

    for (const raw of sectionType) {
      if (!raw || typeof raw !== 'object') continue;
      const c = raw as Record<string, unknown>;
      if (c.__component !== 'wisdom.post-gallery') continue;
      for (const item of mediaList(c.gallery)) {
        const a = unwrap(item);
        media.push({
          raw: item,
          name: typeof a.name === 'string' ? a.name : '',
        });
      }
    }

    media.sort((a, b) => leadingIndex(a.name) - leadingIndex(b.name));
    return media
      .map((m, i) => mapSlide(m.raw, i))
      .filter((img): img is SsHomeImage => Boolean(img));
  } catch (err) {
    console.error('SS CSR gallery fetch failed:', err);
    return [];
  }
});
