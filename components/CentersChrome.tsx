'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isCampusPathname } from '@/lib/campuses/registry';

/**
 * Gates UnifiedHeader / Footer / GlobalStickyBottomNav so campus
 * micro-sites can supply their own chrome.
 * usePathname() is WITHOUT basePath → match "/shantisarovar…".
 * Campus routes render children outside <main> to avoid directory chrome bleed.
 */
export function CentersChrome({
  header,
  footer,
  bottomNav,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  bottomNav: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isCampus = isCampusPathname(pathname);

  if (isCampus) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main>{children}</main>
      {bottomNav}
      {footer}
    </>
  );
}
