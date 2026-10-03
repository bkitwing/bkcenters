import { formatCenterUrl } from '@/lib/urlUtils';
import { SP_CENTER } from './content';

export const SP_HOME_HREF = '/sonipat-retreat-center';
/** Dedicated About page. Home keeps a short #about intro. */
export const SP_ABOUT_HREF = `${SP_HOME_HREF}/about`;
export const SP_ABOUT_CAMPUS_HREF = `${SP_ABOUT_HREF}#campus`;
export const SP_ABOUT_FACULTY_HREF = `${SP_ABOUT_HREF}#faculty`;
export const SP_GALLERIES_HREF = `${SP_HOME_HREF}/galleries`;
export const SP_NEWS_HREF = `${SP_HOME_HREF}/news`;
export const SP_COURSES_HREF = `${SP_HOME_HREF}#courses`;
/** Canonical campus contact / visit / enquire URL. */
export const SP_CONTACT_HREF = `${SP_HOME_HREF}/contact`;

export const BK_ABOUT_HREF = 'https://www.brahmakumaris.com/about';

/** Directory center URL — redirects to this campus contact page. */
export const SP_DIRECTORY_HREF = formatCenterUrl(
  SP_CENTER.region,
  SP_CENTER.state,
  SP_CENTER.district,
  SP_CENTER.name
);

export const SP_CENTER_DETAIL_HREF = SP_CONTACT_HREF;

export type SpNavChild = {
  label: string;
  href: string;
  external?: boolean;
};

export type SpNavItem = {
  label: string;
  href: string;
  icon?: true;
  children?: readonly SpNavChild[];
};

/** Desktop / sheet primary nav — Contact stays as the header CTA. */
export const SP_NAV: readonly SpNavItem[] = [
  { label: 'Home', href: SP_HOME_HREF, icon: true },
  {
    label: 'About',
    href: SP_ABOUT_HREF,
    children: [
      { label: 'About Sonipat Retreat Center', href: SP_ABOUT_HREF },
      { label: 'Our campus', href: SP_ABOUT_CAMPUS_HREF },
      { label: 'Esteemed faculty', href: SP_ABOUT_FACULTY_HREF },
      { label: 'About Brahma Kumaris', href: BK_ABOUT_HREF, external: true },
    ],
  },
  { label: 'Courses Offered', href: SP_COURSES_HREF },
  { label: 'Galleries', href: SP_GALLERIES_HREF },
  { label: 'News', href: SP_NEWS_HREF },
] as const;
