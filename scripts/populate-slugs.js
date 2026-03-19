/**
 * One-time script to populate slug fields for all 4 Strapi tables:
 *   - region-centers
 *   - state-centers
 *   - district-centers
 *   - centers
 *
 * Slug formula: name.toLowerCase().replace(/\s+/g, '-')
 * This matches formatCenterUrl() and generate-sitemap.js exactly.
 *
 * Usage: node scripts/populate-slugs.js
 *        node scripts/populate-slugs.js --dry-run   (preview without writing)
 */

const https = require('https');
require('dotenv').config();

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 20;
const DELAY_MS = 500;

function parseBaseUrl(url) {
  const parsed = new URL(url);
  return { hostname: parsed.hostname, basePath: parsed.pathname.replace(/\/$/, '') };
}

const { hostname, basePath } = parseBaseUrl(STRAPI_BASE_URL);

function strapiRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify({ data: body }) : null;
    const options = {
      hostname,
      path: basePath + '/' + endpoint,
      method,
      headers: {
        'Authorization': 'Bearer ' + STRAPI_TOKEN,
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {})
      },
      timeout: 30000
    };
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
          else reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed.error || parsed).substring(0, 300)}`));
        } catch (e) { reject(new Error(`Parse error (${res.statusCode}): ${d.substring(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

async function fetchAll(collection) {
  let all = [];
  let page = 1;
  while (true) {
    const res = await strapiRequest('GET', `${collection}?pagination[page]=${page}&pagination[pageSize]=100`);
    all = all.concat(res.data || []);
    if (page >= (res.meta?.pagination?.pageCount || 0)) break;
    page++;
  }
  return all;
}

function generateSlug(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/\s+/g, '-');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function populateSlugs(collection, label) {
  console.log(`\n--- ${label} ---`);
  const entries = await fetchAll(collection);
  console.log(`  Found ${entries.length} entries`);

  const toUpdate = [];
  for (const entry of entries) {
    const name = entry.attributes.name || '';
    const currentSlug = entry.attributes.slug || '';
    const expectedSlug = generateSlug(name);

    if (currentSlug !== expectedSlug) {
      toUpdate.push({ id: entry.id, name, currentSlug, expectedSlug });
    }
  }

  if (toUpdate.length === 0) {
    console.log(`  ✓ All slugs are already correct.`);
    return 0;
  }

  console.log(`  ${toUpdate.length} entries need slug update${DRY_RUN ? ' (DRY RUN)' : ''}:`);

  if (DRY_RUN) {
    for (const { id, name, currentSlug, expectedSlug } of toUpdate.slice(0, 10)) {
      console.log(`    [${id}] "${name}": "${currentSlug}" → "${expectedSlug}"`);
    }
    if (toUpdate.length > 10) console.log(`    ... and ${toUpdate.length - 10} more`);
    return toUpdate.length;
  }

  let updated = 0, errors = 0;
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const batch = toUpdate.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(({ id, expectedSlug }) =>
        strapiRequest('PUT', `${collection}/${id}`, { slug: expectedSlug })
      )
    );
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        updated++;
      } else {
        errors++;
        console.error(`    ✗ [${batch[idx].id}] ${batch[idx].name}: ${r.reason.message}`);
      }
    });
    process.stdout.write(`\r  Updated: ${updated}/${toUpdate.length}`);
    if (i + BATCH_SIZE < toUpdate.length) await sleep(DELAY_MS);
  }
  console.log(`\n  ✓ Updated ${updated}, Failed ${errors}`);
  return updated;
}

async function main() {
  if (!STRAPI_BASE_URL || !STRAPI_TOKEN) {
    console.error('Missing STRAPI_BASE_URL or STRAPI_TOKEN in .env');
    process.exit(1);
  }

  console.log(`=== Populate Slugs${DRY_RUN ? ' (DRY RUN)' : ''} ===`);
  console.log(`Target: ${STRAPI_BASE_URL}\n`);

  let totalUpdated = 0;
  totalUpdated += await populateSlugs('region-centers', 'Regions');
  totalUpdated += await populateSlugs('state-centers', 'States');
  totalUpdated += await populateSlugs('district-centers', 'Districts');
  totalUpdated += await populateSlugs('centers', 'Centers');

  console.log(`\n=== Done === Total ${DRY_RUN ? 'needing update' : 'updated'}: ${totalUpdated}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
