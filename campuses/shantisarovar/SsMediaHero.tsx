'use client';

import type { ReactNode } from 'react';

/**
 * Counselling-style cinematic hero panel for SS media pages.
 * Left: short copy. Right: animation slot (map / aura).
 * No visible back-link / breadcrumb — nav is in SsHeader; SEO crumbs stay JSON-LD.
 *
 * Use `embedded` for mid-page collection bands (h2, tighter spacing).
 */
export function SsMediaHero({
  eyebrow,
  title,
  titleAccent,
  lede,
  note,
  countLabel,
  animation,
  actions,
  embedded = false,
  id,
}: {
  eyebrow: ReactNode;
  title: string;
  titleAccent?: string;
  lede: string;
  note?: string;
  countLabel?: string;
  animation: ReactNode;
  actions?: ReactNode;
  /** Mid-page section band (h2, less top padding). */
  embedded?: boolean;
  id?: string;
}) {
  const Heading = embedded ? 'h2' : 'h1';

  return (
    <div
      className={
        embedded
          ? 'ss-container ss-media-hero-wrap ss-media-hero-wrap--embedded'
          : 'ss-container ss-media-hero-wrap pt-8 md:pt-10'
      }
    >
      <header
        id={id}
        className={`ss-media-hero${embedded ? ' ss-media-hero--embedded' : ''}`}
      >
        <div className="ss-media-hero__glow" aria-hidden />
        <div className="ss-media-hero__aura" aria-hidden />
        <div className="ss-media-hero__layout">
          <div className="ss-media-hero__inner">
            <p className="ss-media-hero__eyebrow">{eyebrow}</p>
            <Heading className="ss-media-hero__title">
              {title}
              {titleAccent ? (
                <>
                  {' '}
                  <span className="ss-media-hero__title-accent">{titleAccent}</span>
                </>
              ) : null}
            </Heading>
            <p className="ss-media-hero__lede">{lede}</p>
            {actions ? <div className="ss-media-hero__actions">{actions}</div> : null}
            {note ? <p className="ss-media-hero__note">{note}</p> : null}
            {countLabel ? <p className="ss-media-hero__count">{countLabel}</p> : null}
          </div>
          {animation}
        </div>
      </header>
    </div>
  );
}
