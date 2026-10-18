/**
 * Shanti Shikhar news — portal Strapi.
 * News tag 204 = Nava Raipur-Shanti Shikhar
 *
 * https://webapp.brahmakumaris.com/admin/content-manager/collection-types/api::news-tag.news-tag/204
 */

import { cache } from 'react';
import type { NewsPost, NewsPostImage } from '@/lib/types';

export const SHK_NEWS_TAG_ID = 204;
export const NEWS_POST_BASE = 'https://www.brahmakumaris.com/news/post';

const PORTAL = 'https://portal.brahmakumaris.com/api';
const ISR = 14400;
const NEWS_PAGE_SIZE = 100;

export type ShkNewsTag = {
  id: number;
  name: string;
  href: string;
};

export type ShkNewsPost = NewsPost & {
  dateLabel: string;
  imageUrl: string;
  imageThumbUrl: string;
  imageAlt: string;
  hasVideo: boolean;
  href: string;
  tags: ShkNewsTag[];
};

export type ShkNewsCategory = {
  id: string;
  label: string;
  posts: ShkNewsPost[];
};

export type ShkNewsPageData = {
  tagName: string;
  tagHref: string;
  total: number;
  posts: ShkNewsPost[];
  latest: ShkNewsPost[];
  categories: ShkNewsCategory[];
  heroImage: string | null;
};

function unwrap(item: unknown): Record<string, unknown> {
  if (!item || typeof item !== 'object') return {};
  const o = item as Record<string, unknown>;
  if (o.attributes && typeof o.attributes === 'object') {
    return { id: o.id, ...(o.attributes as Record<string, unknown>) };
  }
  return o;
}

async function portalGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${PORTAL}${path}`, {
      next: { revalidate: ISR, tags: ['shk-media'] },
    });
    if (!res.ok) {
      console.error(`Shanti Shikhar news API ${res.status} for ${path}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error('Shanti Shikhar news fetch failed:', err);
    return null;
  }
}

function pickImageUrl(
  formats: NewsPostImage['formats'] | null | undefined,
  fallback: string,
  thumb = false
): string {
  if (!formats) return fallback;
  const order = thumb
    ? (['miniHD', 'microHD', 'thumbnail', 'Thumbnail', 'HD'] as const)
    : (['HD', 'FullHD', 'miniHD', 'microHD', 'thumbnail', 'Thumbnail'] as const);
  for (const key of order) {
    const u = formats[key]?.url;
    if (u) return u;
  }
  return fallback;
}

function asMedia(raw: unknown): NewsPostImage | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if ('data' in o) {
    const data = o.data;
    if (!data || typeof data !== 'object') return null;
    const attrs = unwrap(data);
    if (typeof attrs.url !== 'string') return null;
    return {
      url: attrs.url,
      alternativeText: typeof attrs.alternativeText === 'string' ? attrs.alternativeText : null,
      formats: (attrs.formats as NewsPostImage['formats']) ?? null,
    };
  }
  if (typeof o.url === 'string') {
    return {
      url: o.url,
      alternativeText: typeof o.alternativeText === 'string' ? o.alternativeText : null,
      formats: (o.formats as NewsPostImage['formats']) ?? null,
    };
  }
  return null;
}

function formatNewsDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function mapNewsTags(raw: unknown): ShkNewsTag[] {
  if (!Array.isArray(raw)) return [];
  const tags: ShkNewsTag[] = [];
  for (const item of raw) {
    const attrs = unwrap(item);
    const id = typeof attrs.id === 'number' ? attrs.id : Number(attrs.id);
    const name = typeof attrs.name === 'string' ? attrs.name : '';
    const href = typeof attrs.href === 'string' ? attrs.href : '';
    if (!id || !name || !href) continue;
    tags.push({ id, name, href });
  }
  return tags;
}

const GENERAL = { id: 'campus-stories', label: 'Campus stories' } as const;

function buildNewsCategories(posts: ShkNewsPost[]): ShkNewsCategory[] {
  const map = new Map<string, ShkNewsCategory>();
  for (const post of posts) {
    const topicTags = post.tags.filter((t) => t.id !== SHK_NEWS_TAG_ID);
    if (topicTags.length === 0) {
      const bucket = map.get(GENERAL.id) ?? { id: GENERAL.id, label: GENERAL.label, posts: [] };
      bucket.posts.push(post);
      map.set(bucket.id, bucket);
      continue;
    }
    for (const tag of topicTags) {
      const bucket = map.get(tag.href) ?? { id: tag.href, label: tag.name, posts: [] };
      if (!bucket.posts.some((p) => p.id === post.id)) bucket.posts.push(post);
      map.set(bucket.id, bucket);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.posts.length - a.posts.length || a.label.localeCompare(b.label)
  );
}

function mapNewsPost(raw: Record<string, unknown>): ShkNewsPost | null {
  const id = typeof raw.id === 'number' ? raw.id : Number(raw.id);
  const title = typeof raw.title === 'string' ? raw.title : '';
  const slug = typeof raw.slug === 'string' ? raw.slug : '';
  const date = typeof raw.date === 'string' ? raw.date : '';
  if (!id || !title || !slug) return null;
  const media = asMedia(raw.featuredImage);
  const url = media?.url ?? '';
  return {
    id,
    title,
    slug,
    date,
    Featured: Boolean(raw.Featured),
    featuredImage: media,
    dateLabel: formatNewsDate(date),
    imageUrl: url ? pickImageUrl(media?.formats, url) : '',
    imageThumbUrl: url ? pickImageUrl(media?.formats, url, true) : '',
    imageAlt: media?.alternativeText || title,
    hasVideo: typeof raw.VideoURL === 'string' && Boolean(raw.VideoURL),
    href: `${NEWS_POST_BASE}/${slug}`,
    tags: mapNewsTags(raw.post_tags),
  };
}

export const getShkNews = cache(async (): Promise<ShkNewsPageData> => {
  const empty: ShkNewsPageData = {
    tagName: 'Nava Raipur-Shanti Shikhar',
    tagHref: 'nava-raipur-shanti-shikhar',
    total: 0,
    posts: [],
    latest: [],
    categories: [],
    heroImage: null,
  };

  const [tagRes, postsRes] = await Promise.all([
    portalGet<{ data: unknown }>(`/news-tags/${SHK_NEWS_TAG_ID}`),
    portalGet<{ data: unknown[]; meta?: { pagination?: { total?: number } } }>(
      `/news-posts?` +
        [
          `filters[post_tags][id][$eq]=${SHK_NEWS_TAG_ID}`,
          `pagination[pageSize]=${NEWS_PAGE_SIZE}`,
          'fields[0]=title',
          'fields[1]=slug',
          'fields[2]=date',
          'fields[3]=Featured',
          'fields[4]=VideoURL',
          'populate[featuredImage][fields][0]=url',
          'populate[featuredImage][fields][1]=formats',
          'populate[featuredImage][fields][2]=alternativeText',
          'populate[post_tags][fields][0]=name',
          'populate[post_tags][fields][1]=href',
          'sort[0]=date:desc',
        ].join('&')
    ),
  ]);

  const tag = unwrap(tagRes?.data);
  const tagName = typeof tag.name === 'string' ? tag.name : empty.tagName;
  const tagHref = typeof tag.href === 'string' ? tag.href : empty.tagHref;

  const posts = (postsRes?.data || [])
    .map((item) => mapNewsPost(unwrap(item)))
    .filter((p): p is ShkNewsPost => Boolean(p));

  return {
    tagName,
    tagHref,
    total: postsRes?.meta?.pagination?.total ?? posts.length,
    posts,
    latest: posts.slice(0, 4),
    categories: buildNewsCategories(posts),
    heroImage: posts[0]?.imageUrl || null,
  };
});
