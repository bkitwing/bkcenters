'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { SsHomeImage } from '../ss-home-data';

import 'swiper/css';

const HOLD_MS = 8500;
const SPEED_MS = 2800;

export function CsrCinemaSlideshow({
  slides,
  active = true,
}: {
  slides: SsHomeImage[];
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

  if (slides.length < 1) return null;

  return (
    <Swiper
      className="ss-csr-swiper"
      modules={[Autoplay]}
      slidesPerView={1}
      spaceBetween={0}
      speed={reduce ? 600 : SPEED_MS}
      loop={slides.length > 1}
      allowTouchMove
      grabCursor
      autoplay={
        slides.length > 1
          ? {
              delay: HOLD_MS,
              disableOnInteraction: false,
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
            src={slide.srcDesktop || slide.src}
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
