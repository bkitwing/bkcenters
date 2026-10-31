'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ExpandableBlockProps {
  /** Opens automatically when the URL hash is `#<id>` (e.g. "ask a question" links) */
  id: string;
  openLabel: string;
  closeLabel: string;
  children: ReactNode;
}

/** A clearly labelled button that shows/hides a block (e.g. the question form) */
export default function ExpandableBlock({ id, openLabel, closeLabel, children }: ExpandableBlockProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openIfTargeted = () => {
      if (window.location.hash === `#${id}`) setOpen(true);
    };
    openIfTargeted();
    window.addEventListener('hashchange', openIfTargeted);
    return () => window.removeEventListener('hashchange', openIfTargeted);
  }, [id]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="inline-flex items-center gap-2 rounded-xl border border-spirit-purple-300 dark:border-spirit-purple-700 bg-white dark:bg-neutral-800 px-5 py-2.5 text-sm font-semibold text-spirit-purple-700 dark:text-spirit-purple-300 hover:bg-spirit-purple-50 dark:hover:bg-neutral-700 transition-colors"
      >
        {open ? closeLabel : openLabel}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      <div id={`${id}-panel`} hidden={!open} className="mt-6">
        {children}
      </div>
    </div>
  );
}
