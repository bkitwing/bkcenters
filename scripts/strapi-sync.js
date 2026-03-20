/**
 * Strapi Sync Script
 * 
 * Reads Centers_Raw.json and syncs data into Strapi CMS.
 * Handles: NEW entries, UPDATED entries, and REMOVED entries.
 * 
 * Usage: node scripts/strapi-sync.js
 * 
 * How it works:
 *   1. Reads Centers_Raw.json (your latest paste from the API)
 *   2. Fetches all existing centers from Strapi
 *   3. Compares by branch_code:
 *      - NEW branch_code   → Creates region/state/district if needed, then creates center
 *      - EXISTING branch_code with changes → Updates the center
 *      - branch_code in Strapi but NOT in raw file → Deletes from Strapi
 *   4. Prints a summary of changes
 * 
 * Requires STRAPI_BASE_URL and STRAPI_TOKEN in .env
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
require('dotenv').config();

// --- Config ---
const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const RAW_FILE = path.join(__dirname, '..', 'Centers_Raw.json');
const BATCH_SIZE = 20;
const DELAY_MS = 200;
const RETREAT_BRANCH_CODES = ['90001', '90007', '90006'];
const REPORT_FILE = path.join(__dirname, 'sync-report.json');
const DETAILED = process.argv.includes('--detailed') || process.argv.includes('-d');
const AUTO_YES = process.argv.includes('--yes') || process.argv.includes('-y');
const DRY_RUN = process.argv.includes('--dry-run');
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;
// Default to local; override with NEXT_APP_URL env var for production
const NEXT_APP_URL = process.env.NEXT_APP_URL || 'http://localhost:5400';

// --- Helpers ---

function capitalizeString(str) {
  if (!str) return str;
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractFirstEmail(emailStr) {
  if (!emailStr || !emailStr.trim()) return null;
  const parts = emailStr.split(/[,;]\s*/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed && trimmed.includes('@') && trimmed.includes('.')) return trimmed;
  }
  return null;
}

// Generate URL-friendly slug from center name (same formula used in formatCenterUrl & sitemap)
function generateSlug(name) {
  if (!name) return '';
  return capitalizeString(name).toLowerCase().replace(/\s+/g, '-');
}

// Create a hash of the center data to detect changes
function hashCenter(entry) {
  const key = [
    entry.name, entry.branch_code,
    entry.address?.line1, entry.address?.line2, entry.address?.line3,
    entry.address?.city, entry.address?.pincode,
    entry.email, entry.contact, entry.mobile,
    entry.country, entry.district, entry.state, entry.region,
    entry.zone, entry.sub_zone, entry.section,
    entry.country_id, entry.state_id, entry.district_id,
    entry.coords?.[0], entry.coords?.[1]
  ].join('|');
  return crypto.createHash('md5').update(key).digest('hex');
}

// --- Strapi API ---

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

// Fetch all entries from a collection (handles pagination)
async function fetchAll(collection, populate) {
  let all = [];
  let page = 1;
  const popQuery = populate ? `&populate=${populate}` : '';
  while (true) {
    const res = await strapiRequest('GET', `${collection}?pagination[page]=${page}&pagination[pageSize]=100${popQuery}`);
    all = all.concat(res.data || []);
    if (page >= (res.meta?.pagination?.pageCount || 0)) break;
    page++;
  }
  return all;
}

// Build center body from raw entry
function buildCenterBody(entry, districtStrapiId) {
  let latitude = null, longitude = null;
  if (entry.coords && Array.isArray(entry.coords) && entry.coords.length === 2) {
    const lat = parseFloat(entry.coords[0]);
    const lng = parseFloat(entry.coords[1]);
    if (!isNaN(lat)) latitude = lat;
    if (!isNaN(lng)) longitude = lng;
  }

  const body = {
    name: capitalizeString(entry.name),
    slug: generateSlug(entry.name),
    branch_code: entry.branch_code || '',
    address_line1: capitalizeString(entry.address?.line1) || '',
    address_line2: capitalizeString(entry.address?.line2) || '',
    address_line3: capitalizeString(entry.address?.line3) || '',
    city: capitalizeString(entry.address?.city) || '',
    pincode: entry.address?.pincode || '',
    email: extractFirstEmail(entry.email),
    contact: entry.contact || '',
    mobile: entry.mobile || '',
    country: capitalizeString(entry.country) || '',
    zone: entry.zone || '',
    sub_zone: entry.sub_zone || '',
    section: entry.section || '',
    country_id: entry.country_id || '',
    latitude,
    longitude,
    is_retreat: RETREAT_BRANCH_CODES.includes(entry.branch_code)
  };

  if (districtStrapiId) body.district_center = districtStrapiId;
  return body;
}

// --- Interactive Prompt ---
const readline = require('readline');

function askUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Build report object for saving
function buildReport(toCreate, toUpdate, toDelete) {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      created: toCreate.length,
      updated: toUpdate.length,
      deleted: toDelete.length
    },
    created: toCreate.map(e => ({
      branch_code: e.branch_code,
      name: capitalizeString(e.name),
      district: capitalizeString(e.district),
      state: capitalizeString(e.state),
      region: capitalizeString(e.region)
    })),
    updated: toUpdate.map(({ entry, diffs }) => ({
      branch_code: entry.branch_code,
      name: capitalizeString(entry.name),
      changes: diffs.map(d => ({ field: d.field, from: d.from, to: d.to }))
    })),
    deleted: toDelete.map(({ code, name }) => ({ branch_code: code, name }))
  };
}

// --- Main Sync ---

async function sync() {
  console.log('=== Strapi Sync ===\n');

  if (!STRAPI_BASE_URL || !STRAPI_TOKEN) {
    console.error('Missing STRAPI_BASE_URL or STRAPI_TOKEN in .env');
    process.exit(1);
  }

  // Step 1: Read raw data
  console.log('Reading Centers_Raw.json...');
  const rawData = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
  const rawEntries = rawData.data;
  console.log(`  Raw file: ${rawEntries.length} entries\n`);

  // Step 2: Fetch existing data from Strapi
  console.log('Fetching existing Strapi data...');
  const [existingRegions, existingStates, existingDistricts, existingCenters] = await Promise.all([
    fetchAll('region-centers'),
    fetchAll('state-centers', 'region_center'),
    fetchAll('district-centers', 'state_center'),
    fetchAll('centers', 'district_center')
  ]);
  console.log(`  Strapi: ${existingRegions.length} regions, ${existingStates.length} states, ${existingDistricts.length} districts, ${existingCenters.length} centers\n`);

  // Build lookup maps for existing data
  const regionByName = {};
  existingRegions.forEach(r => { regionByName[r.attributes.name] = r.id; });

  const stateByName = {};
  existingStates.forEach(s => { stateByName[s.attributes.name] = s.id; });

  const districtByKey = {}; // "StateName::DistrictName" -> id
  existingDistricts.forEach(d => {
    const stateId = d.attributes.state_center?.data?.id;
    const state = existingStates.find(s => s.id === stateId);
    if (state) {
      districtByKey[state.attributes.name + '::' + d.attributes.name] = d.id;
    }
  });

  const centerByCode = {}; // branch_code -> { id, attributes }
  existingCenters.forEach(c => {
    centerByCode[c.attributes.branch_code] = { id: c.id, attributes: c.attributes };
  });

  // Step 3: Determine what needs to change
  const rawByCode = {};
  rawEntries.forEach(e => { rawByCode[e.branch_code] = e; });

  const toCreate = [];
  const toUpdate = [];  // { entry, strapiId, diffs[] }
  const toDelete = [];

  // Find new and updated entries
  for (const entry of rawEntries) {
    const existing = centerByCode[entry.branch_code];
    if (!existing) {
      toCreate.push(entry);
    } else {
      // Compare ALL fields to detect changes
      const a = existing.attributes;
      const expected = buildCenterBody(entry, null);
      const changed =
        a.name !== expected.name ||
        a.branch_code !== expected.branch_code ||
        a.address_line1 !== expected.address_line1 ||
        a.address_line2 !== expected.address_line2 ||
        a.address_line3 !== expected.address_line3 ||
        a.city !== expected.city ||
        a.pincode !== expected.pincode ||
        a.contact !== expected.contact ||
        a.mobile !== expected.mobile ||
        a.country !== expected.country ||
        a.zone !== expected.zone ||
        a.sub_zone !== expected.sub_zone ||
        a.section !== expected.section ||
        a.country_id !== expected.country_id ||
        a.is_retreat !== expected.is_retreat ||
        (a.slug || '') !== expected.slug ||
        (a.email || null) !== expected.email ||
        (a.latitude != null ? a.latitude : null) !== expected.latitude ||
        (a.longitude != null ? a.longitude : null) !== expected.longitude;
      
      if (changed) {
        // Build detailed field-level diff
        const diffs = [];
        const fields = [
          ['name', a.name, expected.name],
          ['slug', a.slug || '', expected.slug],
          ['branch_code', a.branch_code, expected.branch_code],
          ['address_line1', a.address_line1, expected.address_line1],
          ['address_line2', a.address_line2, expected.address_line2],
          ['address_line3', a.address_line3, expected.address_line3],
          ['city', a.city, expected.city],
          ['pincode', a.pincode, expected.pincode],
          ['email', a.email || null, expected.email],
          ['contact', a.contact, expected.contact],
          ['mobile', a.mobile, expected.mobile],
          ['country', a.country, expected.country],
          ['zone', a.zone, expected.zone],
          ['sub_zone', a.sub_zone, expected.sub_zone],
          ['section', a.section, expected.section],
          ['country_id', a.country_id, expected.country_id],
          ['is_retreat', a.is_retreat, expected.is_retreat],
          ['latitude', a.latitude != null ? a.latitude : null, expected.latitude],
          ['longitude', a.longitude != null ? a.longitude : null, expected.longitude],
        ];
        for (const [field, oldVal, newVal] of fields) {
          if (oldVal !== newVal) {
            diffs.push({ field, from: oldVal, to: newVal });
          }
        }
        toUpdate.push({ entry, strapiId: existing.id, diffs });
      }
    }
  }

  // Find deleted entries (in Strapi but not in raw file)
  for (const [code, existing] of Object.entries(centerByCode)) {
    if (!rawByCode[code]) {
      toDelete.push({ code, id: existing.id, name: existing.attributes.name });
    }
  }

  console.log('=== Sync Plan ===');
  console.log(`  New centers to create: ${toCreate.length}`);
  console.log(`  Centers to update: ${toUpdate.length}`);
  console.log(`  Centers to delete: ${toDelete.length}`);
  console.log('');

  // --- Detailed Report ---
  if (toCreate.length > 0) {
    console.log('┌─── NEW CENTERS ───');
    for (const entry of toCreate) {
      console.log(`│  + [${entry.branch_code}] ${capitalizeString(entry.name)} — ${capitalizeString(entry.district)}, ${capitalizeString(entry.state)}`);
    }
    console.log('└───────────────────\n');
  }

  if (toUpdate.length > 0) {
    console.log('┌─── UPDATED CENTERS ───');
    for (const { entry, diffs } of toUpdate) {
      console.log(`│  ~ [${entry.branch_code}] ${capitalizeString(entry.name)}`);
      for (const d of diffs) {
        console.log(`│      ${d.field}: "${d.from}" → "${d.to}"`);
      }
    }
    console.log('└───────────────────────\n');
  }

  if (toDelete.length > 0) {
    console.log('┌─── DELETED CENTERS ───');
    for (const { code, name } of toDelete) {
      console.log(`│  - [${code}] ${name}`);
    }
    console.log('└───────────────────────\n');
  }

  if (toCreate.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
    console.log('✓ Everything is already in sync! No changes needed.\n');
    return;
  }

  // --- Dry run mode ---
  if (DRY_RUN) {
    console.log('🔍 DRY RUN — No changes were made. Review the plan above.\n');
    const report = buildReport(toCreate, toUpdate, toDelete);
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');
    console.log(`  Report saved to: scripts/sync-report.json\n`);
    return;
  }

  // --- Confirmation Prompt ---
  if (!AUTO_YES) {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    ⚠️  CONFIRMATION REQUIRED                 ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  CREATE : ${String(toCreate.length).padStart(4)} center(s)                                    ║`);
    console.log(`║  UPDATE : ${String(toUpdate.length).padStart(4)} center(s)                                    ║`);
    console.log(`║  DELETE : ${String(toDelete.length).padStart(4)} center(s)                                    ║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  [y] Yes, proceed with ALL changes                         ║');
    if (toDelete.length > 0) {
      console.log('║  [s] Skip deletes — only create & update                   ║');
    }
    console.log('║  [n] No, abort — make no changes                           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    const answer = await askUser('Proceed? (y/s/n): ');
    const choice = answer.trim().toLowerCase();

    if (choice === 'n' || choice === 'no') {
      console.log('\n❌ Aborted. No changes were made.\n');
      return;
    }
    if (choice === 's' || choice === 'skip') {
      console.log('\n⏭️  Skipping deletes. Will only create & update.\n');
      toDelete.length = 0; // Clear the delete list
    } else if (choice !== 'y' && choice !== 'yes') {
      console.log('\n❌ Unrecognized input. Aborting for safety. No changes were made.\n');
      return;
    } else {
      console.log('\n✅ Confirmed. Starting sync...\n');
    }
  }

  // Step 4: Ensure regions/states/districts exist for new entries
  if (toCreate.length > 0) {
    console.log('Ensuring regions/states/districts exist for new entries...');
    
    for (const entry of toCreate) {
      const regionName = capitalizeString(entry.region);
      const stateName = capitalizeString(entry.state);
      const districtName = capitalizeString(entry.district);

      // Create region if needed
      if (regionName && !regionByName[regionName]) {
        const res = await strapiRequest('POST', 'region-centers', { name: regionName, slug: generateSlug(regionName) });
        regionByName[regionName] = res.data.id;
        console.log(`  + Region: ${regionName}`);
      }

      // Create state if needed
      if (stateName && !stateByName[stateName]) {
        const body = { name: stateName, slug: generateSlug(stateName), state_id: entry.state_id || '' };
        if (regionName && regionByName[regionName]) body.region_center = regionByName[regionName];
        const res = await strapiRequest('POST', 'state-centers', body);
        stateByName[stateName] = res.data.id;
        console.log(`  + State: ${stateName}`);
      }

      // Create district if needed
      const distKey = stateName + '::' + districtName;
      if (districtName && !districtByKey[distKey]) {
        const body = { name: districtName, slug: generateSlug(districtName), district_id: entry.district_id || '' };
        if (stateName && stateByName[stateName]) body.state_center = stateByName[stateName];
        const res = await strapiRequest('POST', 'district-centers', body);
        districtByKey[distKey] = res.data.id;
        console.log(`  + District: ${districtName} (${stateName})`);
      }
    }
    console.log('');
  }

  // Step 5: Create new centers
  if (toCreate.length > 0) {
    console.log(`Creating ${toCreate.length} new centers...`);
    let created = 0, errors = 0;
    for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
      const batch = toCreate.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(entry => {
        const distKey = capitalizeString(entry.state) + '::' + capitalizeString(entry.district);
        const body = buildCenterBody(entry, districtByKey[distKey]);
        return strapiRequest('POST', 'centers', body);
      }));
      results.forEach(r => { if (r.status === 'fulfilled') created++; else { errors++; console.error(`  ✗ ${r.reason.message}`); } });
      process.stdout.write(`\r  Created: ${created}/${toCreate.length}`);
      if (i + BATCH_SIZE < toCreate.length) await sleep(DELAY_MS);
    }
    console.log(`\n  ✓ Created ${created}, Failed ${errors}\n`);
  }

  // Step 6: Update changed centers
  if (toUpdate.length > 0) {
    console.log(`Updating ${toUpdate.length} centers...`);
    let updated = 0, errors = 0;
    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(({ entry, strapiId }) => {
        const distKey = capitalizeString(entry.state) + '::' + capitalizeString(entry.district);
        const body = buildCenterBody(entry, districtByKey[distKey]);
        return strapiRequest('PUT', `centers/${strapiId}`, body);
      }));
      results.forEach(r => { if (r.status === 'fulfilled') updated++; else { errors++; console.error(`  ✗ ${r.reason.message}`); } });
      process.stdout.write(`\r  Updated: ${updated}/${toUpdate.length}`);
      if (i + BATCH_SIZE < toUpdate.length) await sleep(DELAY_MS);
    }
    console.log(`\n  ✓ Updated ${updated}, Failed ${errors}\n`);
  }

  // Step 7: Delete removed centers
  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} centers no longer in raw data...`);
    let deleted = 0, errors = 0;
    for (const { code, id, name } of toDelete) {
      try {
        await strapiRequest('DELETE', `centers/${id}`);
        deleted++;
        console.log(`  - ${name} (${code})`);
      } catch (err) {
        errors++;
        console.error(`  ✗ Failed to delete ${code}: ${err.message}`);
      }
    }
    console.log(`  ✓ Deleted ${deleted}, Failed ${errors}\n`);
  }

  // Summary & Report
  const report = buildReport(toCreate, toUpdate, toDelete);
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('=== Sync Complete ===');
  console.log(`  Created: ${report.summary.created}`);
  console.log(`  Updated: ${report.summary.updated}`);
  console.log(`  Deleted: ${report.summary.deleted}`);
  console.log(`  Report saved to: scripts/sync-report.json`);
  console.log('=====================\n');

  // Trigger on-demand revalidation so Next.js pages show updated data immediately
  await revalidateNextJs();
}

/**
 * Call the Next.js /api/revalidate endpoint to purge cached pages.
 * Only runs if REVALIDATE_SECRET is set and changes were made.
 */
async function revalidateNextJs() {
  if (!REVALIDATE_SECRET) {
    console.log('ℹ️  REVALIDATE_SECRET not set — skipping cache revalidation.');
    console.log('   Set REVALIDATE_SECRET in .env and ensure the Next.js server is running.\n');
    return;
  }

  const url = `${NEXT_APP_URL}/api/revalidate`;
  console.log(`Triggering cache revalidation at ${url}...`);

  try {
    const http = url.startsWith('https') ? https : require('http');
    const parsedUrl = new URL(url);
    const postData = JSON.stringify({ secret: REVALIDATE_SECRET });

    const result = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (url.startsWith('https') ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
          catch (e) { resolve({ status: res.statusCode, body: d }); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Revalidation request timed out')); });
      req.write(postData);
      req.end();
    });

    if (result.status === 200 && result.body.revalidated) {
      console.log(`  ✓ Cache revalidated! Paths: ${result.body.paths.join(', ')}`);
      console.log(`    Pages will show updated data on next visit.\n`);
    } else {
      console.log(`  ⚠ Revalidation response: ${result.status}`, result.body);
    }
  } catch (err) {
    console.log(`  ⚠ Could not reach Next.js server at ${url}: ${err.message}`);
    console.log('    This is normal if the server is not running locally.');
    console.log('    Pages will auto-refresh within 24 hours (fallback).\n');
  }
}

sync().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
