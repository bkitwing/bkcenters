import { headers } from 'next/headers';

const getBaseUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return 'http://localhost:5400/centers';
  }
  return 'https://www.brahmakumaris.com/centers';
};

export function getAbsoluteUrl(path: string = '') {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${path}`;
}

interface OgImageParams {
  title: string;
  /** Older free-text line; prefer subtitle + stats */
  description?: string;
  /** Small label above the title, e.g. "Rajyoga meditation centers in" */
  eyebrow?: string;
  /** Location line under the title, e.g. "Gujarat, India" */
  subtitle?: string;
  /** Big numbers, e.g. [{ value: 469, label: 'centers' }, { value: 31, label: 'districts' }] */
  stats?: { value: string | number; label: string }[];
  type: 'region' | 'center' | 'state' | 'district' | 'home' | 'retreat' | 'search' | 'current-location';
  location?: string;
  centerCount?: string | number;
  district?: string;
  state?: string;
  region?: string;
}

// Function to decode URL-encoded strings
function decodeParam(param: string): string {
  return decodeURIComponent(param.replace(/%20/g, ' '));
}

export function generateOgImageUrl({
  title,
  description = '',
  eyebrow,
  subtitle,
  stats,
  type = 'center',
  location,
  centerCount,
  district,
  state,
  region,
}: OgImageParams) {
  const baseUrl = getBaseUrl();
  
  // Clean and format the title
  const cleanTitle = decodeParam(title);
  
  // Format the description based on type
  let cleanDescription = decodeParam(description);
  if (!cleanDescription.includes('Rajyog')) {
    cleanDescription = cleanDescription.replace('Meditation Center', 'Rajyog Meditation Center');
  }

  const params = new URLSearchParams();
  params.append('title', cleanTitle);
  if (cleanDescription) params.append('description', cleanDescription);
  params.append('type', type);
  if (eyebrow) params.append('eyebrow', eyebrow);
  if (subtitle) params.append('subtitle', decodeParam(subtitle));
  if (stats && stats.length > 0) {
    const fmt = (v: string | number) => (typeof v === 'number' ? v.toLocaleString('en-US') : v);
    params.append('stats', stats.map((s) => `${fmt(s.value)}:${s.label}`).join('|'));
  }

  if (location) {
    params.append('location', decodeParam(location));
  }

  if (centerCount) {
    params.append('centerCount', centerCount.toString());
  }

  if (district) {
    params.append('district', decodeParam(district));
  }

  if (state) {
    params.append('state', decodeParam(state));
  }

  if (region) {
    params.append('region', decodeParam(region));
  }
  
  return `${baseUrl}/api/og?${params.toString()}`;
}

export function getMetadataBase() {
  return new URL(getBaseUrl());
} 