import { headers } from 'next/headers';

const getBaseUrl = () => {
  const isLocal = process.env.IS_LOCAL === "true";
  const isDev = process.env.NODE_ENV === "development";
  
  if (isLocal || isDev) {
    // For local development, use port 5400 with no base path
    return 'http://localhost:5400';
  }
  
  // For production, use the full production URL with base path
  return 'https://www.brahmakumaris.com/centers';
};

export function getAbsoluteUrl(path: string = '') {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${path}`;
}

interface OgImageParams {
  title: string;
  description: string;
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
  description,
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
  params.append('description', cleanDescription);
  params.append('type', type);

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