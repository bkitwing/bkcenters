'use client';

import { CenterLocatorAnalytics } from './GoogleAnalytics';
import { Center } from '@/lib/types';

interface ContactLinkProps {
  href: string;
  children: React.ReactNode;
  center: Center;
  className?: string;
  analyticsType?: 'contact' | 'retreat';
}

export default function ContactLink({ href, children, center, className, analyticsType = 'contact' }: ContactLinkProps) {
  const handleClick = () => {
    if (analyticsType === 'retreat') {
      CenterLocatorAnalytics.retreatInteraction('contact', center.name || 'Unknown');
    } else {
      CenterLocatorAnalytics.contactCenter(center);
    }
  };

  return (
    <a 
      href={href}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}