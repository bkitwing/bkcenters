'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Center } from '@/lib/types';
import { centerShareMessage } from '@/lib/shareText';
import { CenterLocatorAnalytics } from './GoogleAnalytics';
import { ShareSheet } from './ContactSheet';

interface ShareCenterProps {
  center: Center;
  pageUrl: string;
  /** card = block; hero/bar = compact Share control for chrome */
  variant?: "card" | "hero" | "bar";
}

function getFullUrl(pageUrl: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || '';
  if (pageUrl.startsWith('http')) {
    return pageUrl.startsWith('https')
      ? pageUrl
      : `https${pageUrl.substring(pageUrl.indexOf(':'))}`;
  }
  return `https://www.brahmakumaris.com/centers${baseUrl}${pageUrl.startsWith('/') ? pageUrl : '/' + pageUrl}`;
}

/**
 * Share button: opens a sheet with the message preview, WhatsApp and Copy
 * message (see ShareOptions).
 */
export default function ShareCenter({ center, pageUrl, variant = "card" }: ShareCenterProps) {
  const [open, setOpen] = useState(false);
  const fullUrl = getFullUrl(pageUrl);

  const sheet = open && (
    <ShareSheet
      title="Share this center"
      subtitle={center.name}
      message={centerShareMessage(center, fullUrl)}
      onShared={(method) => CenterLocatorAnalytics.shareCenter(center, method)}
      onClose={() => setOpen(false)}
    />
  );

  const openSheet = () => setOpen(true);

  if (variant === "hero") {
    return (
      <>
        <button type="button" onClick={openSheet} className="bk-center-hero__action" aria-haspopup="dialog">
          <Share2 className="h-4 w-4" aria-hidden />
          <span>Share</span>
        </button>
        {sheet}
      </>
    );
  }

  if (variant === "bar") {
    return (
      <>
        <button
          type="button"
          onClick={openSheet}
          aria-haspopup="dialog"
          className="flex-1 flex items-center justify-center py-3.5 px-3 bg-gradient-to-r from-spirit-blue-600 to-spirit-blue-700 dark:from-spirit-blue-700 dark:to-spirit-blue-800 text-white font-semibold transition-all duration-200 hover:from-spirit-blue-700 hover:to-spirit-blue-800 active:scale-95"
        >
          <Share2 className="w-5 h-5 mr-2" aria-hidden />
          <span>Share</span>
        </button>
        {sheet}
      </>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-3 text-spirit-blue-700 dark:text-spirit-blue-400">Share Center Details</h2>
      <button
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        className="p-3 rounded-full shadow-md transition-all duration-300 bg-primary hover:bg-primary-dark text-white"
        aria-label="Share Center Details"
      >
        <Share2 className="h-6 w-6" aria-hidden />
      </button>
      {sheet}
    </div>
  );
}
