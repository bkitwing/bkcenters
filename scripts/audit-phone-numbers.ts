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
 * listing every number that needs attention.
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
  number: string;
  strapiValue: string;
  stdAdded: boolean;
  verdict: 'ok' | 'check-number' | 'missed-valid' | 'dialled-as-is' | 'MISMATCH';
  siteDials: string;
  libphonenumber: string;
  oldSiteDialled: string;
  note: string;
};

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
        const stdAdded = raw !== written[i];
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
        let note = '';
        if (siteRewrote) {
          if (lib && siteDials !== lib.number) {
            verdict = 'MISMATCH';
            note = `libphonenumber reads it as ${lib.number}`;
          } else if (libValid) {
            verdict = 'ok';
          } else {
            verdict = 'check-number';
            note = 'same digits as libphonenumber reads it, but it may not be a working number — confirm with the center';
          }
        } else if (libValid) {
          verdict = 'missed-valid';
          note = `valid as ${libE164}; site dials it as shown — improve lib/phone.ts`;
        } else {
          verdict = 'dialled-as-is';
          note = 'not a complete number (e.g. missing STD code) — fix in Strapi';
        }
        if (stdAdded) note = `written as ${written[i]}, STD code taken from the number before it${note ? `; ${note}` : ''}`;

        rows.push({
          branch_code: center.branch_code,
          center: center.name,
          region: center.region,
          field,
          number: raw,
          strapiValue: String(center[field]),
          stdAdded,
          verdict,
          siteDials,
          libphonenumber: libE164 || (lib ? `invalid (${lib.number})` : 'unparseable'),
          oldSiteDialled: `+91${written[i].replace(/\D/g, '')}`, // previous logic: "+91" in front of every number
          note,
        });
      }
    }
  }

  const count = (v: Row['verdict']) => rows.filter((r) => r.verdict === v).length;
  const libValidRows = rows.filter((r) => !r.libphonenumber.startsWith('invalid') && r.libphonenumber !== 'unparseable');
  const oldWrong = libValidRows.filter((r) => r.oldSiteDialled !== r.libphonenumber).length;

  console.log(`Centers: ${centers.length}   Numbers checked: ${rows.length}`);
  console.log(`  ok (dials the exact valid number):          ${count('ok')}`);
  console.log(`  check-number (same digits, may not exist):  ${count('check-number')}`);
  console.log(`  missed-valid (valid, but dialled as shown): ${count('missed-valid')}`);
  console.log(`  dialled as shown (incomplete in Strapi):    ${count('dialled-as-is')}`);
  console.log(`  MISMATCH (would dial a different number):   ${count('MISMATCH')}`);
  const stdAdded = rows.filter((r) => r.stdAdded);
  console.log(`STD code carried over from the number before it: ${stdAdded.length} (${stdAdded.filter((r) => r.verdict === 'ok').length} now ok)`);
  console.log(`Previous "+91 for everything" logic dialled ${oldWrong} of ${libValidRows.length} valid numbers wrongly.`);

  const needsAttention = rows.filter((r) => r.verdict !== 'ok');
  const csvPath = path.join(__dirname, 'phone-audit-report.csv');
  const esc = (v: string | boolean) => `"${String(v).replace(/"/g, '""')}"`;
  const header: (keyof Row)[] = ['verdict', 'branch_code', 'center', 'region', 'field', 'number', 'siteDials', 'libphonenumber', 'note', 'strapiValue'];
  fs.writeFileSync(
    csvPath,
    [header.join(','), ...needsAttention.map((r) => header.map((h) => esc(r[h])).join(','))].join('\n') + '\n'
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
