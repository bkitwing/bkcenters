'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { SsEventPost } from '../ss-media-data';

const EVENTS_API = '/centers/api/campus/shantisarovar/events';

type FetchBatch = {
  events: SsEventPost[];
  page: number;
  hasMore: boolean;
};

export function useSsEventsFetchMore({
  page,
  pageSize,
  hasMore,
  onBatch,
}: {
  page: number;
  pageSize: number;
  hasMore: boolean;
  onBatch: (batch: FetchBatch) => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);

  const fetchNext = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    try {
      const res = await fetch(
        `${EVENTS_API}?page=${page + 1}&pageSize=${pageSize}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const batch = (await res.json()) as FetchBatch;
      onBatch(batch);
    } finally {
      fetchingRef.current = false;
    }
  }, [hasMore, onBatch, page, pageSize]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void fetchNext();
      },
      { rootMargin: '400px', threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNext, hasMore]);

  return { sentinelRef };
}
