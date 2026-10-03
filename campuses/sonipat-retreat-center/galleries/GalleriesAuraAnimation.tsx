'use client';

/** Soft photo-stack aura for the galleries hero (matches news/events SpMediaHero). */
export function GalleriesAuraAnimation({
  thumbs = [],
}: {
  thumbs?: string[];
}) {
  const a = thumbs[0];
  const b = thumbs[1];
  const c = thumbs[2];

  return (
    <div className="sp-media-hero__anim sp-gal-aura" aria-hidden>
      <div className="sp-gal-aura__orbit">
        <span className="sp-gal-aura__ring sp-gal-aura__ring--1" />
        <span className="sp-gal-aura__ring sp-gal-aura__ring--2" />
        <span className="sp-gal-aura__ring sp-gal-aura__ring--3" />

        <div className="sp-gal-aura__stack">
          <div className="sp-gal-aura__frame sp-gal-aura__frame--back">
            {c ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c} alt="" />
            ) : (
              <span className="sp-gal-aura__ph" />
            )}
          </div>
          <div className="sp-gal-aura__frame sp-gal-aura__frame--mid">
            {b ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b} alt="" />
            ) : (
              <span className="sp-gal-aura__ph" />
            )}
          </div>
          <div className="sp-gal-aura__frame sp-gal-aura__frame--front">
            {a ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a} alt="" />
            ) : (
              <span className="sp-gal-aura__ph" />
            )}
          </div>
        </div>

        <span className="sp-gal-aura__spark sp-gal-aura__spark--a" />
        <span className="sp-gal-aura__spark sp-gal-aura__spark--b" />
        <span className="sp-gal-aura__spark sp-gal-aura__spark--c" />
      </div>
    </div>
  );
}
