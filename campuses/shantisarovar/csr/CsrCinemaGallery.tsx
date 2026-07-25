'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { HomeHeroParticles } from '../HomeHeroParticles';
import type { SsHomeImage } from '../ss-home-data';
import { CsrCinemaSlideshow } from './CsrCinemaSlideshow';

export const CSR_CINEMA_HASH = 'csr-cinema';
const DESKTOP_MQ = '(min-width: 768px)';

function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(DESKTOP_MQ);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(DESKTOP_MQ).matches,
    () => false
  );
}

function setCinemaHash(on: boolean) {
  const { pathname, search, hash } = window.location;
  const next = on ? `#${CSR_CINEMA_HASH}` : '';
  if (hash === next || (!on && !hash)) return;
  window.history.replaceState(window.history.state, '', `${pathname}${search}${next}`);
}

/**
 * Desktop cinema band. Shell stays in the DOM for `#csr-cinema` deep links.
 */
export function CsrCinemaGallery({ slides }: { slides: SsHomeImage[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();
  const [inView, setInView] = useState(false);
  const skipUrlSync = useRef(false);

  useEffect(() => {
    if (!slides.length) return;
    const el = sectionRef.current;
    if (!el) return;

    const scrollIfHashed = () => {
      if (window.location.hash !== `#${CSR_CINEMA_HASH}`) return;
      if (!window.matchMedia(DESKTOP_MQ).matches) return;
      skipUrlSync.current = true;
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
          skipUrlSync.current = false;
        }, 900);
      });
    };

    const t = window.setTimeout(scrollIfHashed, 80);
    window.addEventListener('hashchange', scrollIfHashed);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('hashchange', scrollIfHashed);
    };
  }, [slides.length]);

  useEffect(() => {
    if (!slides.length) return;
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(
          entry?.isIntersecting && (entry.intersectionRatio ?? 0) >= 0.28
        );
        setInView(visible);
      },
      { threshold: [0, 0.28, 0.5, 0.8] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [slides.length]);

  useEffect(() => {
    const root = document.querySelector('.ss-oasis');
    if (isDesktop && inView) {
      if (!skipUrlSync.current) setCinemaHash(true);
      root?.classList.add('is-csr-cinema-active');
    } else {
      if (!skipUrlSync.current && window.location.hash === `#${CSR_CINEMA_HASH}`) {
        setCinemaHash(false);
      }
      root?.classList.remove('is-csr-cinema-active');
    }
    return () => root?.classList.remove('is-csr-cinema-active');
  }, [inView, isDesktop]);

  if (!slides.length) return null;

  return (
    <section
      id={CSR_CINEMA_HASH}
      ref={sectionRef}
      className="ss-csr-cinema"
      aria-label="Shanti Sarovar CSR image gallery"
    >
      <div className="ss-csr-cinema__media" aria-hidden="true">
        <CsrCinemaSlideshow slides={slides} active={isDesktop && inView} />
      </div>
      <div className="ss-csr-cinema__wash" aria-hidden="true" />
      <div className="ss-csr-cinema__particles" aria-hidden="true">
        <HomeHeroParticles />
      </div>
      <div className="ss-csr-cinema__vignette" aria-hidden="true" />
    </section>
  );
}
