'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { HomeHeroParticles } from '../HomeHeroParticles';
import type { SsHomeImage } from '../ss-home-data';
import { CsrCinemaSlideshow } from './CsrCinemaSlideshow';

export const CSR_CINEMA_HASH = 'csr-cinema';

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

function currentHash() {
  return window.location.hash.replace(/^#/, '');
}

function setHash(id: string | null) {
  const { pathname, search, hash } = window.location;
  const next = id ? `#${id}` : '';
  if (hash === next || (!id && !hash)) return;
  window.history.replaceState(window.history.state, '', `${pathname}${search}${next}`);
}

function scrollToCinema(el: HTMLElement, behavior: ScrollBehavior = 'smooth') {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior, block: 'start' });
    });
  });
}

/**
 * Full-viewport cinema band (desktop via CSS).
 * Shell always in the DOM so `/csr#csr-cinema` deep links work; URL hash syncs on scroll.
 */
export function CsrCinemaGallery({ slides }: { slides: SsHomeImage[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isDesktop = useIsDesktop();
  const [inView, setInView] = useState(false);
  const skipUrlSync = useRef(false);

  // Deep-link: /csr#csr-cinema
  useEffect(() => {
    if (!slides.length) return;
    const el = sectionRef.current;
    if (!el) return;

    const go = (behavior: ScrollBehavior = 'smooth') => {
      if (currentHash() !== CSR_CINEMA_HASH) return;
      if (!window.matchMedia(DESKTOP_MQ).matches) return;
      skipUrlSync.current = true;
      scrollToCinema(el, behavior);
      window.setTimeout(() => {
        skipUrlSync.current = false;
      }, 900);
    };

    go('auto');
    const t = window.setTimeout(() => go('smooth'), 150);

    const onHash = () => go('smooth');
    window.addEventListener('hashchange', onHash);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('hashchange', onHash);
    };
  }, [slides.length]);

  useEffect(() => {
    if (!slides.length) return;
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(Boolean(entry?.isIntersecting && (entry.intersectionRatio ?? 0) >= 0.28));
      },
      { threshold: [0, 0.28, 0.45, 0.7, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [slides.length]);

  useEffect(() => {
    if (!isDesktop || skipUrlSync.current) return;
    if (inView) setHash(CSR_CINEMA_HASH);
    else if (currentHash() === CSR_CINEMA_HASH) setHash(null);
  }, [inView, isDesktop]);

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
