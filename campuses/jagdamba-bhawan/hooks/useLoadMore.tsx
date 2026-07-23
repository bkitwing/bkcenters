'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Progressive reveal — matches bknews-frontend useLoadMore.
 * SSR holds the full batch; the client reveals items in slices as the sentinel nears view.
 */
export function useLoadMore<T>(items: T[], initialCount = 12, batchSize = 12) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const prevLengthRef = useRef(items.length);

  useEffect(() => {
    if (items.length < prevLengthRef.current) {
      setVisibleCount(initialCount);
    } else {
      setVisibleCount((prev) => Math.min(Math.max(prev, initialCount), items.length));
    }
    prevLengthRef.current = items.length;
  }, [items.length, initialCount]);

  const hasMore = visibleCount < items.length;

  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + batchSize, items.length));
        }
      },
      { rootMargin: '400px', threshold: 0 }
    );

    observerRef.current.observe(node);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [batchSize, hasMore, items.length]);

  const visibleItems = items.slice(0, visibleCount);

  const sentinel = (
    <div
      ref={sentinelRef}
      className={hasMore ? 'jb-load-sentinel' : 'jb-load-sentinel jb-load-sentinel--hidden'}
      aria-hidden="true"
    >
      <div className="jb-load-sentinel__dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  );

  return { visibleItems, hasMore, sentinel };
}
