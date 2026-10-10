export const SHK_HOME_HREF = '/shanti-shikhar';
export const SHK_ABOUT_HREF = `${SHK_HOME_HREF}#about`;
export const SHK_FACILITIES_HREF = `${SHK_HOME_HREF}#facilities`;
export const SHK_SERVICES_HREF = `${SHK_HOME_HREF}#courses`;
export const SHK_GALLERIES_HREF = `${SHK_HOME_HREF}/galleries`;
export const SHK_NEWS_HREF = `${SHK_HOME_HREF}/news`;
export const SHK_COURSES_HREF = `${SHK_HOME_HREF}#courses`;
export const SHK_CONTACT_HREF = `${SHK_HOME_HREF}/contact`;

export const BK_ABOUT_HREF = 'https://www.brahmakumaris.com/about';

export type ShkNavChild = {
  label: string;
  href: string;
  external?: boolean;
};

export type ShkNavItem = {
  label: string;
  href: string;
  icon?: true;
  children?: readonly ShkNavChild[];
};

/** Desktop / sheet primary nav — Contact stays the header button. */
export const SHK_NAV: readonly ShkNavItem[] = [
  { label: 'Home', href: SHK_HOME_HREF, icon: true },
  {
    label: 'About',
    href: SHK_ABOUT_HREF,
    children: [
      { label: 'About Shanti Shikhar', href: SHK_ABOUT_HREF },
      { label: 'Facilities', href: SHK_FACILITIES_HREF },
      { label: 'Services', href: SHK_SERVICES_HREF },
      { label: 'About Brahma Kumaris', href: BK_ABOUT_HREF, external: true },
    ],
  },
  { label: 'Courses Offered', href: SHK_COURSES_HREF },
  { label: 'Galleries', href: SHK_GALLERIES_HREF },
  { label: 'News', href: SHK_NEWS_HREF },
] as const;
