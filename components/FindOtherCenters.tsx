'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import SearchBar from '@/components/SearchBar';

/**
 * Compact locator search on center detail pages.
 * Sends the user home with lat/lng so nearby results load immediately.
 */
export default function FindOtherCenters() {
  const router = useRouter();

  return (
    <div className="bk-center-hero__find">
      <div className="bk-center-hero__find-label">
        <Search className="w-3.5 h-3.5" aria-hidden />
        <span>Find another center</span>
      </div>
      <SearchBar
        placeholder="Search city, area, or pincode…"
        disableVoiceInput
        onSearchResult={(lat, lng, address) => {
          router.push(
            `/?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address)}`
          );
        }}
      />
      <Link href="/" className="bk-center-hero__find-browse">
        Browse all centers
      </Link>
    </div>
  );
}
