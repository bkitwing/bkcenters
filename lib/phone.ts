import { isNepalRegion } from './countryUtils';

/**
 * Phone numbers as stored in Strapi come in many shapes:
 *   India: "9371394775", "08562-245600" (landline with trunk 0), "+91 …"
 *   Nepal: "9803130188", "00977-4989957", "+977-9841170797", "14262330"
 *
 * Rule: a number is rewritten to international format (+91… / +977…) only when
 * it is provably a complete number for that country. Anything else is dialled
 * exactly as it is shown on the page, so a data problem can never turn into a
 * call to a different, valid number.
 *
 * `npm run audit:phones` checks these rules against Google's libphonenumber for
 * every number in Strapi — run it after each data sync.
 */

type Country = { code: string; isValidNational: (n: string) => boolean };

const INDIA: Country = {
  code: '91',
  // 10 digits: mobiles start 6–9, landlines are STD code + number starting 1–5
  isValidNational: (n) => /^[1-9]\d{9}$/.test(n),
};

const NEPAL: Country = {
  code: '977',
  // Mobiles: 97/98 + 8 digits. Landlines: area code + number = 8 digits
  isValidNational: (n) => /^9[78]\d{8}$/.test(n) || /^[1-9]\d{7}$/.test(n),
};

function countryFor(region?: string | null): Country {
  return isNepalRegion(region) ? NEPAL : INDIA;
}

/**
 * The national number (no country code, no trunk 0) when `raw` is a complete,
 * valid number for the center's country; otherwise null.
 */
export function nationalNumber(raw: string, region?: string | null): string | null {
  const country = countryFor(region);
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  // After a country code, a stray trunk 0 is common in the data ("+977-081-542061")
  const withCode = (d: string) => {
    if (!d.startsWith(country.code)) return null;
    const rest = d.slice(country.code.length).replace(/^0/, '');
    return country.isValidNational(rest) ? rest : null;
  };

  if (trimmed.startsWith('+')) return withCode(digits);
  if (digits.startsWith('00')) return withCode(digits.slice(2)); // international prefix: 0091… / 00977…

  // Written with the country code but no "+" (e.g. 919876543210)
  const fromCode = withCode(digits);
  if (fromCode && digits.length > 10) return fromCode;

  if (digits.startsWith('0')) digits = digits.slice(1); // trunk 0 of landlines: 0XXXX-XXXXXX
  return country.isValidNational(digits) ? digits : null;
}

/**
 * `tel:` link for a stored number: +<country code><national number> when it is
 * a valid number, else exactly the digits shown (with a leading + if written).
 */
export function phoneToTel(raw: string, region?: string | null): string {
  const national = nationalNumber(raw, region);
  if (national) return `tel:+${countryFor(region).code}${national}`;
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
}

/** "Mobile" or "Landline" for a valid number; null when it can't be told */
export function phoneKind(raw: string, region?: string | null): 'Mobile' | 'Landline' | null {
  const national = nationalNumber(raw, region);
  if (!national) return null;
  const mobile = isNepalRegion(region) ? /^9[78]\d{8}$/ : /^[6-9]\d{9}$/;
  return mobile.test(national) ? 'Mobile' : 'Landline';
}

/**
 * Numbers to offer in a "Call" picker: the valid ones, de-duplicated. If a
 * center has none that validate, its numbers with 8+ digits are offered as
 * written rather than hiding the center's only way to call.
 */
export function callableNumbers(mobile?: string, contact?: string, region?: string | null): string[] {
  const numbers = Array.from(
    new Set(
      [mobile, contact]
        .filter(Boolean)
        .flatMap((field) => field!.split(','))
        .map((num) => num.trim())
        .filter(Boolean)
    )
  );
  const valid = numbers.filter((num) => nationalNumber(num, region) !== null);
  if (valid.length > 0) return valid;
  return numbers.filter((num) => num.replace(/\D/g, '').length >= 8);
}

/** Google Maps directions to a center: by coordinates when known, else by address */
export function directionsUrl(coords: [string, string] | undefined | null, address: string): string {
  if (coords && coords[0] && coords[1]) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}
