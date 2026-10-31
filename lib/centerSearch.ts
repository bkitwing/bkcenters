import { Center } from './types';
import { formatCenterUrl } from './urlUtils';

/**
 * Center name search for the search box ("Sampangirama Nagar", "Om Shanti Retreat",
 * or a 6-digit pincode). Runs over the in-memory center index.
 */

export type CenterSuggestion = {
  name: string;
  branch_code: string;
  url: string;
  /** "Bengaluru, Karnataka" */
  area: string;
  /**
   * True when the query matched the distinctive part of the name, not just the
   * city it starts with ("Sampangirama" vs "Bengaluru"). The search box lists
   * centers above places only for strong matches.
   */
  strong: boolean;
};

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function searchCentersByText(centers: Center[], query: string, limit = 6): CenterSuggestion[] {
  const q = normalizeText(query);
  if (q.length < 2) return [];
  const tokens = q.split(' ');
  const isPincode = /^\d{6}$/.test(q);

  const scored: { center: Center; score: number; strong: boolean }[] = [];

  for (const center of centers) {
    if (!center.name) continue;

    if (isPincode) {
      if ((center.address?.pincode || '').replace(/\D/g, '') === q) {
        scored.push({ center, score: 1, strong: true });
      }
      continue;
    }

    const name = normalizeText(center.name);
    const nameWords = name.split(' ');
    const placeWords = new Set(
      normalizeText(`${center.district} ${center.state} ${center.address?.city || ''}`).split(' ')
    );

    // Every token must start a word of the name (or of the center's city/district/state)
    let score = 0;
    let strong = false;
    let matched = true;
    for (const token of tokens) {
      const wordIndex = nameWords.findIndex((word) => word.startsWith(token));
      if (wordIndex >= 0) {
        score += wordIndex === 0 ? 3 : 2;
        if (!placeWords.has(nameWords[wordIndex])) strong = true;
        continue;
      }
      if (Array.from(placeWords).some((word) => word.startsWith(token))) {
        score += 1;
        continue;
      }
      matched = false;
      break;
    }
    if (!matched || score === 0) continue;
    if (name.includes(q)) score += 3; // the words appear together, in order

    scored.push({ center, score, strong });
  }

  scored.sort(
    (a, b) =>
      Number(b.strong) - Number(a.strong) ||
      b.score - a.score ||
      a.center.name.length - b.center.name.length ||
      a.center.name.localeCompare(b.center.name)
  );

  return scored.slice(0, limit).map(({ center, strong }) => ({
    name: center.name,
    branch_code: center.branch_code,
    url: formatCenterUrl(center.region || 'INDIA', center.state, center.district, center.name),
    area: [center.address?.city || center.district, center.state]
      .filter((part, i, parts) => part && parts.indexOf(part) === i)
      .join(', '),
    strong,
  }));
}
