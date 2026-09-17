import type { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { buildSitemapEntries } from '@/lib/sitemap';

/**
 * Dynamic sitemap at /centers/sitemap.xml.
 * Not generated at build time (force-dynamic). First request loads slugs from
 * Strapi; Next.js caches the result for 24 hours.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 86400;

const getSitemap = unstable_cache(buildSitemapEntries, ['centers-sitemap'], {
  revalidate: 86400,
  tags: ['sitemap'],
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    return await getSitemap();
  } catch (error) {
    console.error('sitemap: failed to load centers from Strapi', error);
    return [
      {
        url: 'https://www.brahmakumaris.com/centers',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
