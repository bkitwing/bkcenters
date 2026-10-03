import { notoSans } from '@/lib/fonts';
import { CampusBodyScope } from './CampusBodyScope';
import { SpHeader } from './SpHeader';
import { RetreatCampusFooter } from '../_components/RetreatCampusFooter';
import { SP_CONTENT } from './content';
import { getSpHome } from './sp-home-data';
import {
  SP_ABOUT_HREF,
  SP_CONTACT_HREF,
  SP_COURSES_HREF,
  SP_GALLERIES_HREF,
  SP_HOME_HREF,
  SP_NEWS_HREF,
} from './nav';
import './sonipat-retreat-center.css';

/**
 * Campus micro-site shell (NMBA pattern): own header, scoped tokens, Noto Sans.
 * Root CentersChrome hides UnifiedHeader/Footer on these routes.
 */
export default async function SonipatRetreatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const home = await getSpHome();

  return (
    <div className={`sp-oasis ${notoSans.variable}`}>
      <CampusBodyScope />
      <SpHeader logoSrc={home.logo?.src} logoAlt={home.logo?.alt} />
      {children}
      <RetreatCampusFooter
        campusName="Sonipat Retreat Center"
        campusTagline="Brahma Kumaris · Sonipat, Haryana"
        campusBlurb="A peaceful campus for Rajyoga meditation, courses, retreats and quiet reflection."
        enquireHref={SP_CONTACT_HREF}
        socialLinks={SP_CONTENT.contactCta.socials.map((s) => ({
          label: s.label,
          href: s.href,
          icon: s.icon,
        }))}
        campusLinks={[
          { label: 'Home', href: SP_HOME_HREF },
          { label: 'About', href: SP_ABOUT_HREF },
          { label: 'Courses', href: SP_COURSES_HREF },
          { label: 'Galleries', href: SP_GALLERIES_HREF },
          { label: 'News', href: SP_NEWS_HREF },
          { label: 'Visit & Enquire', href: SP_CONTACT_HREF },
        ]}
      />
    </div>
  );
}
