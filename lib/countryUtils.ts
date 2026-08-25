/**
 * Country / region helpers for SEO and JSON-LD.
 * In the center locator, "region" is the top-level geography (India, Nepal).
 */

const COUNTRY_ISO: Record<string, string> = {
  INDIA: 'IN',
  NEPAL: 'NP',
};

/** ISO 3166-1 alpha-2 for schema.org addressCountry. */
export function toIsoCountryCode(
  countryOrRegion: string | null | undefined,
  fallback: string = 'IN'
): string {
  if (!countryOrRegion) return fallback;
  const key = countryOrRegion.toUpperCase().trim();
  if (COUNTRY_ISO[key]) return COUNTRY_ISO[key];
  if (key.startsWith('NEPAL')) return 'NP';
  if (key === 'IN' || key === 'NP') return key;
  return fallback;
}

/** Human country label for titles / descriptions (region ≈ country). */
export function countryLabelFromRegion(
  region: string | null | undefined,
  country?: string | null
): string {
  const raw = (country || region || '').trim();
  if (!raw) return '';
  if (raw.toUpperCase().startsWith('NEPAL')) return 'Nepal';
  if (raw.toUpperCase() === 'INDIA') return 'India';
  // Title-case unknown labels lightly
  return raw
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function isNepalRegion(region: string | null | undefined): boolean {
  return (region || '').toUpperCase().trim().startsWith('NEPAL');
}

/** UI label for Strapi "state" level (province in Nepal, state in India). */
export function stateLevelLabel(
  region: string | null | undefined,
  opts?: { plural?: boolean; short?: boolean }
): string {
  const plural = opts?.plural ?? false;
  if (isNepalRegion(region)) {
    return plural ? 'Provinces' : 'Province';
  }
  if (opts?.short) {
    return plural ? 'States & UTs' : 'State / UT';
  }
  return plural ? 'States' : 'State';
}

/**
 * UI label for Strapi "district" level.
 * Nepal PAD values are localities / towns, not admin districts.
 */
export function districtLevelLabel(
  region: string | null | undefined,
  opts?: { plural?: boolean }
): string {
  const plural = opts?.plural ?? false;
  if (isNepalRegion(region)) {
    return plural ? 'Localities' : 'Locality';
  }
  return plural ? 'Districts' : 'District';
}
