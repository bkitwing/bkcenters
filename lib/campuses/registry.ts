/**
 * Campus micro-site registry.
 *
 * URL shape: /centers/<slug> (basePath=/centers → app/<slug>).
 * Why not app/(campus)/[slug]? It conflicts with app/[region] at the same
 * dynamic segment level. Static app/<slug> routes win over [region] and
 * scale by adding a thin wrapper folder + registry entry per campus.
 */

export type CampusPageKey =
  | 'home'
  | 'contact'
  | 'news'
  | 'events'
  | 'galleries'
  | 'about'
  | 'csr';

export type CampusDefinition = {
  slug: string;
  name: string;
  /** Absolute site origin path without basePath, e.g. /shantisarovar */
  basePath: string;
  /** Full public canonical origin + path, no trailing slash */
  canonical: string;
  branchCode: string;
};

/** Reserved — never register a campus with these slugs. */
export const RESERVED_TOP_LEVEL_SLUGS = new Set([
  'api',
  'admin',
  'retreat',
  'privacy-policy',
  'terms-and-conditions',
  'icon.svg',
]);

export const CAMPUS_REGISTRY: Record<string, CampusDefinition> = {
  shantisarovar: {
    slug: 'shantisarovar',
    name: 'Shanti Sarovar',
    basePath: '/shantisarovar',
    canonical: 'https://www.brahmakumaris.com/centers/shantisarovar',
    branchCode: '02284',
  },
  'jagdamba-bhawan': {
    slug: 'jagdamba-bhawan',
    name: 'Jagdamba Bhawan Retreat Center',
    basePath: '/jagdamba-bhawan',
    canonical: 'https://www.brahmakumaris.com/centers/jagdamba-bhawan',
    branchCode: '04543',
  },
};

/** When adding a campus, also update lib/campuses/sitemap-data.js for sitemap generation. */

export function listCampusSlugs(): string[] {
  return Object.keys(CAMPUS_REGISTRY);
}

export function getCampus(slug: string): CampusDefinition | null {
  return CAMPUS_REGISTRY[slug] ?? null;
}

export function isCampusSlug(slug: string | undefined | null): boolean {
  return Boolean(slug && CAMPUS_REGISTRY[slug]);
}

/** Pathname without basePath, e.g. /shantisarovar/news */
export function isCampusPathname(pathname: string): boolean {
  const seg = pathname.split('/').filter(Boolean)[0];
  return isCampusSlug(seg);
}

/** branch_code → campus contact path (basePath-relative). */
export function exclusiveCampusContactByBranch(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const campus of Object.values(CAMPUS_REGISTRY)) {
    map[campus.branchCode] = `${campus.basePath}/contact`;
  }
  return map;
}
