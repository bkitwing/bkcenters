import { isNepalRegion } from './countryUtils';

/**
 * Phone numbers as stored in Strapi come in many shapes:
 *   India: "9371394775", "08562-245600" (landline with trunk 0), "+91 …"
 *   Nepal: "9803130188", "00977-4989957", "0977-9847510925", "+977-9841170797",
 *          "14262330", and Indian mobiles listed by centers near the border
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
  // Mobiles: 96/97/98 + 8 digits. Landlines: area code + number = 8 digits
  isValidNational: (n) => /^9[6-8]\d{8}$/.test(n) || /^[1-9]\d{7}$/.test(n),
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

  // Country code after a single 0 ("0977-9847510925"). Always longer than a
  // number written with a trunk 0, so the two readings can't both be complete.
  if (digits.startsWith(`0${country.code}`)) {
    const afterZero = withCode(digits.slice(1));
    if (afterZero) return afterZero;
  }

  // Written with the country code but no "+" (e.g. 919876543210)
  const fromCode = withCode(digits);
  if (fromCode && digits.length > 10) return fromCode;

  if (digits.startsWith('0')) digits = digits.slice(1); // trunk 0 of landlines: 0XXXX-XXXXXX
  return country.isValidNational(digits) ? digits : null;
}

/**
 * The numbers in a stored phone field, in order. Centers often write the STD
 * code once for several landlines of one exchange — "079-23290533, 23294850" —
 * so a bare number after an STD-coded one is given that code ("079-23294850"),
 * but only when it has exactly as many digits as the number the code was
 * written with, which makes it a complete number of the same exchange.
 */
export function splitPhoneField(field?: string | null, region?: string | null): string[] {
  let std: { code: string; digits: number } | null = null;
  return (field || '')
    .split(',')
    .map((num) => num.trim())
    .filter(Boolean)
    .map((num) => {
      const written = num.match(/^\(?0(\d{1,4})\)?[\s-]+(\d+)$/); // "0755- 2463838", "(011) 22453293"
      if (written && nationalNumber(num, region)) {
        std = { code: written[1], digits: written[2].length };
        return num;
      }
      if (std && /^[1-9]\d+$/.test(num) && num.length === std.digits) {
        const full = `0${std.code}-${num}`;
        if (nationalNumber(full, region)) return full;
      }
      return num;
    });
}

/**
 * The number in international form (+<country code><national number>) when
 * `raw` is a complete, valid number; otherwise null.
 */
export function internationalNumber(raw: string, region?: string | null): string | null {
  const national = nationalNumber(raw, region);
  if (national) return `+${countryFor(region).code}${national}`;

  // Nepal centers near the border sometimes list an Indian mobile ("7461820328 (IND)"):
  // 10 digits starting 6–9, but not 96–98, which are Nepali mobiles
  const digits = raw.replace(/\D/g, '');
  if (isNepalRegion(region) && !raw.trim().startsWith('+') && /^[6-9]\d{9}$/.test(digits) && !/^9[6-8]/.test(digits)) {
    return `+91${digits}`;
  }
  return null;
}

/**
 * `tel:` link for a stored number: its international form when it is a valid
 * number, else exactly the digits shown (with a leading + if written).
 */
export function phoneToTel(raw: string, region?: string | null): string {
  const international = internationalNumber(raw, region);
  if (international) return `tel:${international}`;
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
}

/** "Mobile" or "Landline" for a valid number; null when it can't be told */
export function phoneKind(raw: string, region?: string | null): 'Mobile' | 'Landline' | null {
  const international = internationalNumber(raw, region);
  if (!international) return null;
  return /^\+(91[6-9]\d{9}|9779[6-8]\d{8})$/.test(international) ? 'Mobile' : 'Landline';
}

/**
 * Numbers to offer in a "Call" picker: the valid ones, de-duplicated. If a
 * center has none that validate, its numbers with 8+ digits are offered as
 * written rather than hiding the center's only way to call.
 */
export function callableNumbers(mobile?: string, contact?: string, region?: string | null): string[] {
  const numbers = Array.from(
    new Set([mobile, contact].flatMap((field) => splitPhoneField(field, region)))
  );
  const valid = numbers.filter((num) => internationalNumber(num, region) !== null);
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
