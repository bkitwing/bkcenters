/**
 * Shared retreat-campus footer — campus links + key Brahma Kumaris destinations.
 * Pass campus-specific brand/links; BK columns stay stable for every HQ campus.
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ExternalLink,
  MapPin,
  Flower2,
  Smartphone,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import './retreat-footer.css';

/* Cross-app paths must stay root-relative (plain <a>) so /centers basePath is not applied. */
/* eslint-disable @next/next/no-html-link-for-pages */

const BK_LOGO =
  'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/BK_Logo_c6ca9ac104.png';

const BK_SOCIAL = [
  { href: 'https://www.facebook.com/BrahmaKumaris', label: 'Facebook', icon: Facebook },
  { href: 'https://twitter.com/BrahmaKumaris', label: 'X (Twitter)', icon: Twitter },
  { href: 'https://www.instagram.com/brahmakumaris/', label: 'Instagram', icon: Instagram },
  { href: 'https://www.youtube.com/brahmakumaris', label: 'YouTube', icon: Youtube },
] as const;

const BK_ABOUT_LINKS = [
  { label: 'About Brahma Kumaris', href: 'https://www.brahmakumaris.com/about' },
  { label: 'About Us', href: 'https://www.brahmakumaris.com/about/about-us' },
  { label: 'Our Journey', href: 'https://www.brahmakumaris.com/about/journey' },
  { label: 'Current Leaders', href: 'https://www.brahmakumaris.com/about/current-leaders' },
] as const;

const BK_EXPLORE_LINKS: RetreatFooterLink[] = [
  { label: 'Meditation', href: 'https://www.brahmakumaris.com/meditation' },
  { label: 'Wisdom', href: 'https://www.brahmakumaris.com/wisdom' },
  { label: 'Find a Center', href: '/centers' },
  { label: 'HQ Campuses', href: '/centers/retreat' },
  { label: 'Courses', href: 'https://courses.brahmakumaris.com/', external: true },
];

const LEGAL_LINKS = [
  { label: 'Privacy', href: 'https://www.brahmakumaris.com/contact/legal/privacy-policy' },
  { label: 'Terms', href: 'https://www.brahmakumaris.com/contact/legal/terms-and-conditions' },
  { label: 'Policies', href: 'https://www.brahmakumaris.com/contact/legal' },
] as const;

export type RetreatFooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type RetreatCampusFooterProps = {
  campusName: string;
  campusTagline: string;
  campusBlurb: string;
  /** Campus-only column (Visit, Courses, Galleries, News, Events…). */
  campusLinks: RetreatFooterLink[];
  /** Optional campus socials; falls back to BK socials. */
  socialLinks?: { href: string; label: string; icon?: 'facebook' | 'twitter' | 'instagram' | 'youtube' }[];
  enquireHref: string;
};

function FooterA({
  href,
  external,
  children,
  className = 'ss-ft__link',
}: {
  href: string;
  external?: boolean;
  children: ReactNode;
  className?: string;
}) {
  if (external || href.startsWith('http')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
        <ExternalLink className="ss-ft__ext" aria-hidden />
      </a>
    );
  }
  if (href.startsWith('/centers') || href === '/centers') {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={false} className={className}>
      {children}
    </Link>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/**
 * Multi-column footer for exclusive retreat micro-sites (NMBA / initiatives pattern).
 */
export function RetreatCampusFooter({
  campusName,
  campusTagline,
  campusBlurb,
  campusLinks,
  enquireHref,
}: RetreatCampusFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="ss-ft" aria-labelledby="ss-ft-heading">
      <div className="ss-container ss-ft__main">
        <h2 id="ss-ft-heading" className="sr-only">
          {campusName} site footer
        </h2>

        <div className="ss-ft__brand">
          <p className="ss-ft__brand-name">{campusName}</p>
          <p className="ss-ft__brand-tag">{campusTagline}</p>
          <p className="ss-ft__blurb">{campusBlurb}</p>
          <div className="ss-ft__actions">
            <Link href={enquireHref} className="ss-btn ss-btn--primary !min-h-10 !text-sm">
              Enquire
            </Link>
            <Link href="/retreat" className="ss-ft__ghost">
              All HQ Campuses
            </Link>
          </div>
          <div className="ss-ft__social" aria-label="Brahma Kumaris on social media">
            {BK_SOCIAL.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="ss-ft__social-btn"
                aria-label={s.label}
              >
                <s.icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        <nav className="ss-ft__nav" aria-label="Footer">
          <div className="ss-ft__col">
            <p className="ss-ft__col-title">This campus</p>
            <ul className="ss-ft__list">
              {campusLinks.map((link) => (
                <li key={link.href}>
                  <FooterA href={link.href} external={link.external}>
                    {link.label}
                  </FooterA>
                </li>
              ))}
            </ul>
          </div>

          <div className="ss-ft__col">
            <p className="ss-ft__col-title">
              <a href="https://www.brahmakumaris.com/about" className="ss-ft__col-title-link">
                About Brahma Kumaris
              </a>
            </p>
            <ul className="ss-ft__list">
              {BK_ABOUT_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterA href={link.href} external>
                    {link.label}
                  </FooterA>
                </li>
              ))}
            </ul>
          </div>

          <div className="ss-ft__col">
            <p className="ss-ft__col-title">Explore</p>
            <ul className="ss-ft__list">
              {BK_EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterA href={link.href} external={link.external}>
                    {link.label}
                  </FooterA>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="ss-ft__connect">
        <div className="ss-container ss-ft__connect-grid">
          <div className="ss-ft__card">
            <div className="ss-ft__card-icon ss-ft__card-icon--green">
              <WhatsAppIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="ss-ft__card-title">Daily Wisdom</p>
              <div className="ss-ft__chips">
                <a href="https://www.brahmakumaris.com/join-sse/" target="_blank" rel="noopener noreferrer">
                  English
                </a>
                <a href="https://www.brahmakumaris.com/join-ssh/" target="_blank" rel="noopener noreferrer">
                  हिन्दी
                </a>
              </div>
            </div>
          </div>

          <div className="ss-ft__card">
            <div className="ss-ft__card-icon ss-ft__card-icon--gold">
              <Flower2 className="h-4 w-4" />
            </div>
            <div>
              <p className="ss-ft__card-title">Practice meditation</p>
              <div className="ss-ft__chips">
                <a href="https://www.brahmakumaris.com/meditation" target="_blank" rel="noopener noreferrer">
                  Online
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.official.brahmakumaris"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Smartphone className="h-3 w-3" aria-hidden /> Android
                </a>
              </div>
            </div>
          </div>

          <div className="ss-ft__card">
            <div className="ss-ft__card-icon ss-ft__card-icon--ink">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="ss-ft__card-title">Visit a centre</p>
              <div className="ss-ft__chips">
                <a href="/centers">Find a Center</a>
                <Link href={enquireHref}>This campus</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="ss-container ss-ft__bk">
          <a
            href="https://www.brahmakumaris.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ss-ft__bk-logo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BK_LOGO} alt="Brahma Kumaris" width={160} height={40} />
          </a>
          <p className="ss-ft__bk-desc">
            A worldwide spiritual movement led by women — personal transformation and world renewal
            through Rajyoga Meditation.
          </p>
        </div>
      </div>

      <div className="ss-ft__bar">
        <div className="ss-container ss-ft__bar-inner">
          <p className="ss-ft__copy">
            © {year} Brahma Kumaris · {campusName}
          </p>
          <div className="ss-ft__bar-end">
            <nav className="ss-ft__legal" aria-label="Legal">
              {LEGAL_LINKS.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ))}
              <a href="https://www.brahmakumaris.com" target="_blank" rel="noopener noreferrer">
                brahmakumaris.com
              </a>
            </nav>
            <div className="ss-ft__theme" aria-label="Theme">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
