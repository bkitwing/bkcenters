import { Noto_Sans } from 'next/font/google';
import { CampusBodyScope } from './CampusBodyScope';
import { SsHeader } from './SsHeader';
import { RetreatCampusFooter } from '../_components/RetreatCampusFooter';
import { SS_CONTENT } from './content';
import {
  SS_ABOUT_HREF,
  SS_CONTACT_HREF,
  SS_COURSES_HREF,
  SS_CSR_HREF,
  SS_EVENTS_HREF,
  SS_GALLERIES_HREF,
  SS_HOME_HREF,
  SS_NEWS_HREF,
} from './nav';
import './shantisarovar.css';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-ss-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

/**
 * Campus micro-site shell (NMBA pattern): own header, scoped tokens, Noto Sans.
 * Root CentersChrome hides UnifiedHeader/Footer on these routes.
 */
export default function ShantiSarovarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`ss-oasis ${notoSans.variable}`}>
      <CampusBodyScope />
      <SsHeader />
      {children}
      <RetreatCampusFooter
        campusName="Shanti Sarovar"
        campusTagline="Academy for a Better World · Gachibowli, Hyderabad"
        campusBlurb="A 34-acre Brahma Kumaris retreat campus for Rajyoga, values courses and quiet reflection."
        enquireHref={SS_CONTACT_HREF}
        socialLinks={SS_CONTENT.contactCta.socials.map((s) => ({
          label: s.label,
          href: s.href,
          icon: s.icon,
        }))}
        campusLinks={[
          { label: 'Home', href: SS_HOME_HREF },
          { label: 'About', href: SS_ABOUT_HREF },
          { label: 'Courses', href: SS_COURSES_HREF },
          { label: 'CSR', href: SS_CSR_HREF },
          { label: 'Galleries', href: SS_GALLERIES_HREF },
          { label: 'News', href: SS_NEWS_HREF },
          { label: 'Events', href: SS_EVENTS_HREF },
          { label: 'Visit & Enquire', href: SS_CONTACT_HREF },
        ]}
      />
    </div>
  );
}
