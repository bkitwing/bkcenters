'use client';

import type { ReactNode } from 'react';

/**
 * Counselling-style cinematic hero panel for SS media pages.
 * Left: short copy. Right: animation slot (map / aura).
 * No visible back-link / breadcrumb — nav is in SrpHeader; SEO crumbs stay JSON-LD.
 *
 * Use `embedded` for mid-page collection bands (h2, tighter spacing).
 */
export function SrpMediaHero({
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
          ? 'srp-container srp-media-hero-wrap srp-media-hero-wrap--embedded'
          : 'srp-container srp-media-hero-wrap pt-8 md:pt-10'
      }
    >
      <header
        id={id}
        className={`srp-media-hero${embedded ? ' srp-media-hero--embedded' : ''}`}
      >
        <div className="srp-media-hero__glow" aria-hidden />
        <div className="srp-media-hero__aura" aria-hidden />
        <div className="srp-media-hero__layout">
          <div className="srp-media-hero__inner">
            <p className="srp-media-hero__eyebrow">{eyebrow}</p>
            <Heading className="srp-media-hero__title">
              {title}
              {titleAccent ? (
                <>
                  {' '}
                  <span className="srp-media-hero__title-accent">{titleAccent}</span>
                </>
              ) : null}
            </Heading>
            <p className="srp-media-hero__lede">{lede}</p>
            {actions ? <div className="srp-media-hero__actions">{actions}</div> : null}
            {note ? <p className="srp-media-hero__note">{note}</p> : null}
            {countLabel ? <p className="srp-media-hero__count">{countLabel}</p> : null}
          </div>
          {animation}
        </div>
      </header>
    </div>
  );
}
