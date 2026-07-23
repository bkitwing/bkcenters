'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useReducedMotion } from 'motion/react';
import type { JbHomeImage } from './jb-home-data';

const FADE_MS = 1200;
const REDUCED_MOTION_MS = 6000;
/** Mobile: Ken Burns CSS is disabled — advance on a fixed interval instead. */
const MOBILE_SLIDE_MS = 5500;
const MOBILE_MQ = '(max-width: 767px)';

function subscribeMobile(cb: () => void) {
  const mq = window.matchMedia(MOBILE_MQ);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_MQ).matches;
}

function getServerMobileSnapshot() {
  return false;
}

function useIsMobileViewport() {
  return useSyncExternalStore(subscribeMobile, getMobileSnapshot, getServerMobileSnapshot);
}

function slideUrls(slide: JbHomeImage) {
  const desktop = slide.srcDesktop || slide.src;
  const mobile = slide.srcMobile || slide.thumbSrc || slide.src;
  return { desktop, mobile };
}

function preferredUrl(slide: JbHomeImage, isMobile: boolean) {
  const { desktop, mobile } = slideUrls(slide);
  return isMobile ? mobile : desktop;
}

function identityOrder(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}

/** Shuffle slides 1…n-1; keep 0 first for stable LCP + hydration. */
function shuffleOrder(length: number): number[] {
  if (length <= 1) return length ? [0] : [];
  const rest = Array.from({ length: length - 1 }, (_, i) => i + 1);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [0, ...rest];
}

function preloadSlide(slide: JbHomeImage, isMobile: boolean): Promise<void> {
  const url = preferredUrl(slide, isMobile);
  if (!url || typeof window === 'undefined') return Promise.resolve();

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    const finish = () => {
      void img.decode?.().then(() => resolve()).catch(() => resolve());
    };
    img.onload = finish;
    img.onerror = () => resolve();
    img.src = url;
    if (img.complete) finish();
  });
}

/**
 * Hero slideshow: Ken Burns completes → crossfade to next (random shuffled deck).
 * Desktop uses `slides` (Hero Section); phones use `mobileSlides` (Hero Mobile) when present.
 */
export function HomeHeroSlideshow({
  slides,
  mobileSlides,
}: {
  slides: JbHomeImage[];
  mobileSlides?: JbHomeImage[];
}) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobileViewport();
  const deckKey = isMobile && mobileSlides && mobileSlides.length > 0 ? 'mobile' : 'desktop';
  const deck =
    deckKey === 'mobile' && mobileSlides ? mobileSlides : slides;
  const total = deck.length;
  const [order, setOrder] = useState<number[]>(() => identityOrder(total));
  const [ready, setReady] = useState(false);

  const [pos, setPos] = useState(0);
  const [exitingSlide, setExitingSlide] = useState<number | null>(null);
  const transitioningRef = useRef(false);
  const posRef = useRef(0);

  // Reset deck when viewport or gallery set changes (mobile ↔ desktop).
  useEffect(() => {
    setPos(0);
    setExitingSlide(null);
    transitioningRef.current = false;
    setOrder(shuffleOrder(total));
    setReady(true);
  }, [total, deckKey]);

  const activeSlide = order[pos] ?? 0;
  const nextPos = total > 1 ? (pos + 1) % total : 0;
  const nextSlide = order[nextPos] ?? 0;
  posRef.current = pos;

  const advance = useCallback(async () => {
    if (total < 2 || transitioningRef.current) return;

    const curPos = posRef.current;
    const targetPos = (curPos + 1) % total;
    const fromSlide = order[curPos] ?? 0;
    const toSlide = order[targetPos] ?? 0;
    if (fromSlide === toSlide) return;

    transitioningRef.current = true;
    await preloadSlide(deck[toSlide], isMobile);

    setExitingSlide(fromSlide);
    setPos(targetPos);
  }, [deck, isMobile, order, total]);

  const onExitFadeEnd = useCallback(
    (slideIndex: number, e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== 'opacity' || exitingSlide !== slideIndex) return;
      setExitingSlide(null);
      transitioningRef.current = false;
    },
    [exitingSlide]
  );

  const onKenBurnsEnd = useCallback(
    (slideIndex: number, e: React.AnimationEvent<HTMLImageElement>) => {
      if (!ready || reduce || e.animationName !== 'jb-hero-kenburns') return;
      if (slideIndex !== activeSlide || transitioningRef.current) return;
      void advance();
    },
    [activeSlide, advance, ready, reduce]
  );

  useEffect(() => {
    const upcoming = deck[nextSlide];
    if (upcoming) void preloadSlide(upcoming, isMobile);
  }, [deck, isMobile, nextSlide]);

  useEffect(() => {
    if (!ready || !reduce || total < 2) return;
    const id = window.setInterval(() => void advance(), REDUCED_MOTION_MS);
    return () => window.clearInterval(id);
  }, [advance, ready, reduce, total]);

  // Mobile: no Ken Burns animationend — use interval to crossfade.
  useEffect(() => {
    if (!ready || reduce || !isMobile || total < 2) return;
    const id = window.setInterval(() => void advance(), MOBILE_SLIDE_MS);
    return () => window.clearInterval(id);
  }, [advance, isMobile, ready, reduce, total]);

  useEffect(() => {
    if (exitingSlide == null) return;
    const id = window.setTimeout(() => {
      setExitingSlide(null);
      transitioningRef.current = false;
    }, FADE_MS + 300);
    return () => window.clearTimeout(id);
  }, [exitingSlide, activeSlide]);

  if (total === 0) {
    return <div className="jb-hero-slides jb-hero-slides--empty" aria-hidden />;
  }

  return (
    <div className="jb-hero-slides" aria-hidden>
      {deck.map((slide, i) => {
        const active = i === activeSlide;
        const exiting = i === exitingSlide;
        const shouldMount = active || exiting || i === nextSlide;

        if (!shouldMount) {
          return <div key={slide.id} className="jb-hero-slide" data-deferred />;
        }

        const { desktop, mobile } = slideUrls(slide);
        const isLcp = i === (order[0] ?? 0);

        return (
          <div
            key={`${deckKey}-${slide.id}`}
            className={`jb-hero-slide${active ? ' is-active' : ''}${
              exiting ? ' is-exiting' : ''
            }${reduce ? '' : ' has-kenburns'}`}
            onTransitionEnd={(e) => onExitFadeEnd(i, e)}
          >
            {deckKey === 'mobile' ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={preferredUrl(slide, true)}
                alt=""
                width={slide.width}
                height={slide.height}
                decoding="async"
                loading={isLcp ? 'eager' : 'lazy'}
                fetchPriority={isLcp ? 'high' : 'low'}
                className="jb-hero-slide__img"
                onAnimationEnd={(e) => onKenBurnsEnd(i, e)}
              />
            ) : (
              <picture>
                <source media="(max-width: 767px)" srcSet={mobile} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={desktop}
                  alt=""
                  width={slide.width}
                  height={slide.height}
                  decoding="async"
                  loading={isLcp ? 'eager' : 'lazy'}
                  fetchPriority={isLcp ? 'high' : 'low'}
                  className="jb-hero-slide__img"
                  onAnimationEnd={(e) => onKenBurnsEnd(i, e)}
                />
              </picture>
            )}
          </div>
        );
      })}
    </div>
  );
}
