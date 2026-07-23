'use client';

/** Soft calendar / gathering aura for the campus events hero (counselling-style). */
export function EventsAuraAnimation() {
  return (
    <div className="jb-media-hero__anim jb-events-aura" aria-hidden>
      <svg
        className="jb-events-aura__svg"
        viewBox="0 0 240 240"
        width="240"
        height="240"
        role="img"
        aria-label=""
      >
        <defs>
          <radialGradient id="jbEvCore" cx="50%" cy="42%" r="58%">
            <stop offset="0%" stopColor="rgba(255, 232, 192, 0.95)" />
            <stop offset="45%" stopColor="rgba(112, 188, 211, 0.4)" />
            <stop offset="100%" stopColor="rgba(20, 18, 16, 0)" />
          </radialGradient>
          <radialGradient id="jbEvRing" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="65%" stopColor="rgba(196, 164, 106, 0.28)" />
            <stop offset="100%" stopColor="rgba(196, 164, 106, 0)" />
          </radialGradient>
          <filter id="jbEvBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        <circle cx="120" cy="108" r="92" fill="url(#jbEvCore)" />

        <g filter="url(#jbEvBlur)">
          <circle
            className="jb-events-aura__ripple jb-events-aura__ripple--1"
            cx="120"
            cy="120"
            r="42"
            fill="none"
            stroke="url(#jbEvRing)"
            strokeWidth="6"
          />
          <circle
            className="jb-events-aura__ripple jb-events-aura__ripple--2"
            cx="120"
            cy="120"
            r="58"
            fill="none"
            stroke="url(#jbEvRing)"
            strokeWidth="5"
          />
          <circle
            className="jb-events-aura__ripple jb-events-aura__ripple--3"
            cx="120"
            cy="120"
            r="74"
            fill="none"
            stroke="url(#jbEvRing)"
            strokeWidth="4"
          />
        </g>

        {/* Calendar card */}
        <g className="jb-events-aura__cal" transform="translate(78 86)">
          <rect
            x="0"
            y="10"
            width="84"
            height="72"
            rx="10"
            fill="rgba(255,255,255,0.14)"
            stroke="rgba(255,232,192,0.55)"
            strokeWidth="1.5"
          />
          <rect x="0" y="10" width="84" height="18" rx="10" fill="rgba(112,188,211,0.85)" />
          <rect x="0" y="20" width="84" height="8" fill="rgba(112,188,211,0.85)" />
          <circle cx="22" cy="8" r="3.2" fill="rgba(255,248,235,0.95)" />
          <circle cx="62" cy="8" r="3.2" fill="rgba(255,248,235,0.95)" />
          <line
            x1="22"
            y1="4"
            x2="22"
            y2="12"
            stroke="rgba(255,248,235,0.95)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <line
            x1="62"
            y1="4"
            x2="62"
            y2="12"
            stroke="rgba(255,248,235,0.95)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* date dots */}
          <circle className="jb-events-aura__dot" cx="22" cy="44" r="3.5" fill="rgba(255,232,192,0.85)" />
          <circle className="jb-events-aura__dot jb-events-aura__dot--b" cx="42" cy="44" r="3.5" fill="rgba(255,255,255,0.35)" />
          <circle className="jb-events-aura__dot jb-events-aura__dot--c" cx="62" cy="44" r="3.5" fill="rgba(255,255,255,0.35)" />
          <circle className="jb-events-aura__dot jb-events-aura__dot--d" cx="22" cy="62" r="3.5" fill="rgba(255,255,255,0.35)" />
          <circle className="jb-events-aura__dot jb-events-aura__dot--e" cx="42" cy="62" r="3.5" fill="rgba(112,188,211,0.95)" />
          <circle className="jb-events-aura__dot jb-events-aura__dot--f" cx="62" cy="62" r="3.5" fill="rgba(255,255,255,0.35)" />
        </g>

        <g className="jb-events-aura__sparks" opacity="0.9">
          <circle className="jb-events-aura__spark jb-events-aura__spark--a" cx="66" cy="92" r="1.7" fill="rgba(255,255,255,0.9)" />
          <circle className="jb-events-aura__spark jb-events-aura__spark--b" cx="182" cy="78" r="1.5" fill="rgba(255,255,255,0.78)" />
          <circle className="jb-events-aura__spark jb-events-aura__spark--c" cx="196" cy="152" r="1.8" fill="rgba(255,232,192,0.82)" />
          <circle className="jb-events-aura__spark jb-events-aura__spark--d" cx="58" cy="158" r="1.4" fill="rgba(255,232,192,0.7)" />
        </g>
      </svg>
    </div>
  );
}
