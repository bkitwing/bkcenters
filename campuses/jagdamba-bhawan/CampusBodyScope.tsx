'use client';

import { useEffect } from 'react';

/**
 * Resets root body chrome while a campus micro-site is mounted —
 * avoids Inter/neutral-50 bleeding at edges outside `.jb-oasis`.
 */
export function CampusBodyScope() {
  useEffect(() => {
    document.body.classList.add('jb-campus-body');
    return () => {
      document.body.classList.remove('jb-campus-body');
    };
  }, []);

  return null;
}
