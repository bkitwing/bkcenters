/**
 * Shared, SEO-focused content helpers for center detail pages.
 *
 * Goals:
 *  - Provide standard class timings (with optional per-center override from Strapi).
 *  - Generate UNIQUE, localized text per center so 5,600+ pages are not treated as
 *    thin/duplicate content (each page weaves in city/district/state + nearby areas).
 *  - Keep the visible page, the JSON-LD schema, and the FAQ aligned via one source.
 */

import { Center } from './types';

// Human-readable default timings (shown on the page and in FAQ answers).
export const DEFAULT_TIMINGS = {
  morning: '7:00 – 9:00 AM',
  evening: '5:00 – 8:00 PM',
};

/** Respectful note shown under class timings on every center detail page. */
export const TIMING_CONFIRM_NOTE =
  'Timings may vary — kindly call to confirm before you visit.';

/** Short location line for hero (city, district, state) — full street address lives in Center Details only. */
export function getShortLocationLine(
  center: Pick<Center, 'address' | 'district' | 'state'>
): string {
  const city = getLocalityLabel(center);
  const district = titleCase(center.district);
  const state = titleCase(center.state);
  const parts: string[] = [];
  if (city) parts.push(city);
  if (district && district.toLowerCase() !== city.toLowerCase()) parts.push(district);
  if (state && state.toLowerCase() !== district.toLowerCase()) parts.push(state);
  return parts.join(', ');
}

// Machine-readable opening hours for schema.org openingHoursSpecification (24h, IST).
export const OPENING_HOURS_SPEC = [
  { opens: '07:00', closes: '09:00', label: 'Morning Session' },
  { opens: '17:00', closes: '20:00', label: 'Evening Session' },
];

/**
 * Returns the timings to display. If the center has a custom `timings` string
 * (from Strapi), that is used as an override; otherwise the standard defaults.
 */
export function getCenterTimings(center: Pick<Center, 'timings'>): {
  morning: string;
  evening: string;
  custom?: string;
} {
  const custom = (center.timings || '').trim();
  if (custom) {
    return { morning: DEFAULT_TIMINGS.morning, evening: DEFAULT_TIMINGS.evening, custom };
  }
  return { morning: DEFAULT_TIMINGS.morning, evening: DEFAULT_TIMINGS.evening };
}

// Title-case a possibly ALL-CAPS / lower-case place name for natural reading.
function titleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
    .trim();
}

/** Best human-readable locality label for the center (city falls back to district). */
export function getLocalityLabel(center: Pick<Center, 'address' | 'district'>): string {
  return titleCase(center.address?.city || center.district || '');
}

/** First available phone number (mobile preferred) for "call to confirm" copy. */
function firstPhone(center: Pick<Center, 'contact' | 'mobile'>): string {
  const raw = center.mobile || center.contact || '';
  const first = raw.split(/[,\/|;]/)[0]?.trim();
  return first || '';
}

/**
 * Unique, localized description for JSON-LD and meta (not shown as a visible paragraph).
 * Weaves in city/district/state + nearby areas so each of 5,600+ pages has differentiated text.
 */
export function generateCenterIntro(
  center: Center,
  nearbyLocalities: string[] = []
): string {
  const name = titleCase(center.name);
  const city = getLocalityLabel(center);
  const district = titleCase(center.district);
  const state = titleCase(center.state);

  const placeParts: string[] = [];
  if (city) placeParts.push(city);
  if (district && district.toLowerCase() !== city.toLowerCase()) placeParts.push(`${district} district`);
  if (state && state.toLowerCase() !== district.toLowerCase()) placeParts.push(state);
  const placeClause = placeParts.join(', ');

  const uniqueNearby = Array.from(
    new Set(
      nearbyLocalities
        .map((n) => titleCase(n))
        .filter((n) => n && n.toLowerCase() !== city.toLowerCase())
    )
  ).slice(0, 3);

  if (city && uniqueNearby.length > 0) {
    return `Brahma Kumaris ${name} offers a free 7-day Rajyoga meditation course and daily classes${placeClause ? ` in ${placeClause}` : ''}, open to everyone. Visitors from ${city} and nearby areas such as ${uniqueNearby.join(', ')} are warmly welcome.`;
  }

  return `Brahma Kumaris ${name} offers a free 7-day Rajyoga meditation course and daily meditation classes${placeClause ? ` in ${placeClause}` : ''}. All are welcome — whether you are new to meditation or continuing your spiritual journey.`;
}

/**
 * Localized FAQ entries (plain text) used BOTH for the FAQPage JSON-LD and the
 * visible FAQ. Localizing these de-duplicates the FAQ block across centers and
 * targets high-intent queries like "learn meditation in <city>" / "timings".
 */
export function getLocalizedFaqs(
  center: Center
): { question: string; answer: string }[] {
  const name = titleCase(center.name);
  const locality = getLocalityLabel(center) || titleCase(center.district) || titleCase(center.state);
  const phone = firstPhone(center);
  const callClause = phone ? ` Call ${phone} to confirm before visiting.` : ' Please call the center to confirm before visiting.';

  return [
    {
      question: `Where can I learn meditation in ${locality}?`,
      answer: `You can learn Rajyoga meditation for free at Brahma Kumaris ${name} in ${locality}. The center offers a free 7-day course and daily morning and evening classes, open to everyone.${callClause}`,
    },
    {
      question: `What are the class timings at ${name}?`,
      answer: `Morning classes are typically ${DEFAULT_TIMINGS.morning}; evening classes ${DEFAULT_TIMINGS.evening}. ${TIMING_CONFIRM_NOTE}`,
    },
    {
      question: `Is the 7-day meditation course really free at ${name}?`,
      answer: `Yes. The 7-day Rajyoga meditation course and all classes and services at Brahma Kumaris ${name} are offered completely free of charge. There are no fees, and no prior experience is required.`,
    },
  ];
}
