import localFont from 'next/font/local';

/**
 * Single self-hosted Noto Sans (aligned with other BK repos).
 * No Google Fonts at build or runtime — Cloudflare caches `/_next/static/media/*`.
 */
export const notoSans = localFont({
  src: '../assets/fonts/noto-sans-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-noto-sans',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});
