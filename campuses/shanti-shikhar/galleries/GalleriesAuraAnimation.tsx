'use client';

/** Soft photo-stack aura for the galleries hero (matches news/events ShkMediaHero). */
export function GalleriesAuraAnimation({
  thumbs = [],
}: {
  thumbs?: string[];
}) {
  const a = thumbs[0];
  const b = thumbs[1];
  const c = thumbs[2];

  return (
    <div className="shk-media-hero__anim shk-gal-aura" aria-hidden>
      <div className="shk-gal-aura__orbit">
        <span className="shk-gal-aura__ring shk-gal-aura__ring--1" />
        <span className="shk-gal-aura__ring shk-gal-aura__ring--2" />
        <span className="shk-gal-aura__ring shk-gal-aura__ring--3" />

        <div className="shk-gal-aura__stack">
          <div className="shk-gal-aura__frame shk-gal-aura__frame--back">
            {c ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c} alt="" />
            ) : (
              <span className="shk-gal-aura__ph" />
            )}
          </div>
          <div className="shk-gal-aura__frame shk-gal-aura__frame--mid">
            {b ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b} alt="" />
            ) : (
              <span className="shk-gal-aura__ph" />
            )}
          </div>
          <div className="shk-gal-aura__frame shk-gal-aura__frame--front">
            {a ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a} alt="" />
            ) : (
              <span className="shk-gal-aura__ph" />
            )}
          </div>
        </div>

        <span className="shk-gal-aura__spark shk-gal-aura__spark--a" />
        <span className="shk-gal-aura__spark shk-gal-aura__spark--b" />
        <span className="shk-gal-aura__spark shk-gal-aura__spark--c" />
      </div>
    </div>
  );
}
