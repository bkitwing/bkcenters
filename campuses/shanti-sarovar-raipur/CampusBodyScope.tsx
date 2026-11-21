'use client';

import { useEffect } from 'react';

export function CampusBodyScope() {
  useEffect(() => {
    document.body.classList.add('srp-campus-body');
    return () => {
      document.body.classList.remove('srp-campus-body');
    };
  }, []);

  return null;
}
