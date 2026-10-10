import { notoSans } from '@/lib/fonts';
import { RetreatCampusFooter } from '../_components/RetreatCampusFooter';
import { CampusBodyScope } from './CampusBodyScope';
import { SHK_CONTENT } from './content';
import { ShkHeader } from './ShkHeader';
import {
  SHK_ABOUT_HREF,
  SHK_CONTACT_HREF,
  SHK_COURSES_HREF,
  SHK_GALLERIES_HREF,
  SHK_HOME_HREF,
  SHK_NEWS_HREF,
} from './nav';
import './shanti-shikhar.css';

export default function ShantiShikharLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`shk-oasis ${notoSans.variable}`}>
      <CampusBodyScope />
      <ShkHeader />
      {children}
      <RetreatCampusFooter
        campusName="Shanti Shikhar"
        campusTagline="Brahma Kumaris · Nava Raipur, Chhattisgarh"
        campusBlurb="An Academy for a New Peaceful World — the Brahma Kumaris retreat centre in Nava Raipur, Atal Nagar."
        enquireHref={SHK_CONTACT_HREF}
        socialLinks={[
          {
            label: 'Inauguration on YouTube',
            href: SHK_CONTENT.inauguration.href,
            icon: 'youtube',
          },
        ]}
        campusLinks={[
          { label: 'Home', href: SHK_HOME_HREF },
          { label: 'About', href: SHK_ABOUT_HREF },
          { label: 'Courses', href: SHK_COURSES_HREF },
          { label: 'Galleries', href: SHK_GALLERIES_HREF },
          { label: 'News', href: SHK_NEWS_HREF },
          { label: 'Visit & Enquire', href: SHK_CONTACT_HREF },
        ]}
      />
    </div>
  );
}
