/**
 * Jagdamba Bhawan home testimonials — Strapi website-section #64
 * Dynamic zone: wisdom.description (intro) + wisdom.post-video[] (any count).
 * Add/reorder/replace videos in Strapi — no code change required.
 *
 * https://webapp.brahmakumaris.com/admin/content-manager/collection-types/api::website-section.website-section/64
 */

import { cache } from 'react';

export const JB_TESTIMONIALS_SECTION_ID = 64;
export const JB_TESTIMONIALS_MORE_HREF =
  'https://www.brahmakumaris.com/wisdom/testimonials';

const ISR = 14400;

const IS_PROD = process.env.NODE_ENV === 'production';
const STRAPI_URL =
  process.env.STRAPI_BASE_URL ||
  (IS_PROD ? 'https://portal.brahmakumaris.com/api' : 'https://webapp.brahmakumaris.com/api');
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

export type JbTestimonialVideo = {
  id: string;
  /** YouTube video id */
  videoId: string;
  /** Embed URL for iframe */
  embedUrl: string;
  /** Watch / shorts URL from CMS */
  watchUrl: string;
  thumbSrc: string;
};

export type JbTestimonialsData = {
  title: string;
  body: string;
  videos: JbTestimonialVideo[];
  moreHref: string;
};

function unwrap(item: unknown): Record<string, unknown> {
  if (!item || typeof item !== 'object') return {};
  const o = item as Record<string, unknown>;
  if (o.attributes && typeof o.attributes === 'object') {
    return { id: o.id, ...(o.attributes as Record<string, unknown>) };
  }
  return o;
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
    if (b.type === 'image') continue;
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
  return { heading, body: bodyParts.join('\n\n').trim() };
}

/** Extract YouTube id from watch / shorts / embed / youtu.be URLs. */
export function youtubeVideoId(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id || null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      for (const key of ['embed', 'shorts', 'live', 'v']) {
        const idx = parts.indexOf(key);
        if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

function toEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
}

async function strapiGet(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${STRAPI_URL}/${path}`, {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: ISR, tags: ['jb-testimonials'] },
    } as RequestInit);
    if (!res.ok) {
      console.error(`JB testimonials API ${res.status} for ${path}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('JB testimonials fetch failed:', err);
    return null;
  }
}

const EMPTY: JbTestimonialsData = {
  title: 'What people say',
  body: '',
  videos: [],
  moreHref: JB_TESTIMONIALS_MORE_HREF,
};

export const getJbTestimonials = cache(async (): Promise<JbTestimonialsData> => {
  const populate = [
    'populate[section_type][on][wisdom.description][populate]=*',
    'populate[section_type][on][wisdom.post-video][fields][0]=videolink',
  ].join('&');

  const json = (await strapiGet(
    `website-sections/${JB_TESTIMONIALS_SECTION_ID}?${populate}`
  )) as { data?: unknown } | null;

  if (!json?.data) return EMPTY;

  const attrs = unwrap(json.data);
  const sectionType = Array.isArray(attrs.section_type) ? attrs.section_type : [];

  let title = EMPTY.title;
  let body = '';
  const videos: JbTestimonialVideo[] = [];

  for (const raw of sectionType) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;
    const comp = typeof c.__component === 'string' ? c.__component : '';

    if (comp === 'wisdom.description') {
      const parts = richTextParts(c.description);
      if (parts.heading) title = parts.heading;
      if (parts.body) body = parts.body;
      continue;
    }

    if (comp === 'wisdom.post-video') {
      const watchUrl = typeof c.videolink === 'string' ? c.videolink.trim() : '';
      const videoId = youtubeVideoId(watchUrl);
      if (!videoId) continue;
      const id =
        typeof c.id === 'number' || typeof c.id === 'string'
          ? String(c.id)
          : `vid-${videos.length + 1}`;
      videos.push({
        id,
        videoId,
        embedUrl: toEmbedUrl(videoId),
        watchUrl,
        thumbSrc: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      });
    }
  }

  const sectionTitle =
    (typeof attrs.title === 'string' && attrs.title) ||
    (typeof attrs.name === 'string' && attrs.name) ||
    '';

  return {
    title: title || sectionTitle || EMPTY.title,
    body,
    videos,
    moreHref: JB_TESTIMONIALS_MORE_HREF,
  };
});
