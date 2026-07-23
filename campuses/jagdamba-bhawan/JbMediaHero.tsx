'use client';

import type { ReactNode } from 'react';

/**
 * Counselling-style cinematic hero panel for SS media pages.
 * Left: short copy. Right: animation slot (map / aura).
 * No visible back-link / breadcrumb — nav is in JbHeader; SEO crumbs stay JSON-LD.
 *
 * Use `embedded` for mid-page collection bands (h2, tighter spacing).
 */
export function JbMediaHero({
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
          ? 'jb-container jb-media-hero-wrap jb-media-hero-wrap--embedded'
          : 'jb-container jb-media-hero-wrap pt-8 md:pt-10'
      }
    >
      <header
        id={id}
        className={`jb-media-hero${embedded ? ' jb-media-hero--embedded' : ''}`}
      >
        <div className="jb-media-hero__glow" aria-hidden />
        <div className="jb-media-hero__aura" aria-hidden />
        <div className="jb-media-hero__layout">
          <div className="jb-media-hero__inner">
            <p className="jb-media-hero__eyebrow">{eyebrow}</p>
            <Heading className="jb-media-hero__title">
              {title}
              {titleAccent ? (
                <>
                  {' '}
                  <span className="jb-media-hero__title-accent">{titleAccent}</span>
                </>
              ) : null}
            </Heading>
            <p className="jb-media-hero__lede">{lede}</p>
            {actions ? <div className="jb-media-hero__actions">{actions}</div> : null}
            {note ? <p className="jb-media-hero__note">{note}</p> : null}
            {countLabel ? <p className="jb-media-hero__count">{countLabel}</p> : null}
          </div>
          {animation}
        </div>
      </header>
    </div>
  );
}
