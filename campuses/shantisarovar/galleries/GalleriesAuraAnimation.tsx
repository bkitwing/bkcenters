'use client';

/** Soft photo-stack aura for the galleries hero (matches news/events SsMediaHero). */
export function GalleriesAuraAnimation({
  thumbs = [],
}: {
  thumbs?: string[];
}) {
  const a = thumbs[0];
  const b = thumbs[1];
  const c = thumbs[2];

  return (
    <div className="ss-media-hero__anim ss-gal-aura" aria-hidden>
      <div className="ss-gal-aura__orbit">
        <span className="ss-gal-aura__ring ss-gal-aura__ring--1" />
        <span className="ss-gal-aura__ring ss-gal-aura__ring--2" />
        <span className="ss-gal-aura__ring ss-gal-aura__ring--3" />

        <div className="ss-gal-aura__stack">
          <div className="ss-gal-aura__frame ss-gal-aura__frame--back">
            {c ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c} alt="" />
            ) : (
              <span className="ss-gal-aura__ph" />
            )}
          </div>
          <div className="ss-gal-aura__frame ss-gal-aura__frame--mid">
            {b ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b} alt="" />
            ) : (
              <span className="ss-gal-aura__ph" />
            )}
          </div>
          <div className="ss-gal-aura__frame ss-gal-aura__frame--front">
            {a ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a} alt="" />
            ) : (
              <span className="ss-gal-aura__ph" />
            )}
          </div>
        </div>

        <span className="ss-gal-aura__spark ss-gal-aura__spark--a" />
        <span className="ss-gal-aura__spark ss-gal-aura__spark--b" />
        <span className="ss-gal-aura__spark ss-gal-aura__spark--c" />
      </div>
    </div>
  );
}
