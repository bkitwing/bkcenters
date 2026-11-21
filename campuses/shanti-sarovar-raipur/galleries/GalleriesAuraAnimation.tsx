'use client';

/** Soft photo-stack aura for the galleries hero (matches news/events SrpMediaHero). */
export function GalleriesAuraAnimation({
  thumbs = [],
}: {
  thumbs?: string[];
}) {
  const a = thumbs[0];
  const b = thumbs[1];
  const c = thumbs[2];

  return (
    <div className="srp-media-hero__anim srp-gal-aura" aria-hidden>
      <div className="srp-gal-aura__orbit">
        <span className="srp-gal-aura__ring srp-gal-aura__ring--1" />
        <span className="srp-gal-aura__ring srp-gal-aura__ring--2" />
        <span className="srp-gal-aura__ring srp-gal-aura__ring--3" />

        <div className="srp-gal-aura__stack">
          <div className="srp-gal-aura__frame srp-gal-aura__frame--back">
            {c ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c} alt="" />
            ) : (
              <span className="srp-gal-aura__ph" />
            )}
          </div>
          <div className="srp-gal-aura__frame srp-gal-aura__frame--mid">
            {b ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b} alt="" />
            ) : (
              <span className="srp-gal-aura__ph" />
            )}
          </div>
          <div className="srp-gal-aura__frame srp-gal-aura__frame--front">
            {a ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a} alt="" />
            ) : (
              <span className="srp-gal-aura__ph" />
            )}
          </div>
        </div>

        <span className="srp-gal-aura__spark srp-gal-aura__spark--a" />
        <span className="srp-gal-aura__spark srp-gal-aura__spark--b" />
        <span className="srp-gal-aura__spark srp-gal-aura__spark--c" />
      </div>
    </div>
  );
}
