import { formatCenterUrl } from '@/lib/urlUtils';
import { JB_CENTER } from './content';

export const JB_HOME_HREF = '/jagdamba-bhawan';
/** Dedicated About page (campus walk). Home still keeps #about for the short intro. */
export const JB_ABOUT_HREF = `${JB_HOME_HREF}/about`;
/** Shareable deep-link into the Our Campus / walk section on About. */
export const JB_ABOUT_CAMPUS_HREF = `${JB_ABOUT_HREF}#campus`;
export const JB_COURSES_HREF = `${JB_HOME_HREF}#courses`;
export const JB_GALLERIES_HREF = `${JB_HOME_HREF}/galleries`;
export const JB_NEWS_HREF = `${JB_HOME_HREF}/news`;
export const JB_EVENTS_HREF = `${JB_HOME_HREF}/events`;
/** Canonical campus contact / visit / enquire URL (JB chrome). */
export const JB_CONTACT_HREF = `${JB_HOME_HREF}/contact`;

export const BK_ABOUT_HREF = 'https://www.brahmakumaris.com/about';

/** Directory center URL — redirects to JB contact for this campus. */
export const JB_DIRECTORY_HREF = formatCenterUrl(
  JB_CENTER.region,
  JB_CENTER.state,
  JB_CENTER.district,
  JB_CENTER.name
);

export const JB_CENTER_DETAIL_HREF = JB_CONTACT_HREF;

export type JbNavChild = {
  label: string;
  href: string;
  external?: boolean;
};

export type JbNavItem = {
  label: string;
  href: string;
  icon?: true;
  children?: readonly JbNavChild[];
};

/** Desktop / sheet primary nav — Contact stays as header CTA, not a nav item. */
export const JB_NAV: readonly JbNavItem[] = [
  { label: 'Home', href: JB_HOME_HREF, icon: true },
  {
    label: 'About',
    href: JB_ABOUT_HREF,
    children: [
      { label: 'About Jagdamba Bhawan', href: JB_ABOUT_HREF },
      { label: 'Walk the campus', href: JB_ABOUT_CAMPUS_HREF },
      { label: 'About Brahma Kumaris', href: BK_ABOUT_HREF, external: true },
    ],
  },
  { label: 'Courses Offered', href: JB_COURSES_HREF },
  { label: 'Galleries', href: JB_GALLERIES_HREF },
  { label: 'News', href: JB_NEWS_HREF },
  { label: 'Events', href: JB_EVENTS_HREF },
] as const;
