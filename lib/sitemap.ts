import type { MetadataRoute } from 'next';
import { fetchSitemapCenters } from '@/lib/strapiClient';

const BASE = 'https://www.brahmakumaris.com/centers';

/** Keep in sync with lib/campuses/sitemap-data.js and registry.ts. */
const CAMPUS_SITES: {
  slug: string;
  pages: { path: string; changefreq: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[];
}[] = [
  {
    slug: 'shantisarovar',
    pages: [
      { path: '', changefreq: 'weekly', priority: 0.95 },
      { path: '/galleries', changefreq: 'weekly', priority: 0.85 },
      { path: '/news', changefreq: 'daily', priority: 0.85 },
      { path: '/events', changefreq: 'daily', priority: 0.85 },
      { path: '/contact', changefreq: 'weekly', priority: 0.85 },
      { path: '/csr', changefreq: 'monthly', priority: 0.85 },
    ],
  },
  {
    slug: 'jagdamba-bhawan',
    pages: [
      { path: '', changefreq: 'weekly', priority: 0.95 },
      { path: '/about', changefreq: 'weekly', priority: 0.9 },
      { path: '/galleries', changefreq: 'weekly', priority: 0.85 },
      { path: '/news', changefreq: 'daily', priority: 0.85 },
      { path: '/events', changefreq: 'daily', priority: 0.85 },
      { path: '/contact', changefreq: 'weekly', priority: 0.85 },
    ],
  },
];

function slugify(value: string): string {
  return encodeURIComponent(value.toLowerCase().replace(/\s+/g, '-'));
}

function entry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
  lastModified: Date
): MetadataRoute.Sitemap[number] {
  return {
    url: path ? `${BASE}${path}` : BASE,
    lastModified,
    changeFrequency,
    priority,
  };
}

/**
 * Build the full sitemap from Strapi. Cached by the caller (24h).
 */
export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const urls: MetadataRoute.Sitemap = [
    entry('', 'daily', 1, lastModified),
    entry('/retreat', 'weekly', 0.9, lastModified),
  ];

  for (const campus of CAMPUS_SITES) {
    for (const page of campus.pages) {
      urls.push(entry(`/${campus.slug}${page.path}`, page.changefreq, page.priority, lastModified));
    }
  }

  const centers = await fetchSitemapCenters();
  const regions: Record<string, true> = {};
  const states: Record<string, string> = {};
  const districts: Record<string, string> = {};

  for (const center of centers) {
    const { region, state, district } = center;
    if (region) regions[region] = true;
    if (state) {
      states[state] = region || '';
      if (district) districts[`${state}:${district}`] = state;
    }
  }

  Object.keys(regions).forEach((region) => {
    urls.push(entry(`/${slugify(region)}`, 'weekly', 0.8, lastModified));
  });

  Object.keys(states).forEach((state) => {
    const region = states[state] || '';
    urls.push(entry(`/${slugify(region)}/${slugify(state)}`, 'weekly', 0.7, lastModified));
  });

  Object.keys(districts).forEach((districtKey) => {
    const stateName = districts[districtKey];
    const [, districtName] = districtKey.split(':');
    const region = states[stateName] || '';
    urls.push(
      entry(
        `/${slugify(region)}/${slugify(stateName)}/${slugify(districtName)}`,
        'weekly',
        0.6,
        lastModified
      )
    );
  });

  for (const center of centers) {
    const { region, state, district, slug, name } = center;
    if (!region || !state || !district) continue;
    const centerSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
    if (!centerSlug) continue;
    urls.push(
      entry(
        `/${slugify(region)}/${slugify(state)}/${slugify(district)}/${encodeURIComponent(centerSlug)}`,
        'monthly',
        0.5,
        lastModified
      )
    );
  }

  return urls;
}
