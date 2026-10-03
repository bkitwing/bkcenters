'use client';

const LINKS = [
  { href: '#sp-contact-main', label: 'Arrive' },
  { href: '#sp-enquire', label: 'Enquire' },
  { href: '#sp-reach', label: 'Reach' },
  { href: '#sp-course', label: 'Learn' },
  { href: '#sp-meditation', label: 'Meditate' },
  { href: '#sp-nearby', label: 'Centres' },
  { href: '#sp-faq', label: 'FAQ' },
] as const;

export function ContactSectionNav() {
  return (
    <nav className="sp-contact-nav" aria-label="Visit journey">
      <div className="sp-contact-nav__track">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} className="sp-contact-nav__chip">
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
