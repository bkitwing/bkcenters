'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { Autoplay, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { SsHomeImage } from '../ss-home-data';

import 'swiper/css';

/** Longer dwell + slow glide — cinema TV pacing */
const HOLD_MS = 8500;
const SPEED_MS = 2800;
const REDUCED_HOLD_MS = 9000;
const REDUCED_SPEED_MS = 600;

function slideUrl(slide: SsHomeImage) {
  return slide.srcDesktop || slide.src;
}

/**
 * Swiper track slideshow — outgoing + incoming move in parallel (true slide).
 * Still frames while resting; no Ken Burns zoom.
 */
export function CsrCinemaSlideshow({
  slides,
  active = true,
}: {
  slides: SsHomeImage[];
  /** Pause autoplay when the cinema band is off-screen. */
  active?: boolean;
}) {
  const reduce = useReducedMotion();
  const swiperRef = useRef<SwiperInstance | null>(null);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper?.autoplay) return;
    if (active) swiper.autoplay.start();
    else swiper.autoplay.stop();
  }, [active]);

  if (!slides.length) {
    return <div className="ss-csr-swiper ss-csr-swiper--empty" aria-hidden />;
  }

  const hold = reduce ? REDUCED_HOLD_MS : HOLD_MS;
  const speed = reduce ? REDUCED_SPEED_MS : SPEED_MS;

  return (
    <Swiper
      className="ss-csr-swiper"
      modules={[Autoplay, A11y]}
      slidesPerView={1}
      spaceBetween={0}
      speed={speed}
      loop={slides.length > 1}
      allowTouchMove
      grabCursor
      resistanceRatio={0.65}
      watchSlidesProgress
      autoplay={
        slides.length > 1
          ? {
              delay: hold,
              disableOnInteraction: false,
              pauseOnMouseEnter: false,
              waitForTransition: true,
            }
          : false
      }
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
        if (!active) swiper.autoplay?.stop();
      }}
      aria-hidden
    >
      {slides.map((slide, i) => (
        <SwiperSlide key={slide.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slideUrl(slide)}
            alt=""
            width={slide.width}
            height={slide.height}
            decoding="async"
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
            className="ss-csr-swiper__img"
            draggable={false}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
