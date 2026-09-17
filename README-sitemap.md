# Sitemap & Robots.txt

Sitemap is generated dynamically by `app/sitemap.ts` at:

`https://www.brahmakumaris.com/centers/sitemap.xml`

It reads center slugs from Strapi and caches the result for 24 hours. Google always gets a fresh list after that window. There is no static `public/sitemap.xml`.

`public/robots.txt` points crawlers at that URL.

## When it refreshes

| Trigger | Behavior |
|---|---|
| First request after deploy / cache expiry | Loads slugs from Strapi, then caches 24h |
| `npm run strapi-sync` | Updates Strapi only — sitemap refreshes on the next cache miss (within 24h) |
| `./build.sh` | Removes any leftover `public/sitemap.xml` so the dynamic route is served |

## URL structure

- Homepage: `https://www.brahmakumaris.com/centers`
- Retreat: `…/centers/retreat`
- Campus microsites: listed in `lib/sitemap.ts` (keep in sync with `lib/campuses/registry.ts`)
- Region / state / district / center pages: from Strapi

## Notes

- Do not put a file at `public/sitemap.xml` — Next.js would serve it instead of the dynamic route.
- If Strapi is unreachable, the sitemap falls back to the homepage URL only (HTTP 200).
