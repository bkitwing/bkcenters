'use client';

const LINKS = [
  { href: '#shk-contact-main', label: 'Arrive' },
  { href: '#shk-enquire', label: 'Enquire' },
  { href: '#shk-reach', label: 'Reach' },
  { href: '#shk-course', label: 'Learn' },
  { href: '#shk-meditation', label: 'Meditate' },
  { href: '#shk-nearby', label: 'Centres' },
  { href: '#shk-faq', label: 'FAQ' },
] as const;

export function ContactSectionNav() {
  return (
    <nav className="shk-contact-nav" aria-label="Visit journey">
      <div className="shk-contact-nav__track">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} className="shk-contact-nav__chip">
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
