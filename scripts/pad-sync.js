#!/usr/bin/env node
/**
 * PAD (Mount Abu HQ) → Strapi sync, in one command.
 *
 *   npm run sync:check     Fetch latest India + Nepal data from PAD, show what is
 *                          NEW / UPDATED / DELETED vs Strapi. Writes NOTHING to Strapi.
 *   npm run sync:apply     Same check, then asks once and applies it (India, then Nepal),
 *                          then refreshes the live website cache.
 *
 * Options (after `--`, e.g. `npm run sync:apply -- --india`):
 *   --india | --nepal      Only that country (default: both)
 *   --no-fetch             Use the existing Centers_Raw.json / Centers_Nepal_Raw.json
 *   --yes                  Don't ask (for cron/unattended). Safety guards still apply.
 *   --skip-deletes         Apply only new + updated centers
 *   --max-deletes=N        With --yes: refuse if India would delete more than N centers (default 50).
 *                          Interactive runs only warn — PAD is the master.
 *   --force-fetch          Accept a PAD feed even if it shrank by more than 5%
 *   --no-revalidate        Don't refresh the live website cache after applying
 *
 * Safety (why this is non-breaking):
 *   1. A new PAD download only replaces the raw file after validation (complete, not
 *      shrunk >5%, every row has a branch_code). The previous file is backed up.
 *   2. The plan is always a dry run first; nothing is written until you confirm.
 *   3. Mass-delete guard: an unattended run on a partial feed can never wipe out centers.
 *   4. Nepal is create/update only; India never deletes Nepal centers.
 *   5. Every run's plan/report (incl. full snapshots of deleted centers) is kept in
 *      scripts/sync-history/.
 *
 * Strapi target: always webapp.brahmakumaris.com (fast; same database as portal).
 * Override with SYNC_STRAPI_URL only if you really need to.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');

const ROOT = path.join(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env') });

// ---------------------------------------------------------------- config
const STRAPI_URL = process.env.SYNC_STRAPI_URL || 'https://webapp.brahmakumaris.com/api';
const HISTORY_DIR = path.join(__dirname, 'sync-history');
const BACKUP_DIR = path.join(HISTORY_DIR, 'backups');
const KEEP_BACKUPS = 10;
const MAX_SHRINK = 0.05; // refuse a feed with >5% fewer centers than last time

const FEEDS = {
  india: {
    label: 'India',
    url: process.env.PAD_INDIA_URL || 'https://padds.bkivv.app/pad-data-services/locations/c/India',
    user: process.env.PAD_INDIA_USER,
    pass: process.env.PAD_INDIA_PASS,
    userVar: 'PAD_INDIA_USER',
    passVar: 'PAD_INDIA_PASS',
    file: path.join(ROOT, 'Centers_Raw.json'),
    syncArgs: [],
    canDelete: true,
  },
  nepal: {
    label: 'Nepal',
    url: process.env.PAD_NEPAL_URL || 'https://padds.bkivv.app/pad-data-services/locations/c/Nepal',
    user: process.env.PAD_NEPAL_USER,
    pass: process.env.PAD_NEPAL_PASS,
    userVar: 'PAD_NEPAL_USER',
    passVar: 'PAD_NEPAL_PASS',
    file: path.join(ROOT, 'Centers_Nepal_Raw.json'),
    syncArgs: ['--nepal'],
    canDelete: false,
  },
};

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2);
const command = argv.find(a => !a.startsWith('-')) || 'help';
const flag = name => argv.includes(`--${name}`);
const flagValue = name => {
  const a = argv.find(x => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : null;
};

const onlyIndia = flag('india');
const onlyNepal = flag('nepal');
const countries = onlyIndia && !onlyNepal ? ['india'] : onlyNepal && !onlyIndia ? ['nepal'] : ['india', 'nepal'];
const AUTO_YES = flag('yes') || flag('y');
const MAX_DELETES = parseInt(flagValue('max-deletes') || process.env.SYNC_MAX_DELETES || '50', 10);

// ---------------------------------------------------------------- helpers
const rel = p => path.relative(ROOT, p);
const stamp = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, a => { rl.close(); resolve(a.trim().toLowerCase()); }));
}

function banner(text) {
  const line = '═'.repeat(64);
  console.log(`\n${line}\n  ${text}\n${line}`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// ---------------------------------------------------------------- fetch
/** Rows that each sync mode actually uses (India feed carries a few Nepal rows). */
function relevantRows(country, data) {
  return data.filter(e => {
    const region = (e.region || '').toUpperCase().trim();
    return country === 'nepal' ? region.startsWith('NEPAL') : !region.startsWith('NEPAL');
  });
}

function validateFeed(country, json, previous) {
  const problems = [];
  if (!json || !Array.isArray(json.data)) return ['response has no "data" array'];
  if (json.data.length === 0) return ['response has 0 centers'];
  if (typeof json.total === 'number' && json.total !== json.data.length) {
    problems.push(`incomplete response: "total" says ${json.total} but got ${json.data.length} rows`);
  }
  const missing = json.data.filter(e => !e.branch_code || !String(e.branch_code).trim()).length;
  if (missing) problems.push(`${missing} rows have no branch_code`);

  if (previous && !flag('force-fetch')) {
    const before = relevantRows(country, previous.data || []).length;
    const after = relevantRows(country, json.data).length;
    if (before > 0 && after < before * (1 - MAX_SHRINK)) {
      problems.push(
        `feed shrank from ${before} to ${after} centers (> ${MAX_SHRINK * 100}% drop). ` +
        'Looks like a partial download. Re-run later, or use --force-fetch if this is genuine.'
      );
    }
  }
  return problems;
}

/** Quick "what changed at HQ since our last download" by branch code. */
function feedDelta(country, previous, next) {
  const prevCodes = new Set(relevantRows(country, previous?.data || []).map(e => e.branch_code));
  const nextRows = relevantRows(country, next.data);
  const nextCodes = new Set(nextRows.map(e => e.branch_code));
  const added = [...nextCodes].filter(c => !prevCodes.has(c)).length;
  const removed = [...prevCodes].filter(c => !nextCodes.has(c)).length;
  return { before: prevCodes.size, after: nextCodes.size, added, removed };
}

function backupFile(file) {
  if (!fs.existsSync(file)) return null;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const base = path.basename(file, '.json');
  const dest = path.join(BACKUP_DIR, `${base}.${stamp()}.json`);
  fs.copyFileSync(file, dest);
  // keep only the newest KEEP_BACKUPS per file
  const olds = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(base + '.') && f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(KEEP_BACKUPS);
  olds.forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f)));
  return dest;
}

/**
 * Download with curl rather than Node's fetch: padds.bkivv.app does not send its
 * intermediate certificate, which Node rejects (UNABLE_TO_VERIFY_LEAF_SIGNATURE)
 * while macOS curl completes the chain itself. TLS verification stays ON.
 * The login is passed on stdin (-K -) so it never shows up in `ps`.
 * Returns the HTTP status code.
 */
function curlDownload(url, user, pass, outFile) {
  const q = s => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  const res = spawnSync(
    'curl',
    ['-sS', '-K', '-', '--retry', '2', '--retry-delay', '2', '--max-time', '180',
      '-o', outFile, '-w', '%{http_code}', url],
    { input: `user = ${q(`${user}:${pass}`)}\n`, encoding: 'utf8' }
  );
  if (res.error) throw new Error(`could not run curl: ${res.error.message}`);
  if (res.status !== 0) throw new Error(`curl failed (exit ${res.status}): ${(res.stderr || '').trim()}`);
  return parseInt(res.stdout, 10);
}

async function fetchFeed(country) {
  const feed = FEEDS[country];
  if (!feed.user || !feed.pass) {
    throw new Error(
      `Missing ${feed.userVar} / ${feed.passVar} in .env — add the PAD login for ${feed.label} ` +
      '(see README-strapi-sync.md).'
    );
  }
  process.stdout.write(`  ${feed.label.padEnd(6)} downloading from PAD... `);
  const tmp = feed.file + '.tmp';
  let text;
  try {
    const status = curlDownload(feed.url, feed.user, feed.pass, tmp);
    if (status !== 200) throw new Error(`${feed.label} download failed: HTTP ${status}`);
    text = fs.readFileSync(tmp, 'utf8');
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    console.log('FAILED');
    throw err;
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    fs.rmSync(tmp, { force: true });
    console.log('REJECTED');
    throw new Error(`${feed.label} download is not valid JSON (first bytes: ${text.slice(0, 80)})`);
  }

  const previous = fs.existsSync(feed.file) ? readJson(feed.file) : null;
  const problems = validateFeed(country, json, previous);
  if (problems.length) {
    fs.rmSync(tmp, { force: true });
    console.log('REJECTED');
    problems.forEach(p => console.log(`         ✗ ${p}`));
    throw new Error(`${feed.label} feed rejected — kept the previous ${path.basename(feed.file)}, nothing synced.`);
  }

  const delta = feedDelta(country, previous, json);
  const backup = backupFile(feed.file);
  fs.renameSync(tmp, feed.file); // atomic replace
  console.log(
    `OK  ${delta.after} centers` +
    (previous ? `  (since last download: +${delta.added} added, -${delta.removed} removed at HQ)` : '')
  );
  if (backup) console.log(`         previous file backed up → ${rel(backup)}`);
}

// ---------------------------------------------------------------- strapi-sync runner
function runStrapiSync(country, extraArgs) {
  const feed = FEEDS[country];
  const args = [path.join(__dirname, 'strapi-sync.js'), ...feed.syncArgs, ...extraArgs];
  const res = spawnSync(process.execPath, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, STRAPI_BASE_URL: STRAPI_URL },
  });
  return res.status;
}

/** Dry-run every selected country; returns { country: report } */
function buildPlan(runDir) {
  const plans = {};
  for (const country of countries) {
    banner(`${FEEDS[country].label}: dry run (read-only)`);
    const reportFile = path.join(runDir, `${country}-plan.json`);
    const status = runStrapiSync(country, ['--dry-run', `--report=${reportFile}`]);
    if (status !== 0 || !fs.existsSync(reportFile)) {
      throw new Error(`${FEEDS[country].label} dry run failed (exit ${status}). Nothing was changed.`);
    }
    plans[country] = readJson(reportFile);
  }
  return plans;
}

function printSummary(plans) {
  banner('HQ → Strapi plan');
  for (const country of countries) {
    const s = plans[country].summary;
    const del = FEEDS[country].canDelete ? `-${s.deleted} deleted` : '(never deletes)';
    const orph = s.orphans ? `   ${s.orphans} empty district/state/region to remove` : '';
    console.log(
      `  ${FEEDS[country].label.padEnd(6)}  +${s.created} new   ~${s.updated} updated   ${del}${orph}`
    );
  }
  console.log(`  Strapi  ${STRAPI_URL}`);
}

const totalChanges = plans =>
  countries.reduce((n, c) => {
    const s = plans[c].summary;
    return n + s.created + s.updated + s.deleted + (s.orphans || 0);
  }, 0);

// ---------------------------------------------------------------- revalidate
async function revalidateLiveSite() {
  // The live site's URL + secret live in .env.production (the Next.js production env).
  const prodFile = path.join(ROOT, '.env.production');
  const prod = fs.existsSync(prodFile) ? dotenv.parse(fs.readFileSync(prodFile)) : {};
  const appUrl = process.env.SYNC_REVALIDATE_APP_URL || prod.NEXT_APP_URL;
  const secret = process.env.SYNC_REVALIDATE_SECRET || prod.REVALIDATE_SECRET || process.env.REVALIDATE_SECRET;
  if (!appUrl || !secret) {
    console.log('  Skipped website refresh (NEXT_APP_URL / REVALIDATE_SECRET not set). Pages refresh within 24h anyway.');
    return;
  }
  const url = `${appUrl.replace(/\/$/, '')}/centers/api/revalidate`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
      signal: AbortSignal.timeout(60000),
    });
    if (res.ok) console.log(`  ✓ Live website cache refreshed (${new URL(url).host})`);
    else console.log(`  ⚠ Website refresh returned HTTP ${res.status} — pages will still refresh within 24h. Retry: npm run sync:revalidate`);
  } catch (err) {
    console.log(`  ⚠ Website refresh failed (${err.message}) — pages will still refresh within 24h. Retry: npm run sync:revalidate`);
  }
}

// ---------------------------------------------------------------- commands
async function prepare(runDir) {
  if (!flag('no-fetch')) {
    banner('Step 1: download latest data from PAD (Mount Abu HQ)');
    for (const country of countries) await fetchFeed(country);
  } else {
    console.log('Using existing raw files (--no-fetch).');
    for (const country of countries) {
      if (!fs.existsSync(FEEDS[country].file)) throw new Error(`Missing ${rel(FEEDS[country].file)} — run without --no-fetch.`);
    }
  }
  return buildPlan(runDir);
}

async function check() {
  const runDir = path.join(HISTORY_DIR, `${stamp()}-check`);
  fs.mkdirSync(runDir, { recursive: true });
  const plans = await prepare(runDir);
  printSummary(plans);
  console.log(`\n  Nothing was written to Strapi. Full plan: ${rel(runDir)}/`);
  if (totalChanges(plans) > 0) console.log('  To apply it:  npm run sync:apply\n');
  else console.log('  ✓ Strapi is already in sync with HQ.\n');
}

async function apply() {
  const runDir = path.join(HISTORY_DIR, `${stamp()}-apply`);
  fs.mkdirSync(runDir, { recursive: true });
  const plans = await prepare(runDir);
  printSummary(plans);

  if (totalChanges(plans) === 0) {
    console.log('\n  ✓ Strapi is already in sync with HQ. Nothing to apply.\n');
    return;
  }

  // PAD is the master, so deletes follow PAD. The limit only stops UNATTENDED (--yes)
  // runs from wiping centers on a bad feed; a person running it sees the list and decides.
  const indiaDeletes = plans.india ? plans.india.summary.deleted : 0;
  if (indiaDeletes > MAX_DELETES && !flag('skip-deletes')) {
    if (AUTO_YES) {
      console.log(
        `\n⛔ Not applying unattended: India would delete ${indiaDeletes} centers (limit ${MAX_DELETES}).\n` +
        `   Check the list in ${rel(runDir)}/india-plan.json, then run it yourself (npm run sync:apply)\n` +
        `   or allow it: npm run sync:apply -- --yes --max-deletes=${indiaDeletes}\n`
      );
      process.exit(2);
    }
    console.log(
      `\n  ⚠️  WARNING: PAD no longer lists ${indiaDeletes} India centers, so they will be DELETED from Strapi.\n` +
      '     That is unusually many — scroll up and check the DELETED CENTERS list before answering.'
    );
  }

  let skipDeletes = flag('skip-deletes');
  if (!AUTO_YES) {
    const hasDeletes = !!plans.india && (plans.india.summary.deleted + (plans.india.summary.orphans || 0)) > 0;
    console.log('\n  [y] apply all of the above');
    if (hasDeletes && !skipDeletes) console.log('  [s] apply only NEW + UPDATED (skip all deletes)');
    console.log('  [n] abort, change nothing');
    const answer = await ask('\n  Apply to Strapi? ');
    if (answer === 's' && hasDeletes) skipDeletes = true;
    else if (answer !== 'y' && answer !== 'yes') {
      console.log('\n  ❌ Aborted. No changes were made.\n');
      return;
    }
  }

  const results = {};
  for (const country of countries) {
    const s = plans[country].summary;
    if (s.created + s.updated + s.deleted + (s.orphans || 0) === 0) {
      results[country] = 'already in sync';
      continue;
    }
    banner(`${FEEDS[country].label}: applying`);
    // Never delete more than the plan you just saw (or the limit, if higher).
    const extra = ['--yes', `--max-deletes=${Math.max(MAX_DELETES, s.deleted)}`];
    if (skipDeletes) extra.push('--no-delete');
    const status = runStrapiSync(country, extra);
    results[country] = status === 0 ? 'done' : `FAILED (exit ${status})`;
    // copy the applied report into this run's history folder
    const report = path.join(__dirname, country === 'nepal' ? 'sync-report-nepal.json' : 'sync-report.json');
    if (fs.existsSync(report)) fs.copyFileSync(report, path.join(runDir, `${country}-applied.json`));
    if (status !== 0) {
      console.log(`\n  ⛔ ${FEEDS[country].label} sync failed — stopping here. Re-run npm run sync:check to see what is left.\n`);
      break;
    }
  }

  banner('Result');
  for (const country of countries) console.log(`  ${FEEDS[country].label.padEnd(6)}  ${results[country] || 'not run'}`);
  if (!flag('no-revalidate') && Object.values(results).some(r => r === 'done')) {
    await revalidateLiveSite();
  }
  console.log(`  Reports: ${rel(runDir)}/`);
  console.log('  Tip: commit Centers_Raw.json + scripts/sync-report.json to keep the data snapshot in git.\n');
  if (Object.values(results).some(r => r.startsWith('FAILED'))) process.exit(1);
}

function help() {
  console.log(`
PAD (Mount Abu HQ) → Strapi sync

  npm run sync:check        Download latest India + Nepal data, show NEW / UPDATED / DELETED.
                            Read-only: nothing is written to Strapi.
  npm run sync:apply        Same, then asks once and applies it, then refreshes the website.

Options (add after "--", e.g. npm run sync:apply -- --india):
  --india | --nepal         Only one country
  --no-fetch                Reuse the raw files already on disk
  --skip-deletes            Apply only new + updated centers
  --yes                     No questions (for cron). Safety guards still apply.
  --max-deletes=N           With --yes: allow India to delete up to N centers (default ${MAX_DELETES})
  --force-fetch             Accept a PAD feed that shrank by more than ${MAX_SHRINK * 100}%
  --no-revalidate           Don't refresh the live website cache

Strapi target: ${STRAPI_URL}
`);
}

const commands = {
  check,
  apply,
  fetch: async () => {
    banner('Download latest data from PAD (Mount Abu HQ)');
    for (const country of countries) await fetchFeed(country);
  },
  revalidate: revalidateLiveSite,
  help,
};

(commands[command] || help)().catch(err => {
  console.error(`\n✗ ${err.message}\n`);
  process.exit(1);
});
