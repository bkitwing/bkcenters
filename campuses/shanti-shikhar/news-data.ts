import type { NewsPost } from '@/lib/types';
import { SHK_CONTENT, SHK_INAUGURATION_HREF } from './content';

/**
 * Placeholder campus highlights drawn from content/.
 * Replace this list with the Strapi news client when a tag is available.
 */

export const SHK_NEWS_TAG_ID = 0;

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

const NEWS_HREF = '/shanti-shikhar/news';

function post(input: {
  id: number;
  slug: string;
  category: string;
  title: string;
  href: string;
  hasVideo?: boolean;
  featured?: boolean;
}): ShkNewsPost {
  return {
    id: input.id,
    title: input.title,
    slug: input.slug,
    date: '',
    Featured: Boolean(input.featured),
    featuredImage: null,
    dateLabel: input.category,
    imageUrl: '',
    imageThumbUrl: '',
    imageAlt: input.title,
    hasVideo: Boolean(input.hasVideo),
    href: input.href,
    tags: [{ id: input.id, name: input.category, href: NEWS_HREF }],
  };
}

export function getShkNews(): ShkNewsPageData {
  const posts: ShkNewsPost[] = [
    post({
      id: 1,
      slug: 'inauguration',
      category: 'Inauguration',
      title: SHK_CONTENT.inauguration.title,
      href: SHK_INAUGURATION_HREF,
      hasVideo: true,
      featured: true,
    }),
    post({
      id: 2,
      slug: 'academy',
      category: 'Academy',
      title: SHK_CONTENT.tagline,
      href: '/centers/shanti-shikhar',
    }),
    post({
      id: 3,
      slug: 'learning',
      category: 'Learning',
      title: SHK_CONTENT.about.title,
      href: '/centers/shanti-shikhar',
    }),
    post({
      id: 4,
      slug: 'facilities',
      category: 'Facilities',
      title: SHK_CONTENT.facilities.title,
      href: '/centers/shanti-shikhar',
    }),
    post({
      id: 5,
      slug: 'services',
      category: 'Service',
      title: SHK_CONTENT.services.title,
      href: '/centers/shanti-shikhar',
    }),
    post({
      id: 6,
      slug: 'city',
      category: 'Nava Raipur',
      title: SHK_CONTENT.city.title,
      href: '/centers/shanti-shikhar',
    }),
  ];

  return {
    tagName: 'Shanti Shikhar',
    tagHref: NEWS_HREF,
    total: posts.length,
    posts,
    latest: posts.slice(0, 4),
    categories: posts.map((item) => ({
      id: item.slug,
      label: item.tags[0]?.name || 'Campus',
      posts: [item],
    })),
    heroImage: null,
  };
}
