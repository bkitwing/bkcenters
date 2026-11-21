export const SRP_HOME_HREF = '/shanti-sarovar-raipur';
export const SRP_ABOUT_HREF = `${SRP_HOME_HREF}#about`;
export const SRP_SERVICES_HREF = `${SRP_HOME_HREF}#services`;
export const SRP_GALLERIES_HREF = `${SRP_HOME_HREF}/galleries`;
export const SRP_NEWS_HREF = `${SRP_HOME_HREF}/news`;
export const SRP_CONTACT_HREF = `${SRP_HOME_HREF}/contact`;
/** "Free 7-day Rajyoga" section on the contact page. */
export const SRP_COURSE_HREF = `${SRP_CONTACT_HREF}#srp-course`;

export const BK_ABOUT_HREF = 'https://www.brahmakumaris.com/about';

export type SrpNavChild = {
  label: string;
  href: string;
  external?: boolean;
};

export type SrpNavItem = {
  label: string;
  href: string;
  icon?: true;
  children?: readonly SrpNavChild[];
};

/** Desktop / sheet primary nav — Contact stays the header button. */
export const SRP_NAV: readonly SrpNavItem[] = [
  { label: 'Home', href: SRP_HOME_HREF, icon: true },
  {
    label: 'About',
    href: SRP_ABOUT_HREF,
    children: [
      { label: 'About Shanti Sarovar', href: SRP_ABOUT_HREF },
      { label: 'About Brahma Kumaris', href: BK_ABOUT_HREF, external: true },
    ],
  },
  { label: 'Gallery', href: SRP_GALLERIES_HREF },
  { label: 'News', href: SRP_NEWS_HREF },
] as const;
