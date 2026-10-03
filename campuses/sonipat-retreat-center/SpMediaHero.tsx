'use client';

import type { ReactNode } from 'react';

/**
 * Counselling-style cinematic hero panel for SS media pages.
 * Left: short copy. Right: animation slot (map / aura).
 * No visible back-link / breadcrumb — nav is in SpHeader; SEO crumbs stay JSON-LD.
 *
 * Use `embedded` for mid-page collection bands (h2, tighter spacing).
 */
export function SpMediaHero({
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
          ? 'sp-container sp-media-hero-wrap sp-media-hero-wrap--embedded'
          : 'sp-container sp-media-hero-wrap pt-8 md:pt-10'
      }
    >
      <header
        id={id}
        className={`sp-media-hero${embedded ? ' sp-media-hero--embedded' : ''}`}
      >
        <div className="sp-media-hero__glow" aria-hidden />
        <div className="sp-media-hero__aura" aria-hidden />
        <div className="sp-media-hero__layout">
          <div className="sp-media-hero__inner">
            <p className="sp-media-hero__eyebrow">{eyebrow}</p>
            <Heading className="sp-media-hero__title">
              {title}
              {titleAccent ? (
                <>
                  {' '}
                  <span className="sp-media-hero__title-accent">{titleAccent}</span>
                </>
              ) : null}
            </Heading>
            <p className="sp-media-hero__lede">{lede}</p>
            {actions ? <div className="sp-media-hero__actions">{actions}</div> : null}
            {note ? <p className="sp-media-hero__note">{note}</p> : null}
            {countLabel ? <p className="sp-media-hero__count">{countLabel}</p> : null}
          </div>
          {animation}
        </div>
      </header>
    </div>
  );
}
