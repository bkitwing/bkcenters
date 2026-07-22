'use client';

const LINKS = [
  { href: '#ss-contact-main', label: 'Arrive' },
  { href: '#ss-enquire', label: 'Enquire' },
  { href: '#ss-reach', label: 'Reach' },
  { href: '#ss-course', label: 'Learn' },
  { href: '#ss-meditation', label: 'Meditate' },
  { href: '#ss-nearby', label: 'Centres' },
  { href: '#ss-faq', label: 'FAQ' },
] as const;

export function ContactSectionNav() {
  return (
    <nav className="ss-contact-nav" aria-label="Visit journey">
      <div className="ss-contact-nav__track">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} className="ss-contact-nav__chip">
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
