'use client';

const LINKS = [
  { href: '#jb-contact-main', label: 'Arrive' },
  { href: '#jb-enquire', label: 'Enquire' },
  { href: '#jb-reach', label: 'Reach' },
  { href: '#jb-course', label: 'Learn' },
  { href: '#jb-meditation', label: 'Meditate' },
  { href: '#jb-nearby', label: 'Centres' },
  { href: '#jb-faq', label: 'FAQ' },
] as const;

export function ContactSectionNav() {
  return (
    <nav className="jb-contact-nav" aria-label="Visit journey">
      <div className="jb-contact-nav__track">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} className="jb-contact-nav__chip">
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
