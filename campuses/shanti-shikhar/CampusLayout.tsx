import { notoSans } from '@/lib/fonts';
import { RetreatCampusFooter } from '../_components/RetreatCampusFooter';
import { CampusBodyScope } from './CampusBodyScope';
import { SHK_YOUTUBE_HREF } from './content';
import { getShkLogo } from './logo-data';
import { ShkHeader } from './ShkHeader';
import {
  SHK_ABOUT_HREF,
  SHK_CONTACT_HREF,
  SHK_SERVICES_HREF,
  SHK_GALLERIES_HREF,
  SHK_HOME_HREF,
  SHK_NEWS_HREF,
} from './nav';
import './shanti-shikhar.css';

export default async function ShantiShikharLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logo = await getShkLogo();

  return (
    <div className={`shk-oasis ${notoSans.variable}`}>
      <CampusBodyScope />
      <ShkHeader logoSrc={logo?.src} logoAlt={logo?.alt} />
      {children}
      <RetreatCampusFooter
        campusName="Shanti Shikhar"
        campusTagline="Brahma Kumaris · Nava Raipur, Chhattisgarh"
        campusBlurb="An Academy for a New Peaceful World — the Brahma Kumaris retreat centre in Nava Raipur, Atal Nagar."
        enquireHref={SHK_CONTACT_HREF}
        socialLinks={[
          {
            label: 'YouTube',
            href: SHK_YOUTUBE_HREF,
            icon: 'youtube',
          },
        ]}
        campusLinks={[
          { label: 'Home', href: SHK_HOME_HREF },
          { label: 'About', href: SHK_ABOUT_HREF },
          { label: 'Services', href: SHK_SERVICES_HREF },
          { label: 'Galleries', href: SHK_GALLERIES_HREF },
          { label: 'News', href: SHK_NEWS_HREF },
          { label: 'Visit & Enquire', href: SHK_CONTACT_HREF },
        ]}
      />
    </div>
  );
}
