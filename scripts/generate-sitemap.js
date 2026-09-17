/**
 * Legacy script. Sitemap is now generated dynamically by app/sitemap.ts
 * at /centers/sitemap.xml (Strapi slugs, cached 24 hours).
 *
 * Do not write public/sitemap.xml — a static file would hide the dynamic route.
 */
console.log('Sitemap is dynamic: GET /centers/sitemap.xml (app/sitemap.ts).');
console.log('It reads center slugs from Strapi and caches them for 24 hours.');
console.log('Nothing was written to public/sitemap.xml.');
process.exit(0);
