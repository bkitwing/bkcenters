import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getCampus,
  type CampusPageKey,
} from './registry';

type CampusPageModule = {
  default: React.ComponentType;
  generateMetadata?: () => Promise<Metadata> | Metadata;
  revalidate?: number;
};

type CampusLayoutModule = {
  default: React.ComponentType<{ children: React.ReactNode }>;
};

const PAGE_LOADERS: Record<
  string,
  Record<CampusPageKey, () => Promise<CampusPageModule>>
> = {
  shantisarovar: {
    home: () => import('@/campuses/shantisarovar/routes/HomePage'),
    contact: () => import('@/campuses/shantisarovar/routes/ContactPage'),
    news: () => import('@/campuses/shantisarovar/routes/NewsPage'),
    events: () => import('@/campuses/shantisarovar/routes/EventsPage'),
    galleries: () => import('@/campuses/shantisarovar/routes/GalleriesPage'),
  },
};

const LAYOUT_LOADERS: Record<string, () => Promise<CampusLayoutModule>> = {
  shantisarovar: () => import('@/campuses/shantisarovar/CampusLayout'),
};

export async function loadCampusLayout(slug: string) {
  if (!getCampus(slug)) notFound();
  const loader = LAYOUT_LOADERS[slug];
  if (!loader) notFound();
  return loader();
}

export async function loadCampusPage(slug: string, page: CampusPageKey) {
  if (!getCampus(slug)) notFound();
  const pages = PAGE_LOADERS[slug];
  const loader = pages?.[page];
  if (!loader) notFound();
  return loader();
}

export async function campusPageMetadata(
  slug: string,
  page: CampusPageKey
): Promise<Metadata> {
  const mod = await loadCampusPage(slug, page);
  if (mod.generateMetadata) return mod.generateMetadata();
  return {};
}
