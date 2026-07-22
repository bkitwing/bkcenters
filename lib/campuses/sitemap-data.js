/**
 * Campus URLs for scripts/generate-sitemap.js (CommonJS).
 * Keep slugs in sync with lib/campuses/registry.ts.
 */
module.exports = {
  campuses: [
    {
      slug: 'shantisarovar',
      pages: [
        { path: '', changefreq: 'weekly', priority: 0.95 },
        { path: '/galleries', changefreq: 'weekly', priority: 0.85 },
        { path: '/news', changefreq: 'daily', priority: 0.85 },
        { path: '/events', changefreq: 'daily', priority: 0.85 },
        { path: '/contact', changefreq: 'weekly', priority: 0.85 },
      ],
    },
  ],
};
