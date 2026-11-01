/**
 * Phone number audit — checks how the site dials every center number in Strapi
 * against Google's libphonenumber (the library Android uses).
 *
 *   npm run audit:phones            # uses STRAPI_BASE_URL / STRAPI_TOKEN from .env
 *   npm run audit:phones -- --prod  # also loads .env.production (production Strapi)
 *
 * The rule being checked: the site may only ever dial the number that
 * libphonenumber reads the stored text as. Each number is sorted into:
 *   ok             valid number; site dials exactly libphonenumber's +country form
 *   fixed-by-site  not written as a complete number, but the site reads it as
 *                  one (shared STD code, "0977-…", Indian mobile at a Nepal
 *                  center) — confirm with the center and correct it in Strapi
 *   check-number   site dials libphonenumber's reading of it, but libphonenumber
 *                  isn't sure the number exists — worth confirming with the center
 *   missed-valid   libphonenumber says valid but the site couldn't read it, so it
 *                  dials the digits as shown — improve lib/phone.ts
 *   dialled-as-is  not a complete number (e.g. landline without STD code); the
 *                  site dials exactly what's shown — fix these in Strapi
 *   MISMATCH       site would dial a number different from libphonenumber's → bug
 *
 * Numbers are read the way the site reads them (splitPhoneField), so a bare
 * number that shares the STD code written before it — "079-23290533, 23294850"
 * — is checked as the complete number the site dials ("079-23294850").
 * When libphonenumber's reading of the text isn't valid, a valid reading the
 * site also accepts is used instead: the country code written after a single 0
 * ("0977-9847510925" → +977…), or an Indian mobile listed by a Nepal center.
 *
 * Exits with code 1 on any MISMATCH, and writes scripts/phone-audit-report.csv
 * listing every number that needs attention, with its digit count and what is
 * wrong with it in words, to share with the centers.
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { internationalNumber, phoneToTel, splitPhoneField } from '../lib/phone';
import { isNepalRegion } from '../lib/countryUtils';

dotenv.config();
if (process.argv.includes('--prod')) dotenv.config({ path: '.env.production', override: true });

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
if (!STRAPI_BASE_URL || !STRAPI_TOKEN) {
  console.error('STRAPI_BASE_URL and STRAPI_TOKEN must be set (see .env)');
  process.exit(2);
}

type Row = {
  branch_code: string;
  center: string;
  region: string;
  field: 'mobile' | 'contact';
  writtenAs: string; // as written in Strapi
  number: string; // as the site reads it: with the STD code added when shared
  strapiValue: string;
  stdAdded: boolean;
  verdict: 'ok' | 'fixed-by-site' | 'check-number' | 'missed-valid' | 'dialled-as-is' | 'MISMATCH';
  siteDials: string;
  libphonenumber: string;
  oldSiteDialled: string;
  problem: string;
};

const ACTION: Record<Row['verdict'], string> = {
  MISMATCH: 'Developers to check',
  'missed-valid': 'Developers to check',
  'dialled-as-is': 'Please correct in Strapi',
  'check-number': 'Please confirm the number',
  'fixed-by-site': 'Fixed on website - please confirm, then correct in Strapi',
  ok: '',
};

/** "9 digits - 1 digit missing; Indian mobile numbers have 10" */
function digitCount(have: number, need: number, what: string, after = ''): string {
  const diff = Math.abs(need - have);
  const off = `${diff} digit${diff > 1 ? 's' : ''} ${have < need ? 'missing' : 'too many'}`;
  return `${have} digits${after} - ${off}; ${what} have ${need}`;
}

/** What is wrong with a number that isn't written as a complete number, in words a center can act on */
function describeIncomplete(writtenAs: string, field: Row['field'], country: 'IN' | 'NP'): string {
  const digits = writtenAs.replace(/\D/g, '');
  if (country === 'IN') {
    if (digits.startsWith('0')) {
      return digitCount(digits.length - 1, 10, 'Indian landlines (STD code + number)', ' after the leading 0');
    }
    if (field === 'mobile' || /^[6-9]/.test(digits)) return digitCount(digits.length, 10, 'Indian mobile numbers');
    return `${digits.length} digits - STD code missing (write it like 0755-2463838)`;
  }
  if (/^00/.test(digits) && !digits.startsWith('00977')) return `Country code written as ${digits.slice(2, 5)} - Nepal's is 977`;
  const afterCode = digits.match(/^0{0,2}977(\d+)$/)?.[1].replace(/^0/, '');
  const national = afterCode ?? digits.replace(/^0/, '');
  const after = afterCode !== undefined ? ' after 977' : '';
  return national.startsWith('9')
    ? digitCount(national.length, 10, 'Nepal mobile numbers', after)
    : digitCount(national.length, 8, 'Nepal landlines (area code + number)', after);
}

async function fetchAllCenters() {
  const fields = [
    'fields[0]=name', 'fields[1]=branch_code', 'fields[2]=mobile', 'fields[3]=contact',
    'populate[district_center][populate][state_center][populate][region_center][fields][0]=name',
  ].join('&');
  const all: any[] = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${STRAPI_BASE_URL}/centers?${fields}&pagination[page]=${page}&pagination[pageSize]=1000`, {
      headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
    });
    if (!res.ok) throw new Error(`Strapi ${res.status}`);
    const json = await res.json();
    all.push(...(json.data || []));
    if (page >= json.meta.pagination.pageCount) break;
  }
  return all.map((e) => {
    const a = e.attributes;
    const region =
      a.district_center?.data?.attributes?.state_center?.data?.attributes?.region_center?.data?.attributes?.name || '';
    return { name: a.name as string, branch_code: a.branch_code as string, mobile: a.mobile || '', contact: a.contact || '', region };
  });
}

async function main() {
  const centers = await fetchAllCenters();
  const rows: Row[] = [];

  for (const center of centers) {
    for (const field of ['mobile', 'contact'] as const) {
      const written = String(center[field]).split(',').map((n) => n.trim()).filter(Boolean);
      const numbers = splitPhoneField(center[field], center.region);
      for (let i = 0; i < numbers.length; i++) {
        const raw = numbers[i];
        const writtenAs = written[i];
        const stdAdded = raw !== writtenAs;
        const digits = raw.replace(/\D/g, '');
        if (!digits) continue; // placeholders like "-"
        const country = isNepalRegion(center.region) ? 'NP' : 'IN';
        const asWritten = parsePhoneNumberFromString(raw, country);
        const text = raw.trim();
        const alternative = asWritten?.isValid()
          ? undefined
          : [
              text.startsWith('0') ? parsePhoneNumberFromString(`+${text.slice(1)}`) : undefined,
              country === 'NP' && !text.startsWith('+') ? parsePhoneNumberFromString(raw, 'IN') : undefined,
            ].find(
              (p) =>
                p?.isValid() &&
                (p.country === country || (country === 'NP' && p.country === 'IN' && /MOBILE/.test(p.getType() ?? '')))
            );
        const lib = alternative ?? asWritten;
        const libValid = Boolean(lib?.isValid());
        const libE164 = libValid ? lib!.number : '';
        const siteHref = phoneToTel(raw, center.region);
        const siteRewrote = internationalNumber(raw, center.region) !== null;
        const siteDials = siteHref.replace(/^tel:/, '');

        let verdict: Row['verdict'];
        let problem = '';
        if (siteRewrote) {
          if (lib && siteDials !== lib.number) {
            verdict = 'MISMATCH';
            problem = `Website dials ${siteDials} but libphonenumber reads it as ${lib.number} - check lib/phone.ts`;
          } else if (!libValid) {
            verdict = 'check-number';
            problem = 'Right number of digits, but not in any number range in use - may not be a working number';
          } else if (stdAdded) {
            verdict = 'fixed-by-site';
            problem = `STD code missing - website uses ${raw.split('-')[0]} from the number before it: ${raw}`;
          } else if (alternative?.country === country) {
            verdict = 'fixed-by-site';
            problem = `Country code written as 0${alternative.countryCallingCode} - should be +${alternative.countryCallingCode} or 00${alternative.countryCallingCode}`;
          } else if (alternative) {
            verdict = 'fixed-by-site';
            problem = 'Indian mobile at a Nepal center - website dials it with +91';
          } else {
            verdict = 'ok';
          }
        } else if (libValid) {
          verdict = 'missed-valid';
          problem = `Valid as ${libE164}, but the website dials it as written - check lib/phone.ts`;
        } else {
          verdict = 'dialled-as-is';
          problem = describeIncomplete(writtenAs, field, country);
        }
        if (stdAdded && verdict !== 'fixed-by-site') problem = `STD code added from the number before it (${raw}); ${problem}`;

        rows.push({
          branch_code: center.branch_code,
          center: center.name,
          region: center.region,
          field,
          writtenAs,
          number: raw,
          strapiValue: String(center[field]),
          stdAdded,
          verdict,
          siteDials,
          libphonenumber: libE164 || (lib ? `invalid (${lib.number})` : 'unparseable'),
          oldSiteDialled: `+91${writtenAs.replace(/\D/g, '')}`, // previous logic: "+91" in front of every number
          problem,
        });
      }
    }
  }

  const count = (v: Row['verdict']) => rows.filter((r) => r.verdict === v).length;
  const libValidRows = rows.filter((r) => !r.libphonenumber.startsWith('invalid') && r.libphonenumber !== 'unparseable');
  const oldWrong = libValidRows.filter((r) => r.oldSiteDialled !== r.libphonenumber).length;

  console.log(`Centers: ${centers.length}   Numbers checked: ${rows.length}`);
  console.log(`  ok (dials the exact valid number):          ${count('ok')}`);
  console.log(`  fixed-by-site (completed by the site):      ${count('fixed-by-site')}`);
  console.log(`  check-number (same digits, may not exist):  ${count('check-number')}`);
  console.log(`  missed-valid (valid, but dialled as shown): ${count('missed-valid')}`);
  console.log(`  dialled as shown (incomplete in Strapi):    ${count('dialled-as-is')}`);
  console.log(`  MISMATCH (would dial a different number):   ${count('MISMATCH')}`);
  console.log(`Previous "+91 for everything" logic dialled ${oldWrong} of ${libValidRows.length} valid numbers wrongly.`);

  // Bugs first, then numbers to correct, to confirm, and the ones the site completes
  const order = Object.keys(ACTION);
  const needsAttention = rows
    .filter((r) => r.verdict !== 'ok')
    .sort((a, b) => order.indexOf(a.verdict) - order.indexOf(b.verdict));
  const columns: [string, (r: Row) => string][] = [
    ['Action', (r) => ACTION[r.verdict]],
    ['Branch code', (r) => r.branch_code],
    ['Center', (r) => r.center],
    ['Region', (r) => r.region],
    ['Field', (r) => r.field],
    ['Number in Strapi', (r) => r.writtenAs],
    ['Digits', (r) => String(r.writtenAs.replace(/\D/g, '').length)],
    ['Problem', (r) => r.problem],
    ['Website dials', (r) => r.siteDials],
    ['Full field in Strapi', (r) => r.strapiValue],
    ['verdict', (r) => r.verdict],
    ['libphonenumber', (r) => r.libphonenumber],
  ];
  const csvPath = path.join(__dirname, 'phone-audit-report.csv');
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  fs.writeFileSync(
    csvPath,
    [
      columns.map(([label]) => esc(label)).join(','),
      ...needsAttention.map((r) => columns.map(([, value]) => esc(value(r))).join(',')),
    ].join('\n') + '\n'
  );
  console.log(`Report of ${needsAttention.length} numbers needing attention: ${path.relative(process.cwd(), csvPath)}`);

  if (count('MISMATCH') > 0) {
    console.error('FAILED: the site would dial a number different from the valid one. See the report.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
