'use client';

import { useEffect } from 'react';

export function CampusBodyScope() {
  useEffect(() => {
    document.body.classList.add('shk-campus-body');
    return () => {
      document.body.classList.remove('shk-campus-body');
    };
  }, []);

  return null;
}
