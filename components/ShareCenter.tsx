'use client';

import React, { useState } from 'react';
import { Center } from '@/lib/types';

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

export default function ShareCenter({ center, pageUrl, variant = "card" }: ShareCenterProps) {
  const [isCopied, setIsCopied] = useState(false);

  const getFormattedShareText = () => {
    const regionText = center.region ? `${center.region}, ` : '';
    const locationDetails = `${center.district}, ${center.state}${regionText ? `, ${regionText}` : ''}`;
    const fullUrl = getFullUrl(pageUrl);

    return (
      `Om Shanti.\n\n` +
      `${center.name} - Brahma Kumaris Meditation Center - Details\n` +
      `${locationDetails}\n\n` +
      `For more details, please click below\n` +
      `${fullUrl}\n\n` +
      `To find other Nearby Centers:\n` +
      `https://www.brahmakumaris.com/centers\n\n` +
      `For any queries, contact following:\n` +
      `contact@brahmakumaris.com`
    );
  };

  const handleShare = async () => {
    const shareText = getFormattedShareText();
    const fullUrl = getFullUrl(pageUrl);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${center.name} - Brahma Kumaris`,
          text: shareText,
          url: fullUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const shareIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );

  if (variant === "hero") {
    return (
      <button
        type="button"
        onClick={handleShare}
        className="bk-center-hero__action"
        aria-label="Share center details"
        title={isCopied ? "Copied" : "Share"}
      >
        {shareIcon}
        <span>{isCopied ? "Copied" : "Share"}</span>
      </button>
    );
  }

  if (variant === "bar") {
    return (
      <button
        type="button"
        onClick={handleShare}
        className="flex-1 flex items-center justify-center py-3.5 px-3 bg-gradient-to-r from-spirit-blue-600 to-spirit-blue-700 dark:from-spirit-blue-700 dark:to-spirit-blue-800 text-white font-semibold transition-all duration-200 hover:from-spirit-blue-700 hover:to-spirit-blue-800 active:scale-95"
        aria-label="Share center details"
        title={isCopied ? "Copied" : "Share"}
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span>{isCopied ? "Copied" : "Share"}</span>
      </button>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-3 text-spirit-blue-700 dark:text-spirit-blue-400">Share Center Details</h2>
      <div className="flex items-center gap-4">
        <button
          onClick={handleShare}
          className={`relative p-3 rounded-full shadow-md transition-all duration-300 ${
            isCopied
              ? 'bg-green-500 scale-110'
              : 'bg-primary hover:bg-primary-dark'
          }`}
          aria-label="Share Center Details"
          title={isCopied ? "Copied" : "Share Center Details"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 text-white transition-all duration-300 ${isCopied ? 'scale-110' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isCopied ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
