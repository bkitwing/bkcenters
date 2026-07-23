'use client';

/** Map pin travelling a route — SVG motion (teal palette). */
export function ContactAuraAnimation() {
  return (
    <div className="jb-media-hero__anim jb-contact-route" aria-hidden>
      <svg
        className="jb-contact-route__svg"
        viewBox="0 0 280 190"
        width="280"
        height="190"
        role="img"
        aria-label=""
      >
        <defs>
          <path
            id="jbContactRoutePath"
            d="M28 152 C 72 148, 88 108, 128 112 C 168 116, 186 72, 236 58"
          />
        </defs>

        <circle cx="236" cy="58" r="28" fill="rgba(124, 190, 218, 0.18)" />
        <circle cx="236" cy="58" r="10" fill="rgba(112, 188, 211, 0.4)" />

        <use
          href="#jbContactRoutePath"
          fill="none"
          stroke="rgba(168, 224, 240, 0.55)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="5 8"
          className="jb-contact-route__line"
        />

        <circle cx="28" cy="152" r="5" fill="rgba(232, 244, 248, 0.9)" />
        <circle
          cx="28"
          cy="152"
          r="9"
          fill="none"
          stroke="rgba(232, 244, 248, 0.35)"
          strokeWidth="1.5"
        />

        <g className="jb-contact-route__pin">
          <animateMotion
            dur="7.5s"
            repeatCount="indefinite"
            rotate="0"
            keyPoints="0;1;0"
            keyTimes="0;0.55;1"
            calcMode="linear"
          >
            <mpath href="#jbContactRoutePath" />
          </animateMotion>
          <g transform="translate(-14 -36)">
            <path
              d="M16 0 C7.2 0 0 7.2 0 16 C0 28 16 44 16 44 C16 44 32 28 32 16 C32 7.2 24.8 0 16 0 Z"
              fill="rgba(112,188,211,0.98)"
              stroke="rgba(232,244,248,0.75)"
              strokeWidth="1.5"
            />
            <circle cx="16" cy="15" r="5.5" fill="rgba(232,244,248,0.95)" />
          </g>
        </g>
      </svg>
    </div>
  );
}
