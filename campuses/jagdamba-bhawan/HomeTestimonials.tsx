'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { JbTestimonialsData } from './jb-testimonials-data';

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function HomeTestimonials({ data }: { data: JbTestimonialsData }) {
  const reduce = useReducedMotion();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [sync, data.videos.length]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-voice-card]');
    const step = card ? card.offsetWidth + 14 : el.clientWidth * 0.7;
    el.scrollBy({ left: dir * step, behavior: reduce ? 'auto' : 'smooth' });
  };

  if (!data.videos.length && !data.body) return null;

  const lede = data.body.split(/\n\n+/)[0] || '';

  return (
    <section
      id="testimonials"
      className="jb-section jb-home-voices"
      aria-label="Testimonials"
    >
      <div className="jb-container">
        <Reveal className="jb-home-voices__head">
          <div className="jb-home-voices__intro">
            <p className="jb-eyebrow">Voices</p>
            <h2 className="jb-heading">{data.title}</h2>
            <span className="jb-rule" />
            {lede ? <p className="jb-lede jb-home-voices__lede">{lede}</p> : null}
          </div>
          <a
            href={data.moreHref}
            target="_blank"
            rel="noopener noreferrer"
            className="jb-home-voices__more"
          >
            More stories
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </Reveal>

        {data.videos.length > 0 ? (
          <Reveal delay={0.06} className="jb-home-voices__carousel">
            <div
              ref={scrollerRef}
              className="jb-home-voices__rail"
              role="list"
              aria-label="Testimonial videos"
            >
              {data.videos.map((v) => {
                const playing = playingId === v.id;
                return (
                  <article
                    key={v.id}
                    className="jb-home-voices__card"
                    role="listitem"
                    data-voice-card
                  >
                    <div className="jb-home-voices__frame">
                      {playing ? (
                        <iframe
                          src={`${v.embedUrl}&autoplay=1`}
                          title="Testimonial video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      ) : (
                        <button
                          type="button"
                          className="jb-home-voices__play"
                          onClick={() => setPlayingId(v.id)}
                          aria-label="Play testimonial video"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={v.thumbSrc}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                          <span className="jb-home-voices__play-btn" aria-hidden>
                            <Play className="h-5 w-5" fill="currentColor" />
                          </span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="jb-home-voices__footer">
              <div className="jb-home-voices__nav" aria-label="Testimonial carousel">
                <button
                  type="button"
                  className="jb-course-carousel__btn"
                  aria-label="Previous testimonial"
                  disabled={!canPrev}
                  onClick={() => scrollByCard(-1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="jb-course-carousel__btn"
                  aria-label="Next testimonial"
                  disabled={!canNext}
                  onClick={() => scrollByCard(1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
