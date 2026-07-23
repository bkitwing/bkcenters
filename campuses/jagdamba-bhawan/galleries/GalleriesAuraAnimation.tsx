'use client';

/** Soft photo-stack aura for the galleries hero (matches news/events JbMediaHero). */
export function GalleriesAuraAnimation({
  thumbs = [],
}: {
  thumbs?: string[];
}) {
  const a = thumbs[0];
  const b = thumbs[1];
  const c = thumbs[2];

  return (
    <div className="jb-media-hero__anim jb-gal-aura" aria-hidden>
      <div className="jb-gal-aura__orbit">
        <span className="jb-gal-aura__ring jb-gal-aura__ring--1" />
        <span className="jb-gal-aura__ring jb-gal-aura__ring--2" />
        <span className="jb-gal-aura__ring jb-gal-aura__ring--3" />

        <div className="jb-gal-aura__stack">
          <div className="jb-gal-aura__frame jb-gal-aura__frame--back">
            {c ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c} alt="" />
            ) : (
              <span className="jb-gal-aura__ph" />
            )}
          </div>
          <div className="jb-gal-aura__frame jb-gal-aura__frame--mid">
            {b ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b} alt="" />
            ) : (
              <span className="jb-gal-aura__ph" />
            )}
          </div>
          <div className="jb-gal-aura__frame jb-gal-aura__frame--front">
            {a ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a} alt="" />
            ) : (
              <span className="jb-gal-aura__ph" />
            )}
          </div>
        </div>

        <span className="jb-gal-aura__spark jb-gal-aura__spark--a" />
        <span className="jb-gal-aura__spark jb-gal-aura__spark--b" />
        <span className="jb-gal-aura__spark jb-gal-aura__spark--c" />
      </div>
    </div>
  );
}
