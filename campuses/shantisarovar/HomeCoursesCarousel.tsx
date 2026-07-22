'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useReducedMotion } from 'motion/react';

export type SquareCarouselItem = {
  id: string;
  title: string;
  blurb?: string;
  src: string | null;
  alt: string;
  href?: string;
};

/**
 * Snap carousel of square tiles — shared by courses + photo gallery.
 */
export function HomeCoursesCarousel({
  items,
  ariaLabel = 'Courses offered',
}: {
  items: SquareCarouselItem[];
  ariaLabel?: string;
}) {
  const reduce = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [active, setActive] = useState(0);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);

    const cards = el.querySelectorAll<HTMLElement>('[data-course-card]');
    const mid = el.scrollLeft + el.clientWidth * 0.35;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [sync, items.length]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-course-card]');
    const step = card ? card.offsetWidth + 14 : el.clientWidth * 0.7;
    el.scrollBy({ left: dir * step, behavior: reduce ? 'auto' : 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <div className="ss-course-carousel">
      <div className="ss-course-carousel__toolbar">
        <p className="ss-course-carousel__count">
          <span>{String(active + 1).padStart(2, '0')}</span>
          <span aria-hidden>/</span>
          <span>{String(items.length).padStart(2, '0')}</span>
        </p>
        <div className="ss-course-carousel__nav">
          <button
            type="button"
            className="ss-course-carousel__btn"
            aria-label={`Previous ${ariaLabel.toLowerCase()}`}
            disabled={!canPrev}
            onClick={() => scrollByCard(-1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="ss-course-carousel__btn"
            aria-label={`Next ${ariaLabel.toLowerCase()}`}
            disabled={!canNext}
            onClick={() => scrollByCard(1)}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="ss-course-carousel__track"
        role="list"
        aria-label={ariaLabel}
      >
        {items.map((item) => {
          const body = (
            <>
              <div className="ss-course-carousel__square">
                {item.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
                ) : (
                  <div className="ss-course-carousel__ph" aria-hidden />
                )}
              </div>
              <div className="ss-course-carousel__meta">
                <h3 className="ss-course-carousel__title">{item.title}</h3>
                {item.blurb ? <p className="ss-course-carousel__blurb">{item.blurb}</p> : null}
              </div>
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className="ss-course-carousel__card ss-course-carousel__card--link"
                data-course-card
                role="listitem"
              >
                {body}
              </Link>
            );
          }

          return (
            <article
              key={item.id}
              className="ss-course-carousel__card"
              data-course-card
              role="listitem"
            >
              {body}
            </article>
          );
        })}
      </div>

      <div className="ss-course-carousel__dots" role="tablist" aria-label={`${ariaLabel} slides`}>
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Go to ${item.title}`}
            className={`ss-course-carousel__dot${i === active ? ' is-active' : ''}`}
            onClick={() => {
              const el = scrollerRef.current;
              const card = el?.querySelectorAll<HTMLElement>('[data-course-card]')[i];
              if (el && card) {
                el.scrollTo({ left: card.offsetLeft - 8, behavior: reduce ? 'auto' : 'smooth' });
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
