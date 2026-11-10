'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { HomeHeroParticles } from './HomeHeroParticles';

/**
 * Full-viewport ambient YouTube band — autoplays muted when scrolled into view.
 */
export function HomeAmbientVideo({
  embedUrl,
  title = 'A sanctuary of peace',
  lede = 'Stillness, learning and community at Shanti Shikhar.',
}: {
  embedUrl: string;
  title?: string;
  lede?: string;
}) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { rootMargin: '10% 0px', threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const src = (() => {
    try {
      const u = new URL(embedUrl);
      u.searchParams.set('autoplay', active && !reduce ? '1' : '0');
      u.searchParams.set('mute', '1');
      u.searchParams.set('controls', '0');
      u.searchParams.set('modestbranding', '1');
      u.searchParams.set('playsinline', '1');
      u.searchParams.set('rel', '0');
      u.searchParams.set('iv_load_policy', '3');
      u.searchParams.set('fs', '0');
      u.searchParams.set('disablekb', '1');
      u.searchParams.set('loop', '1');
      const id = u.pathname.split('/').filter(Boolean).pop();
      if (id) u.searchParams.set('playlist', id);
      return u.toString();
    } catch {
      return embedUrl;
    }
  })();

  return (
    <section
      ref={sectionRef}
      id="video"
      className="shk-home-video"
      aria-label="Campus atmosphere video"
    >
      <div className="shk-home-video__frame" aria-hidden>
        {active ? (
          <iframe
            key={src}
            src={src}
            title="Shanti Shikhar campus atmosphere"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            tabIndex={-1}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : null}
      </div>
      <div className="shk-home-video__veil" />
      {!reduce ? (
        <div className="shk-home-video__particles">
          <HomeHeroParticles />
        </div>
      ) : null}
      <div className="shk-home-video__copy">
        <p className="shk-eyebrow">Atmosphere</p>
        <h2 className="shk-heading">{title}</h2>
        <p className="shk-lede">{lede}</p>
      </div>
    </section>
  );
}
