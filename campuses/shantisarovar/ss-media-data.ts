/**
 * Shanti Sarovar news + events — portal Strapi (public list endpoints).
 *
 * News tag 86 = Hyderabad-Shanti Sarovar
 * Event organizer 20 = Shanti Sarovar - Hyderabad
 *
 * Detail pages live on the news / events sites (slug suffix).
 */

import { cache } from 'react';
import type { EventPost, NewsPost, NewsPostImage } from '@/lib/types';

export const SS_NEWS_TAG_ID = 86;
export const SS_EVENT_ORGANIZER_ID = 20;

export const NEWS_POST_BASE = 'https://www.brahmakumaris.com/news/post';
export const EVENT_POST_BASE = 'https://www.brahmakumaris.com/events';

const PORTAL = 'https://portal.brahmakumaris.com/api';
const ISR = 14400;
const NEWS_PAGE_SIZE = 100;
export const EVENTS_SSR_PAGE_SIZE = 50;
export const EVENTS_INITIAL_PAGE_SIZE = EVENTS_SSR_PAGE_SIZE;

export type SsNewsTag = {
  id: number;
  name: string;
  href: string;
};

export type SsNewsPost = NewsPost & {
  dateLabel: string;
  imageUrl: string;
  imageThumbUrl: string;
  imageAlt: string;
  hasVideo: boolean;
  href: string;
  tags: SsNewsTag[];
};

export type SsNewsCategory = {
  id: string;
  label: string;
  posts: SsNewsPost[];
};

export type SsEventPost = EventPost & {
  dateLabel: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
  status: 'ongoing' | 'upcoming' | 'past';
};

export type SsNewsPageData = {
  tagName: string;
  tagHref: string;
  total: number;
  posts: SsNewsPost[];
  latest: SsNewsPost[];
  categories: SsNewsCategory[];
  heroImage: string | null;
};

export type SsEventsPageData = {
  organizerName: string;
  organizerSlug: string;
  description: string;
  total: number;
  events: SsEventPost[];
  upcoming: SsEventPost[];
  ongoing: SsEventPost[];
  past: SsEventPost[];
  heroImage: string | null;
  page: number;
  pageSize: number;
  hasMore: boolean;
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
      // Public endpoints — do not send broken/invalid Bearer tokens.
      next: { revalidate: ISR, tags: ['ss-media'] },
    } as RequestInit);
    if (!res.ok) {
      console.error(`SS media API ${res.status} for ${path}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error('SS media fetch failed:', err);
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
  // v4 relation: { data: { attributes } }
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

function formatEventRange(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const dOpts: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    const tOpts: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    const sd = s.toLocaleDateString('en-IN', dOpts);
    const ed = e.toLocaleDateString('en-IN', dOpts);
    if (sd === ed) {
      return `${sd} · ${s.toLocaleTimeString('en-IN', tOpts)} – ${e.toLocaleTimeString('en-IN', tOpts)}`;
    }
    return `${sd} – ${ed}`;
  } catch {
    return start.slice(0, 10);
  }
}

function eventStatus(start: string, end: string): SsEventPost['status'] {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now >= s && now <= e) return 'ongoing';
  if (now < s) return 'upcoming';
  return 'past';
}

function richTextPlain(blocks: unknown): string {
  if (!Array.isArray(blocks)) return typeof blocks === 'string' ? blocks : '';
  const parts: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const children = (block as { children?: unknown }).children;
    if (!Array.isArray(children)) continue;
    for (const c of children) {
      if (c && typeof c === 'object' && typeof (c as { text?: unknown }).text === 'string') {
        parts.push((c as { text: string }).text);
      }
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function mapNewsTags(raw: unknown): SsNewsTag[] {
  if (!Array.isArray(raw)) return [];
  const tags: SsNewsTag[] = [];
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

const SS_NEWS_GENERAL_CATEGORY = {
  id: 'campus-stories',
  label: 'Campus stories',
} as const;

function buildNewsCategories(posts: SsNewsPost[]): SsNewsCategory[] {
  const map = new Map<string, SsNewsCategory>();

  for (const post of posts) {
    const topicTags = post.tags.filter((t) => t.id !== SS_NEWS_TAG_ID);
    if (topicTags.length === 0) {
      const bucket = map.get(SS_NEWS_GENERAL_CATEGORY.id) ?? {
        id: SS_NEWS_GENERAL_CATEGORY.id,
        label: SS_NEWS_GENERAL_CATEGORY.label,
        posts: [],
      };
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

function mapNewsPost(raw: Record<string, unknown>): SsNewsPost | null {
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

function mapEventPost(raw: Record<string, unknown>): SsEventPost | null {
  const id = typeof raw.id === 'number' ? raw.id : Number(raw.id);
  const title = typeof raw.title === 'string' ? raw.title : '';
  const slug = typeof raw.slug === 'string' ? raw.slug : '';
  const start = typeof raw.start_date === 'string' ? raw.start_date : '';
  const end = typeof raw.end_date === 'string' ? raw.end_date : '';
  if (!id || !title || !slug || !start) return null;
  const media = asMedia(raw.featured_image);
  const url = media?.url ?? '';
  const more = typeof raw.more_infor === 'string' ? raw.more_infor : null;
  const reg = typeof raw.registration_link === 'string' ? raw.registration_link : null;
  /** Always the public events detail page (slug). Registration is separate. */
  const href = `${EVENT_POST_BASE}/${slug}`;
  return {
    id,
    title,
    slug,
    start_date: start,
    end_date: end || start,
    more_infor: more,
    registration_link: reg,
    centeremail: typeof raw.centeremail === 'string' ? raw.centeremail : '',
    featuredImage: media,
    dateLabel: formatEventRange(start, end || start),
    imageUrl: url ? pickImageUrl(media?.formats, url) : '',
    imageAlt: media?.alternativeText || title,
    href,
    status: eventStatus(start, end || start),
  };
}

export const getSsNews = cache(async (): Promise<SsNewsPageData> => {
  const empty: SsNewsPageData = {
    tagName: 'Hyderabad-Shanti Sarovar',
    tagHref: 'hyderabad-shanti-sarovar',
    total: 0,
    posts: [],
    latest: [],
    categories: [],
    heroImage: null,
  };

  const [tagRes, postsRes] = await Promise.all([
    portalGet<{ data: unknown }>(`/news-tags/${SS_NEWS_TAG_ID}`),
    portalGet<{ data: unknown[]; meta?: { pagination?: { total?: number } } }>(
      `/news-posts?` +
        [
          `filters[post_tags][id][$eq]=${SS_NEWS_TAG_ID}`,
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
  const tagName =
    typeof tag.name === 'string' ? tag.name : empty.tagName;
  const tagHref =
    typeof tag.href === 'string' ? tag.href : empty.tagHref;

  const posts = (postsRes?.data || [])
    .map((item) => mapNewsPost(unwrap(item)))
    .filter((p): p is SsNewsPost => Boolean(p));

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

function bucketSsEvents(events: SsEventPost[]) {
  const upcoming = events
    .filter((e) => e.status === 'upcoming')
    .sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
  const ongoing = events.filter((e) => e.status === 'ongoing');
  const past = events.filter((e) => e.status === 'past');
  return { upcoming, ongoing, past };
}

function eventsListPath(page: number, pageSize: number) {
  return (
    `/events?` +
    [
      `filters[event_organizors][id][$eq]=${SS_EVENT_ORGANIZER_ID}`,
      `pagination[page]=${page}`,
      `pagination[pageSize]=${pageSize}`,
      'fields[0]=title',
      'fields[1]=slug',
      'fields[2]=start_date',
      'fields[3]=end_date',
      'fields[4]=more_infor',
      'fields[5]=registration_link',
      'fields[6]=centeremail',
      'populate[featured_image][fields][0]=url',
      'populate[featured_image][fields][1]=formats',
      'populate[featured_image][fields][2]=alternativeText',
      'sort[0]=start_date:desc',
    ].join('&')
  );
}

export async function fetchSsEventsPage(
  page = 1,
  pageSize = EVENTS_INITIAL_PAGE_SIZE
): Promise<{
  events: SsEventPost[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}> {
  const eventsRes = await portalGet<{
    data: unknown[];
    meta?: { pagination?: { total?: number; page?: number; pageCount?: number } };
  }>(eventsListPath(page, pageSize));

  const events = (eventsRes?.data || [])
    .map((item) => mapEventPost(unwrap(item)))
    .filter((e): e is SsEventPost => Boolean(e));

  const pagination = eventsRes?.meta?.pagination;
  const total = pagination?.total ?? events.length;
  const currentPage = pagination?.page ?? page;
  const pageCount = pagination?.pageCount ?? 1;

  return {
    events,
    total,
    page: currentPage,
    pageSize,
    hasMore: currentPage < pageCount,
  };
}

export const getSsEvents = cache(async (): Promise<SsEventsPageData> => {
  const empty: SsEventsPageData = {
    organizerName: 'Shanti Sarovar - Hyderabad',
    organizerSlug: 'shanti-sarovar-hyderabad',
    description: '',
    total: 0,
    events: [],
    upcoming: [],
    ongoing: [],
    past: [],
    heroImage: null,
    page: 1,
    pageSize: EVENTS_INITIAL_PAGE_SIZE,
    hasMore: false,
  };

  const [orgRes, eventsBatch] = await Promise.all([
    portalGet<{ data: unknown }>(
      `/event-organizors/${SS_EVENT_ORGANIZER_ID}?populate[featured_image]=*`
    ),
    fetchSsEventsPage(1, EVENTS_INITIAL_PAGE_SIZE),
  ]);

  const org = unwrap(orgRes?.data);
  const organizerName =
    typeof org.organizor === 'string' ? org.organizor : empty.organizerName;
  const organizerSlug =
    typeof org.slug === 'string' ? org.slug : empty.organizerSlug;
  const description = richTextPlain(org.description);
  const orgMedia = asMedia(org.featured_image);

  const { upcoming, ongoing, past } = bucketSsEvents(eventsBatch.events);

  return {
    organizerName,
    organizerSlug,
    description,
    total: eventsBatch.total,
    events: eventsBatch.events,
    upcoming,
    ongoing,
    past,
    heroImage: orgMedia
      ? pickImageUrl(orgMedia.formats, orgMedia.url)
      : eventsBatch.events[0]?.imageUrl || null,
    page: eventsBatch.page,
    pageSize: eventsBatch.pageSize,
    hasMore: eventsBatch.hasMore,
  };
});
