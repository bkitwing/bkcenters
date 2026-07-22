import { formatCenterUrl } from '@/lib/urlUtils';
import { SS_CENTER } from './content';

export const SS_HOME_HREF = '/shantisarovar';
export const SS_ABOUT_HREF = `${SS_HOME_HREF}#about`;
export const SS_GALLERIES_HREF = `${SS_HOME_HREF}/galleries`;
export const SS_NEWS_HREF = `${SS_HOME_HREF}/news`;
export const SS_EVENTS_HREF = `${SS_HOME_HREF}/events`;
export const SS_COURSES_HREF = `${SS_HOME_HREF}#courses`;
/** Canonical campus contact / visit / enquire URL (SS chrome). */
export const SS_CONTACT_HREF = `${SS_HOME_HREF}/contact`;

export const BK_ABOUT_HREF = 'https://www.brahmakumaris.com/about';

/** Directory center URL — redirects to SS contact for this campus. */
export const SS_DIRECTORY_HREF = formatCenterUrl(
  SS_CENTER.region,
  SS_CENTER.state,
  SS_CENTER.district,
  SS_CENTER.name
);

export const SS_CENTER_DETAIL_HREF = SS_CONTACT_HREF;

export type SsNavChild = {
  label: string;
  href: string;
  external?: boolean;
};

export type SsNavItem = {
  label: string;
  href: string;
  icon?: true;
  children?: readonly SsNavChild[];
};

/** Desktop / sheet primary nav — Contact stays as header CTA, not a nav item. */
export const SS_NAV: readonly SsNavItem[] = [
  { label: 'Home', href: SS_HOME_HREF, icon: true },
  {
    label: 'About',
    href: SS_ABOUT_HREF,
    children: [
      { label: 'About Shanti Sarovar', href: SS_ABOUT_HREF },
      { label: 'About Brahma Kumaris', href: BK_ABOUT_HREF, external: true },
    ],
  },
  { label: 'Courses Offered', href: SS_COURSES_HREF },
  { label: 'Galleries', href: SS_GALLERIES_HREF },
  { label: 'News', href: SS_NEWS_HREF },
  { label: 'Events', href: SS_EVENTS_HREF },
] as const;
