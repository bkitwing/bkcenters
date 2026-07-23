import { Noto_Sans } from 'next/font/google';
import { CampusBodyScope } from './CampusBodyScope';
import { JbHeader } from './JbHeader';
import { RetreatCampusFooter } from '../_components/RetreatCampusFooter';
import { JB_CONTENT } from './content';
import {
  JB_ABOUT_HREF,
  JB_CONTACT_HREF,
  JB_COURSES_HREF,
  JB_EVENTS_HREF,
  JB_GALLERIES_HREF,
  JB_HOME_HREF,
  JB_NEWS_HREF,
} from './nav';
import './jagdamba-bhawan.css';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-jb-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

/**
 * Campus micro-site shell (NMBA pattern): own header, scoped tokens, Noto Sans.
 * Root CentersChrome hides UnifiedHeader/Footer on these routes.
 */
export default function JagdambaBhawanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`jb-oasis ${notoSans.variable}`}>
      <CampusBodyScope />
      <JbHeader />
      {children}
      <RetreatCampusFooter
        campusName="Jagdamba Bhawan"
        campusTagline="Retreat Center · Pisoli, Pune"
        campusBlurb="A 3.5-acre Brahma Kumaris Retreat Center in honour of Mateshwari Jagdamba Saraswati (Mamma) — for Rajyoga, courses and quiet reflection."
        enquireHref={JB_CONTACT_HREF}
        socialLinks={JB_CONTENT.contactCta.socials.map((s) => ({
          label: s.label,
          href: s.href,
          icon: s.icon,
        }))}
        campusLinks={[
          { label: 'Home', href: JB_HOME_HREF },
          { label: 'About', href: JB_ABOUT_HREF },
          { label: 'Courses', href: JB_COURSES_HREF },
          { label: 'Galleries', href: JB_GALLERIES_HREF },
          { label: 'News', href: JB_NEWS_HREF },
          { label: 'Events', href: JB_EVENTS_HREF },
          { label: 'Visit & Enquire', href: JB_CONTACT_HREF },
        ]}
      />
    </div>
  );
}
