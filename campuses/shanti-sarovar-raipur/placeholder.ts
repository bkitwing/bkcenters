/**
 * Placeholder artwork until the Strapi images arrive.
 * Returns an inline SVG data URI in the campus amber, labelled with `label`,
 * so components that need a real `src` (the galleries lightbox) still render.
 */

const TONES = [
  ['#f8d2ae', '#efa365'],
  ['#fae1c6', '#e2914f'],
  ['#f5c79c', '#d9853f'],
  ['#fcebd8', '#efa365'],
] as const;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Break a label into at most three short lines for the SVG. */
function wrap(label: string, max = 24): string[] {
  const words = label.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export function srpPlaceholderSrc(
  label: string,
  { width = 1200, height = 900, tone = 0 }: { width?: number; height?: number; tone?: number } = {}
): string {
  const [light, deep] = TONES[Math.abs(tone) % TONES.length];
  const lines = wrap(label);
  const lineHeight = Math.round(height * 0.07);
  const fontSize = Math.round(height * 0.055);
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const text = lines
    .map(
      (line, i) =>
        `<text x="50%" y="${startY + i * lineHeight}" text-anchor="middle" dominant-baseline="middle" font-family="Noto Sans, Arial, sans-serif" font-size="${fontSize}" font-weight="600" fill="#ffffff" fill-opacity="0.95">${escapeXml(line)}</text>`
    )
    .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${deep}"/></linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#g)"/>` +
    `<circle cx="${width * 0.82}" cy="${height * 0.2}" r="${height * 0.32}" fill="#ffffff" fill-opacity="0.12"/>` +
    text +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
