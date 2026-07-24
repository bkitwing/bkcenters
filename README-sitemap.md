# Sitemap & Robots.txt

Generates `public/sitemap.xml` and `public/robots.txt` from Strapi center data plus campus routes in `lib/campuses/sitemap-data.js`.

## When it runs

| Trigger | Behavior |
|---|---|
| `./build.sh` (default) | **Skipped** — deploy keeps the last `public/sitemap.xml` so builds don’t wait on a full Strapi crawl |
| `GENERATE_SITEMAP=1 ./build.sh` | Runs crawl during deploy (fail soft if Strapi is down) |
| `npm run strapi-sync` | Regenerates sitemap at the end of a successful (non–dry-run) sync |
| `npm run generate-sitemap` | Manual refresh anytime |

## Manual generation

```bash
npm run generate-sitemap
```

Requires `STRAPI_BASE_URL` and `STRAPI_TOKEN` in `.env`.

## URL structure

- Homepage: `https://www.brahmakumaris.com/centers`
- Retreat: `…/centers/retreat`
- Campus microsites: from `lib/campuses/sitemap-data.js`
- Region / state / district / center pages: from Strapi centers

## Notes

- Skipping the crawl on deploy does **not** break the app; search engines keep using the existing sitemap until you regenerate.
- After adding/removing centers, run `npm run strapi-sync` or `npm run generate-sitemap` so Google sees new URLs.
- If Strapi is unreachable, keep the previous `public/sitemap.xml` rather than failing deploy.
