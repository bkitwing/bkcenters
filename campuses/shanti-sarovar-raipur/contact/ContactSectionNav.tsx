'use client';

const LINKS = [
  { href: '#srp-contact-main', label: 'Arrive' },
  { href: '#srp-enquire', label: 'Enquire' },
  { href: '#srp-reach', label: 'Reach' },
  { href: '#srp-course', label: 'Learn' },
  { href: '#srp-meditation', label: 'Meditate' },
  { href: '#srp-nearby', label: 'Centres' },
  { href: '#srp-faq', label: 'FAQ' },
] as const;

export function ContactSectionNav() {
  return (
    <nav className="srp-contact-nav" aria-label="Visit journey">
      <div className="srp-contact-nav__track">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} className="srp-contact-nav__chip">
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
