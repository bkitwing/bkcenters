/**
 * Strapi Sync Script
 *
 * India mode (default):
 *   Reads Centers_Raw.json, excludes NEPAL region rows, syncs add/update/delete.
 *   Never deletes centers with country=Nepal (protected after Nepal import).
 *
 * Nepal mode (--nepal):
 *   Reads Centers_Nepal_Raw.json, create/update only — deletes and orphan cleanup disabled.
 *
 * Usage:
 *   node scripts/strapi-sync.js
 *   node scripts/strapi-sync.js --dry-run
 *   node scripts/strapi-sync.js --nepal --dry-run
 *   node scripts/strapi-sync.js --nepal --yes
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
const NEPAL_MODE = process.argv.includes('--nepal');
const RAW_FILE = path.join(
  __dirname,
  '..',
  NEPAL_MODE ? 'Centers_Nepal_Raw.json' : 'Centers_Raw.json'
);
const BATCH_SIZE = 20;
const DELAY_MS = 200;
const RETREAT_BRANCH_CODES = ['90001', '90007', '90006'];
const EXCLUDED_REGIONS = ['NEPAL']; // India mode only — never sync Nepal from India API
const NEPAL_REGION_PREFIXES = ['NEPAL']; // Nepal mode: accept regions starting with these
/**
 * Conservative Nepal state spelling aliases only (clear duplicates from PAD).
 * Keys are UPPERCASE trimmed; values are canonical display names.
 * Do not add fuzzy/guess mappings — only verified near-duplicates.
 */
const NEPAL_STATE_ALIASES = {
  DHANUSA: 'Dhanusha',       // official / majority spelling
  MECHI: 'Mechi',            // case normalize
  MAKAWANPUR: 'Makwanpur',   // official district spelling
};
const REPORT_FILE = path.join(
  __dirname,
  NEPAL_MODE ? 'sync-report-nepal.json' : 'sync-report.json'
);
const DETAILED = process.argv.includes('--detailed') || process.argv.includes('-d');
const AUTO_YES = process.argv.includes('--yes') || process.argv.includes('-y');
const DRY_RUN = process.argv.includes('--dry-run');

const { resolveNepalProvince, NEPAL_PROVINCES } = require('./nepal-provinces');

/** Normalize PAD Nepal region variants to a single Strapi region name. */
function normalizeNepalRegion(region) {
  const upper = (region || '').toUpperCase().trim();
  if (upper.startsWith('NEPAL')) return 'Nepal';
  return capitalizeString(region);
}

/** Apply only known safe Nepal state spelling aliases (legacy). Prefer resolveNepalProvince. */
function normalizeNepalState(state) {
  const trimmed = (state || '').trim();
  if (!trimmed) return trimmed;
  const alias = NEPAL_STATE_ALIASES[trimmed.toUpperCase()];
  return alias || capitalizeString(trimmed);
}

/**
 * Map PAD Nepal state/district into one of the 7 official provinces.
 * Falls back to spelling-normalized state only if unmapped (should be rare).
 */
function resolveNepalStateForSync(state, district) {
  const province = resolveNepalProvince(state, district);
  if (province) return province;
  return normalizeNepalState(state);
}

function isNepalCountry(country) {
  return (country || '').toUpperCase().trim() === 'NEPAL';
}

// --- Helpers ---

function capitalizeString(str) {
  if (!str) return str;
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Title-case, then uppercase the letter after each "." so PAD acronyms stay intact:
// I.S.R.O → I.S.R.O, J.P.NAGAR → J.P.Nagar, H.NO → H.No.
// Applied to center titles, address lines, and city. Keep in sync with lib/formatPlaceName.ts.
function formatCenterName(str) {
  if (!str) return str;
  return capitalizeString(str).replace(/\.([a-z])/g, (_, c) => '.' + c.toUpperCase());
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

// Reuse a small pool of keep-alive connections. Opening a fresh TLS handshake
// per request (and many in parallel) intermittently triggers the server to drop
// connections mid-handshake -> "EPROTO ... decrypt error / tlsv1 alert". Capping
// sockets keeps the connection count the server has to juggle low and stable.
const agent = new https.Agent({ keepAlive: true, maxSockets: 4 });

// Transient network/TLS errors worth retrying instead of aborting the whole sync.
function isRetryableError(err) {
  const msg = err && err.message ? err.message : '';
  return (
    err && (err.code === 'EPROTO' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') ||
    /EPROTO|ECONNRESET|decrypt|tlsv1 alert|socket hang up|timeout/i.test(msg)
  );
}

function strapiRequestRaw(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify({ data: body }) : null;
    const options = {
      hostname,
      path: basePath + '/' + endpoint,
      method,
      agent,
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

// Wrapper with automatic retries on transient TLS/network errors.
async function strapiRequest(method, endpoint, body, retries = 3) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await strapiRequestRaw(method, endpoint, body);
    } catch (err) {
      lastErr = err;
      if (attempt < retries && isRetryableError(err)) {
        await sleep(500 * (attempt + 1)); // backoff: 500ms, 1s, 1.5s
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
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
    name: formatCenterName(entry.name),
    slug: generateSlug(entry.name),
    branch_code: entry.branch_code || '',
    address_line1: formatCenterName(entry.address?.line1) || '',
    address_line2: formatCenterName(entry.address?.line2) || '',
    address_line3: formatCenterName(entry.address?.line3) || '',
    city: formatCenterName(entry.address?.city) || '',
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
      name: formatCenterName(e.name),
      district: capitalizeString(e.district),
      state: capitalizeString(e.state),
      region: capitalizeString(e.region)
    })),
    updated: toUpdate.map(({ entry, diffs }) => ({
      branch_code: entry.branch_code,
      name: formatCenterName(entry.name),
      changes: diffs.map(d => ({ field: d.field, from: d.from, to: d.to }))
    })),
    deleted: toDelete.map(({ code, name }) => ({ branch_code: code, name }))
  };
}

// --- Main Sync ---

async function sync() {
  console.log(NEPAL_MODE ? '=== Strapi Sync (NEPAL — create/update only) ===\n' : '=== Strapi Sync (INDIA) ===\n');

  if (!STRAPI_BASE_URL || !STRAPI_TOKEN) {
    console.error('Missing STRAPI_BASE_URL or STRAPI_TOKEN in .env');
    process.exit(1);
  }

  if (!fs.existsSync(RAW_FILE)) {
    console.error(`Missing raw file: ${RAW_FILE}`);
    process.exit(1);
  }

  // Step 1: Read raw data
  console.log(`Reading ${path.basename(RAW_FILE)}...`);
  const rawData = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
  const allRawEntries = rawData.data;
  console.log(`  Raw file: ${allRawEntries.length} entries`);

  let rawEntries;
  if (NEPAL_MODE) {
    // Accept only Nepal-region rows; normalize region/state spelling; trim names
    rawEntries = allRawEntries
      .filter(e => {
        const region = (e.region || '').toUpperCase().trim();
        return NEPAL_REGION_PREFIXES.some(p => region.startsWith(p));
      })
      .map(e => ({
        ...e,
        region: normalizeNepalRegion(e.region),
        state: resolveNepalStateForSync(e.state, e.district),
        district: capitalizeString((e.district || '').trim()),
        country: capitalizeString((e.country || '').trim()) || 'Nepal',
      }));
    const skipped = allRawEntries.length - rawEntries.length;
    if (skipped > 0) {
      console.log(`  Skipped ${skipped} non-Nepal entries`);
    }
    console.log(`  Nepal mode: deletes DISABLED, orphan cleanup SKIPPED`);
    console.log(`  Provinces: ${NEPAL_PROVINCES.join(', ')}`);
    const provCounts = {};
    rawEntries.forEach(e => { provCounts[e.state] = (provCounts[e.state] || 0) + 1; });
    console.log('  Province distribution:', provCounts);
  } else {
    // Filter out excluded regions (e.g. Nepal) — only sync India data
    rawEntries = allRawEntries.filter(e => {
      const region = (e.region || '').toUpperCase().trim();
      return !EXCLUDED_REGIONS.includes(region) && !region.startsWith('NEPAL');
    });
    const excludedCount = allRawEntries.length - rawEntries.length;
    if (excludedCount > 0) {
      console.log(`  Excluded ${excludedCount} entries from regions: ${EXCLUDED_REGIONS.join(', ')}`);
    }
  }
  console.log(`  Entries to sync: ${rawEntries.length}\n`);

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

  // district id -> { districtName, stateName } for Nepal hierarchy drift checks
  const districtMetaById = {};
  existingDistricts.forEach(d => {
    const stateId = d.attributes.state_center?.data?.id;
    const state = existingStates.find(s => s.id === stateId);
    districtMetaById[d.id] = {
      districtName: d.attributes.name,
      stateName: state?.attributes?.name || '',
    };
  });

  // Step 3: Decide what needs to change
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
      const linkedDistId = a.district_center?.data?.id;
      const linkedMeta = linkedDistId ? districtMetaById[linkedDistId] : null;
      const expectedState = capitalizeString(entry.state);
      const expectedDistrict = capitalizeString(entry.district);
      const districtMatches = !!(
        linkedMeta &&
        (linkedMeta.districtName === expectedDistrict ||
          linkedMeta.districtName === `${expectedDistrict} (${expectedState})`)
      );
      const hierarchyDrift = !!(
        NEPAL_MODE &&
        linkedMeta &&
        ((linkedMeta.stateName && linkedMeta.stateName !== expectedState) ||
          (linkedMeta.districtName && !districtMatches))
      );

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
        (a.longitude != null ? a.longitude : null) !== expected.longitude ||
        hierarchyDrift;
      
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
        if (hierarchyDrift && linkedMeta) {
          if (linkedMeta.stateName !== expectedState) {
            diffs.push({ field: 'state', from: linkedMeta.stateName, to: expectedState });
          }
          if (linkedMeta.districtName !== expectedDistrict) {
            diffs.push({ field: 'district', from: linkedMeta.districtName, to: expectedDistrict });
          }
        }
        toUpdate.push({ entry, strapiId: existing.id, diffs });
      }
    }
  }

  // Find deleted entries (in Strapi but not in raw file)
  // Nepal mode: never delete. India mode: never delete Nepal-country centers.
  if (!NEPAL_MODE) {
    for (const [code, existing] of Object.entries(centerByCode)) {
      if (!rawByCode[code]) {
        if (isNepalCountry(existing.attributes.country)) {
          continue; // Protect Nepal imports from India sync deletes
        }
        toDelete.push({ code, id: existing.id, name: existing.attributes.name });
      }
    }
  }

  console.log('=== Sync Plan ===');
  console.log(`  New centers to create: ${toCreate.length}`);
  console.log(`  Centers to update: ${toUpdate.length}`);
  console.log(`  Centers to delete: ${toDelete.length}${NEPAL_MODE ? ' (disabled in Nepal mode)' : ''}`);
  console.log('');

  // --- Detailed Report ---
  if (toCreate.length > 0) {
    console.log('┌─── NEW CENTERS ───');
    for (const entry of toCreate) {
      console.log(`│  + [${entry.branch_code}] ${formatCenterName(entry.name)} — ${capitalizeString(entry.district)}, ${capitalizeString(entry.state)}`);
    }
    console.log('└───────────────────\n');
  }

  if (toUpdate.length > 0) {
    console.log('┌─── UPDATED CENTERS ───');
    for (const { entry, diffs } of toUpdate) {
      console.log(`│  ~ [${entry.branch_code}] ${formatCenterName(entry.name)}`);
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
    console.log('✓ Centers are already in sync! Checking for orphaned hierarchy entries...\n');
  }

  const hasCenterChanges = toCreate.length > 0 || toUpdate.length > 0 || toDelete.length > 0;

  // --- Dry run mode ---
  if (hasCenterChanges && DRY_RUN) {
    console.log('🔍 DRY RUN — No changes were made. Review the plan above.\n');
    const report = buildReport(toCreate, toUpdate, toDelete);
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');
    console.log(`  Report saved to: ${path.relative(path.join(__dirname, '..'), REPORT_FILE)}\n`);
    return;
  }

  // --- Confirmation Prompt ---
  if (hasCenterChanges && !AUTO_YES) {
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

  // Step 4: Ensure regions/states/districts exist for creates (and Nepal updates that remount hierarchy)
  const hierarchyEntries = NEPAL_MODE
    ? [...toCreate, ...toUpdate.map(u => u.entry)]
    : toCreate;
  if (hierarchyEntries.length > 0) {
    console.log('Ensuring regions/states/districts exist...');

    // Index districts by exact name (Strapi enforces global unique district names)
    const districtIdByName = {};
    existingDistricts.forEach(d => {
      districtIdByName[d.attributes.name] = d.id;
    });

    async function resolveStateId(stateName, regionName, entry) {
      if (stateByName[stateName]) return stateByName[stateName];

      // Rename trim/alias variant in place (e.g. "Sagarmatha " → "Sagarmatha", "Makawanpur" → "Makwanpur")
      const variantKeys = Object.keys(stateByName).filter(n => {
        if (n.trim() === stateName) return true;
        const upper = n.toUpperCase().trim();
        return NEPAL_STATE_ALIASES[upper] === stateName;
      });
      if (variantKeys.length === 1) {
        const oldName = variantKeys[0];
        const id = stateByName[oldName];
        await strapiRequest('PUT', `state-centers/${id}`, {
          name: stateName,
          slug: generateSlug(stateName),
          state_id: entry.state_id || '',
          ...(regionName && regionByName[regionName] ? { region_center: regionByName[regionName] } : {}),
        });
        delete stateByName[oldName];
        stateByName[stateName] = id;
        // Rewrite district keys that used the old state name
        for (const key of Object.keys(districtByKey)) {
          if (key.startsWith(oldName + '::')) {
            const distName = key.slice(oldName.length + 2);
            districtByKey[stateName + '::' + distName] = districtByKey[key];
            delete districtByKey[key];
          }
        }
        console.log(`  ~ State renamed: "${oldName}" → "${stateName}"`);
        return id;
      }

      // Create new state
      const body = { name: stateName, slug: generateSlug(stateName), state_id: entry.state_id || '' };
      if (regionName && regionByName[regionName]) body.region_center = regionByName[regionName];
      const res = await strapiRequest('POST', 'state-centers', body);
      stateByName[stateName] = res.data.id;
      console.log(`  + State: ${stateName}`);
      return res.data.id;
    }

    async function resolveDistrictId(stateName, districtName, entry) {
      const distKey = stateName + '::' + districtName;
      if (districtByKey[distKey]) return districtByKey[distKey];

      const stateId = stateByName[stateName];

      // Reuse district only if it already belongs to this province/state.
      // Never re-link a same-named district from another province (e.g. Kanchanpur).
      const existingId = districtIdByName[districtName];
      if (existingId) {
        const meta = districtMetaById[existingId];
        if (meta && meta.stateName === stateName) {
          districtByKey[distKey] = existingId;
          return existingId;
        }
      }

      // Prefer exact name; on global uniqueness conflict use Province-scoped name.
      const candidates = [districtName, `${districtName} (${stateName})`];
      for (const candidate of candidates) {
        const candKey = stateName + '::' + candidate;
        if (districtByKey[candKey]) {
          districtByKey[distKey] = districtByKey[candKey];
          return districtByKey[candKey];
        }
        if (districtIdByName[candidate]) {
          const meta = districtMetaById[districtIdByName[candidate]];
          if (meta && meta.stateName === stateName) {
            districtByKey[distKey] = districtIdByName[candidate];
            districtByKey[candKey] = districtIdByName[candidate];
            return districtIdByName[candidate];
          }
          continue; // name taken by another state
        }
        try {
          const body = {
            name: candidate,
            slug: generateSlug(candidate),
            district_id: entry.district_id || '',
          };
          if (stateId) body.state_center = stateId;
          const res = await strapiRequest('POST', 'district-centers', body);
          districtByKey[distKey] = res.data.id;
          districtByKey[candKey] = res.data.id;
          districtIdByName[candidate] = res.data.id;
          districtMetaById[res.data.id] = { districtName: candidate, stateName };
          if (candidate !== districtName) {
            console.log(`  + District: ${candidate} (scoped under ${stateName})`);
          } else {
            console.log(`  + District: ${candidate} (${stateName})`);
          }
          return res.data.id;
        } catch (err) {
          const msg = err && err.message ? err.message : String(err);
          if (!/unique/i.test(msg)) throw err;
          // race / unique conflict — try next candidate
        }
      }
      throw new Error(`Could not resolve district "${districtName}" under ${stateName}`);
    }

    for (const entry of hierarchyEntries) {
      const regionName = capitalizeString(entry.region);
      const stateName = capitalizeString(entry.state);
      const districtName = capitalizeString(entry.district);

      if (regionName && !regionByName[regionName]) {
        const res = await strapiRequest('POST', 'region-centers', { name: regionName, slug: generateSlug(regionName) });
        regionByName[regionName] = res.data.id;
        console.log(`  + Region: ${regionName}`);
      }

      if (stateName) {
        await resolveStateId(stateName, regionName, entry);
      }
      if (districtName && stateName) {
        await resolveDistrictId(stateName, districtName, entry);
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

  // Step 8: Clean up orphaned hierarchy entries (districts, states, regions with no centers)
  // Nepal mode skips this so India hierarchy is never touched by a Nepal run.
  if (NEPAL_MODE) {
    console.log('Skipping orphan hierarchy cleanup (Nepal mode).\n');
  } else {
    console.log('Checking for orphaned hierarchy entries...');

    // Re-fetch current state of all collections after center deletions
    const [currentCenters, currentDistricts, currentStates, currentRegions] = await Promise.all([
      fetchAll('centers', 'district_center'),
      fetchAll('district-centers', 'state_center'),
      fetchAll('state-centers', 'region_center'),
      fetchAll('region-centers'),
    ]);

    // Build sets of district/state/region IDs that are still referenced by centers
    const usedDistrictIds = new Set();
    for (const c of currentCenters) {
      const distId = c.attributes.district_center?.data?.id;
      if (distId) usedDistrictIds.add(distId);
    }

    const orphanedDistricts = currentDistricts.filter(d => !usedDistrictIds.has(d.id));

    // Build set of state IDs still referenced by remaining districts
    const remainingDistricts = currentDistricts.filter(d => usedDistrictIds.has(d.id));
    const usedStateIds = new Set();
    for (const d of remainingDistricts) {
      const stateId = d.attributes.state_center?.data?.id;
      if (stateId) usedStateIds.add(stateId);
    }

    const orphanedStates = currentStates.filter(s => !usedStateIds.has(s.id));

    // Build set of region IDs still referenced by remaining states
    const remainingStates = currentStates.filter(s => usedStateIds.has(s.id));
    const usedRegionIds = new Set();
    for (const s of remainingStates) {
      const regionId = s.attributes.region_center?.data?.id;
      if (regionId) usedRegionIds.add(regionId);
    }

    const orphanedRegions = currentRegions.filter(r => !usedRegionIds.has(r.id));

    const totalOrphans = orphanedDistricts.length + orphanedStates.length + orphanedRegions.length;

    if (totalOrphans === 0) {
      console.log('  No orphaned hierarchy entries found.\n');
    } else {
      // Show what will be removed
      console.log('');
      if (orphanedDistricts.length > 0) {
        console.log('┌─── ORPHANED DISTRICTS ───');
        for (const d of orphanedDistricts) {
          console.log(`│  - ${d.attributes.name}`);
        }
        console.log('└──────────────────────────\n');
      }
      if (orphanedStates.length > 0) {
        console.log('┌─── ORPHANED STATES ───');
        for (const s of orphanedStates) {
          console.log(`│  - ${s.attributes.name}`);
        }
        console.log('└───────────────────────\n');
      }
      if (orphanedRegions.length > 0) {
        console.log('┌─── ORPHANED REGIONS ───');
        for (const r of orphanedRegions) {
          console.log(`│  - ${r.attributes.name}`);
        }
        console.log('└────────────────────────\n');
      }

      // Ask for confirmation
      let proceedOrphan = AUTO_YES;
      if (!AUTO_YES) {
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║              ⚠️  ORPHAN CLEANUP CONFIRMATION                 ║');
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║  Districts : ${String(orphanedDistricts.length).padStart(4)} orphaned                                    ║`);
        console.log(`║  States    : ${String(orphanedStates.length).padStart(4)} orphaned                                    ║`);
        console.log(`║  Regions   : ${String(orphanedRegions.length).padStart(4)} orphaned                                    ║`);
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log('║  [y] Yes, delete orphaned entries                           ║');
        console.log('║  [n] No, keep them                                          ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('');

        const answer = await askUser('Delete orphaned entries? (y/n): ');
        const choice = answer.trim().toLowerCase();
        proceedOrphan = (choice === 'y' || choice === 'yes');

        if (!proceedOrphan) {
          console.log('\n⏭️  Skipping orphan cleanup.\n');
        }
      }

      if (proceedOrphan) {
        // Delete orphaned districts
        if (orphanedDistricts.length > 0) {
          console.log(`  Removing ${orphanedDistricts.length} orphaned district(s)...`);
          for (const d of orphanedDistricts) {
            try {
              await strapiRequest('DELETE', `district-centers/${d.id}`);
              console.log(`    - District: ${d.attributes.name}`);
            } catch (err) {
              console.error(`    ✗ Failed to delete district ${d.attributes.name}: ${err.message}`);
            }
          }
        }

        // Delete orphaned states
        if (orphanedStates.length > 0) {
          console.log(`  Removing ${orphanedStates.length} orphaned state(s)...`);
          for (const s of orphanedStates) {
            try {
              await strapiRequest('DELETE', `state-centers/${s.id}`);
              console.log(`    - State: ${s.attributes.name}`);
            } catch (err) {
              console.error(`    ✗ Failed to delete state ${s.attributes.name}: ${err.message}`);
            }
          }
        }

        // Delete orphaned regions
        if (orphanedRegions.length > 0) {
          console.log(`  Removing ${orphanedRegions.length} orphaned region(s)...`);
          for (const r of orphanedRegions) {
            try {
              await strapiRequest('DELETE', `region-centers/${r.id}`);
              console.log(`    - Region: ${r.attributes.name}`);
            } catch (err) {
              console.error(`    ✗ Failed to delete region ${r.attributes.name}: ${err.message}`);
            }
          }
        }

        console.log(`  ✓ Cleaned up ${totalOrphans} orphaned entries.\n`);
      }
    }
  }

  // Summary & Report
  const report = buildReport(toCreate, toUpdate, toDelete);
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('=== Sync Complete ===');
  console.log(`  Created: ${report.summary.created}`);
  console.log(`  Updated: ${report.summary.updated}`);
  console.log(`  Deleted: ${report.summary.deleted}`);
  console.log(`  Report saved to: ${path.relative(path.join(__dirname, '..'), REPORT_FILE)}`);
  console.log('=====================\n');

  // Refresh sitemap after real syncs (not dry-run). Fail soft — sync already succeeded.
  if (!DRY_RUN) {
    try {
      console.log('Refreshing sitemap.xml from Strapi...');
      require('child_process').execSync('npm run generate-sitemap', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
      });
    } catch (err) {
      console.warn(
        'WARNING: sitemap refresh failed — keeping existing public/sitemap.xml.',
        err.message || err
      );
    }
  }
}

sync().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
