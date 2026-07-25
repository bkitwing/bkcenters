'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { HomeHeroSlideshow } from '../HomeHeroSlideshow';
import { HomeHeroParticles } from '../HomeHeroParticles';
import type { SsHomeImage } from '../ss-home-data';

const DESKTOP_MQ = '(min-width: 768px)';

function subscribeDesktop(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function getDesktopSnapshot() {
  return window.matchMedia(DESKTOP_MQ).matches;
}

function getServerDesktopSnapshot() {
  return false;
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerDesktopSnapshot
  );
}

/**
 * Full-viewport, text-free cinema band — desktop only.
 * Same Ken Burns / crossfade as home hero; hides the campus header while in view.
 */
export function CsrCinemaGallery({ slides }: { slides: SsHomeImage[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!isDesktop || !slides.length) return;
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.35));
      },
      { threshold: [0, 0.35, 0.55, 0.8] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isDesktop, slides.length]);

  useEffect(() => {
    const root = document.querySelector('.ss-oasis');
    if (!root) return;

    if (isDesktop && inView) {
      root.classList.add('is-csr-cinema-active');
    } else {
      root.classList.remove('is-csr-cinema-active');
    }

    return () => {
      root.classList.remove('is-csr-cinema-active');
    };
  }, [isDesktop, inView]);

  if (!slides.length || !isDesktop) return null;

  return (
    <section
      ref={sectionRef}
      className="ss-csr-cinema"
      aria-label="Shanti Sarovar CSR image gallery"
    >
      <div className="ss-csr-cinema__media" aria-hidden="true">
        <HomeHeroSlideshow slides={slides} ordered />
      </div>
      <div className="ss-csr-cinema__wash" aria-hidden="true" />
      <div className="ss-csr-cinema__particles" aria-hidden="true">
        <HomeHeroParticles />
      </div>
      <div className="ss-csr-cinema__vignette" aria-hidden="true" />
    </section>
  );
}
