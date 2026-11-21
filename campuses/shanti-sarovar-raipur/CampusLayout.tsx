import { notoSans } from '@/lib/fonts';
import { RetreatCampusFooter } from '../_components/RetreatCampusFooter';
import { CampusBodyScope } from './CampusBodyScope';
import { SRP_YOUTUBE_HREF } from './content';
import { getSrpLogo } from './logo-data';
import { SrpHeader } from './SrpHeader';
import {
  SRP_ABOUT_HREF,
  SRP_CONTACT_HREF,
  SRP_SERVICES_HREF,
  SRP_GALLERIES_HREF,
  SRP_HOME_HREF,
  SRP_NEWS_HREF,
} from './nav';
import './shanti-sarovar-raipur.css';

export default async function ShantiSarovarRaipurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logo = await getSrpLogo();

  return (
    <div className={`srp-oasis ${notoSans.variable}`}>
      <CampusBodyScope />
      <SrpHeader logoSrc={logo?.src} logoAlt={logo?.alt} />
      {children}
      <RetreatCampusFooter
        campusName="Shanti Sarovar"
        campusTagline="Brahma Kumaris · Raipur, Chhattisgarh"
        campusBlurb="The Brahma Kumaris spiritual retreat centre on Vidhan Sabha Marg, Raipur — for retreats, value education and Rajyoga meditation."
        enquireHref={SRP_CONTACT_HREF}
        socialLinks={[
          {
            label: 'YouTube',
            href: SRP_YOUTUBE_HREF,
            icon: 'youtube',
          },
        ]}
        campusLinks={[
          { label: 'Home', href: SRP_HOME_HREF },
          { label: 'About', href: SRP_ABOUT_HREF },
          { label: 'Services', href: SRP_SERVICES_HREF },
          { label: 'Galleries', href: SRP_GALLERIES_HREF },
          { label: 'News', href: SRP_NEWS_HREF },
          { label: 'Visit & Enquire', href: SRP_CONTACT_HREF },
        ]}
      />
    </div>
  );
}
