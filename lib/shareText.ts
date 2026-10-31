import type { Center } from './types';
import { callableNumbers } from './phone';

const LOCATOR_URL = 'https://www.brahmakumaris.com/centers';
const GENERAL_EMAIL = 'contact@brahmakumaris.com';

/** Street address, city and state, with the pincode at the end */
export function shareAddress(center: Pick<Center, 'address' | 'state'>): string {
  const { line1, line2, line3, city, pincode } = center.address || {};
  const parts = [line1, line2, line3, city, center.state]
    .map((part) => part?.trim())
    .filter(Boolean);
  return `${parts.join(', ')}${pincode ? ` - ${pincode}` : ''}`;
}

/**
 * Share messages are plain text with a few emoji, readable when pasted into
 * WhatsApp, SMS, email or anything else. Links sit on their own lines so every
 * app makes them tappable. Blocks are separated by one blank line.
 */
function buildMessage(intro: string[], details: string[], pageUrl: string, email = GENERAL_EMAIL): string {
  const blocks: string[][] = [
    ['🙏 Om Shanti'],
    intro,
    details,
    ['🔗 For more details, please click below:', pageUrl],
    ['🗺️ To find other nearby centers:', LOCATOR_URL],
    ['✉️ For any queries, contact:', email],
  ];
  return blocks
    .filter((block) => block.length > 0)
    .map((block) => block.join('\n'))
    .join('\n\n');
}

/** The message people send when they share a center */
export function centerShareMessage(center: Center, pageUrl: string): string {
  const address = shareAddress(center);
  const phones = callableNumbers(center.mobile, center.contact, center.region);
  return buildMessage(
    [`🧘 ${center.name}`, 'Brahma Kumaris Rajyoga Meditation Center'],
    [
      ...(address ? [`📍 ${address}`] : []),
      ...(phones.length > 0 ? [`📞 ${phones.join(', ')}`] : []),
    ],
    pageUrl,
    center.email?.includes('@') ? center.email.trim() : GENERAL_EMAIL
  );
}

/**
 * The message for a city, state or country page, e.g.
 *   place "Mehsana, Gujarat", summary "20 centers"
 */
export function placeShareMessage(place: string, summary: string, pageUrl: string): string {
  return buildMessage(
    [`🧘 Brahma Kumaris Rajyoga Meditation Centers in ${place}`, `✨ ${summary} · all classes free`],
    [],
    pageUrl
  );
}

/** This page's address without ?query or #hash (filters, scroll position) */
export function currentPageUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}
