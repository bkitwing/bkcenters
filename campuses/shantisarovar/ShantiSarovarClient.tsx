'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  MapPin,
  Navigation,
  TreePine,
} from 'lucide-react';
import { SS_CENTER, SS_CONTENT, type MediaSlot } from './content';
import { SS_CONTACT_HREF } from './nav';
import type { SsHomePageData } from './ss-home-data';
import { HomeHeroSlideshow } from './HomeHeroSlideshow';
import { HomeHeroParticles } from './HomeHeroParticles';
import { HomeCoursesCarousel } from './HomeCoursesCarousel';

const c = SS_CONTENT;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function MediaPlaceholder({
  media,
  className = '',
  aspect = 'aspect-[4/5]',
}: {
  media: MediaSlot;
  className?: string;
  aspect?: string;
}) {
  if (media.src) {
    return (
      <div className={`ss-media ${aspect} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.src} alt={media.alt} loading="lazy" decoding="async" />
      </div>
    );
  }

  return (
    <div className={`ss-media ${aspect} ${className}`} role="img" aria-label={media.alt}>
      <div className="absolute inset-0 ss-placeholder-bg" />
      <div className="absolute inset-0 ss-placeholder-sheen" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center">
        <TreePine className="w-6 h-6 text-[var(--ss-gold)]/80" aria-hidden />
        <p className="text-sm md:text-base font-semibold text-[var(--ss-ink)]/85">
          {media.label || 'Campus view'}
        </p>
      </div>
    </div>
  );
}

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
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export default function ShantiSarovarClient({
  eventsTeaser,
  newsTeaser,
  home,
}: {
  eventsTeaser?: React.ReactNode;
  newsTeaser?: React.ReactNode;
  home?: SsHomePageData | null;
}) {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.9], [1, reduce ? 1 : 0.35]);

  const mapsUrl = `https://www.google.com/maps?q=${SS_CENTER.coords[0]},${SS_CENTER.coords[1]}`;
  const heroSlides = home?.heroSlides ?? [];
  const heroSlidesMobile = home?.heroSlidesMobile ?? [];
  const courses = home?.courses?.length ? home.courses : c.courses.items;
  const galleryThumbs = home?.galleryThumbs?.length
    ? home.galleryThumbs
    : c.galleryGlimpse.thumbs;
  const cinematic = heroSlides.length > 0 || heroSlidesMobile.length > 0;

  return (
    <div>
      <section
        ref={heroRef}
        className={`ss-hero${cinematic ? ' ss-hero--cinema' : ''}`}
      >
        <motion.div style={{ opacity: heroOpacity }} className="ss-hero__media">
          {cinematic ? (
            <HomeHeroSlideshow slides={heroSlides} mobileSlides={heroSlidesMobile} />
          ) : (
            <div className="absolute inset-0">
              <MediaPlaceholder
                media={c.hero.media}
                aspect="aspect-auto h-full min-h-[100svh]"
                className="!rounded-none !border-0 !shadow-none"
              />
            </div>
          )}
        </motion.div>
        <div className="ss-hero__wash" />
        {cinematic ? <HomeHeroParticles /> : null}

        <div className="ss-container ss-hero__content">
          <motion.p
            className="ss-hero__brand"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {c.brand}
          </motion.p>
          <motion.p
            className="ss-hero__tag"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            {c.tagline}
          </motion.p>
          <motion.h1
            className="ss-hero__headline"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            {c.hero.headline}
          </motion.h1>
          <motion.p
            className="ss-hero__support"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            {c.hero.support}
          </motion.p>
          <motion.div
            className="ss-hero__actions"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Link href={SS_CONTACT_HREF} className="ss-btn ss-btn--primary">
              Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => scrollToId('visit')}
              className="ss-btn ss-btn--ghost"
            >
              {c.hero.ctaSecondary}
            </button>
          </motion.div>
        </div>

        <button
          type="button"
          onClick={() => scrollToId('about')}
          className="ss-hero__scroll"
          aria-label="Scroll to about"
        >
          <motion.span
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
            className="inline-flex"
          >
            <ArrowDown className="w-5 h-5" />
          </motion.span>
        </button>
      </section>

      <section id="about" className="ss-section ss-section--campus ss-home-about">
        <div className="ss-container">
          <div className="ss-campus">
            <Reveal className="ss-campus__visual">
              <div className="ss-campus__sticky">
                <MediaPlaceholder
                  media={
                    heroSlides[2]
                      ? {
                          id: heroSlides[2].id,
                          src: heroSlides[2].thumbSrc || heroSlides[2].src,
                          alt: heroSlides[2].alt,
                          label: heroSlides[2].label,
                        }
                      : c.about.media
                  }
                  aspect="aspect-square md:aspect-[4/5]"
                  className="ss-campus__photo"
                />
                <ul className="ss-campus__metrics" aria-label="Campus at a glance">
                  {c.about.stats.map((stat) => (
                    <li key={stat.label}>
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <div className="ss-campus__story">
              <Reveal>
                <p className="ss-eyebrow">{c.about.eyebrow || 'The campus'}</p>
                <h2 className="ss-heading ss-campus__title">{c.about.title}</h2>
                <span className="ss-rule" />
              </Reveal>

              <Reveal delay={0.05}>
                <article className="ss-campus__chapter">
                  <header className="ss-campus__chapter-head">
                    <span className="ss-campus__chapter-n" aria-hidden>
                      01
                    </span>
                    <h3>The place</h3>
                  </header>
                  <p>{c.about.body}</p>
                </article>
              </Reveal>

              {c.about.body2 ? (
                <Reveal delay={0.1}>
                  <article className="ss-campus__chapter">
                    <header className="ss-campus__chapter-head">
                      <span className="ss-campus__chapter-n" aria-hidden>
                        02
                      </span>
                      <h3>The spirit</h3>
                    </header>
                    <p>{c.about.body2}</p>
                  </article>
                </Reveal>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {eventsTeaser}

      <section id="courses" className="ss-section ss-section--alt ss-home-courses">
        <div className="ss-container">
          <Reveal>
            <div className="ss-home-courses__head">
              <div>
                <p className="ss-eyebrow">Learning</p>
                <h2 className="ss-heading">{c.courses.title}</h2>
                <span className="ss-rule" />
              </div>
              <Link href={SS_CONTACT_HREF} className="ss-home-courses__all">
                Enquire about a course
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal>

          <HomeCoursesCarousel
            items={courses.map((item) => {
              const src =
                'image' in item && item.image
                  ? item.image.thumbSrc || item.image.src
                  : item.media?.src || null;
              const alt =
                'image' in item && item.image
                  ? item.image.alt
                  : item.media?.alt || item.title;
              return {
                id: item.id,
                title: item.title,
                blurb: item.blurb,
                src,
                alt,
              };
            })}
          />
        </div>
      </section>

      {newsTeaser}

      <section id="gallery" className="ss-section ss-section--alt ss-home-gallery">
        <div className="ss-container">
          <Reveal>
            <div className="ss-home-gallery__head">
              <div>
                <p className="ss-eyebrow">Glimpse</p>
                <h2 className="ss-heading">{c.galleryGlimpse.title}</h2>
                <span className="ss-rule" />
              </div>
              <Link href={c.galleryGlimpse.href} className="ss-home-gallery__all">
                {c.galleryGlimpse.cta}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal>

          <HomeCoursesCarousel
            ariaLabel="Photo gallery"
            items={galleryThumbs.map((thumb) => ({
              id: thumb.id,
              title: thumb.label || 'Gallery',
              src: thumb.src,
              alt: thumb.alt,
              href:
                'href' in thumb && typeof thumb.href === 'string'
                  ? thumb.href
                  : c.galleryGlimpse.href,
            }))}
          />
        </div>
      </section>

      <section id="visit" className="ss-section ss-section--tone ss-home-visit">
        <div className="ss-container">
          <Reveal>
            <div className="ss-home-visit__layout">
              <div className="ss-home-visit__copy">
                <p className="ss-eyebrow">Visit</p>
                <h2 className="ss-heading !mb-0">{c.visit.title}</h2>
                <span className="ss-rule" />
                <p className="ss-lede !max-w-md mt-3">{c.visit.support}</p>

                <ol className="ss-home-visit__steps">
                  <li>
                    <span className="ss-home-visit__step-n">1</span>
                    <span>
                      <strong>Arrive</strong>
                      <em>Gachibowli campus — open for courses &amp; quiet days.</em>
                    </span>
                  </li>
                  <li>
                    <span className="ss-home-visit__step-n">2</span>
                    <span>
                      <strong>Enquire</strong>
                      <em>Share dates or questions — we help you plan.</em>
                    </span>
                  </li>
                  <li>
                    <span className="ss-home-visit__step-n">3</span>
                    <span>
                      <strong>On campus</strong>
                      <em>Meditation, courses, and space to rest the mind.</em>
                    </span>
                  </li>
                </ol>

                <div className="ss-home-visit__actions">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ss-btn ss-btn--primary !min-h-10 !text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Maps
                  </a>
                  <Link href={SS_CONTACT_HREF} className="ss-btn ss-btn--ink !min-h-10 !text-sm">
                    {c.visit.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <aside className="ss-home-visit__card" aria-label="Campus address">
                <p className="ss-home-visit__card-label">
                  <MapPin className="w-4 h-4" aria-hidden /> Destination
                </p>
                <div className="ss-home-visit__address">
                  {c.visit.addressLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  <p className="ss-home-visit__landmark">{c.visit.landmark}</p>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ss-home-visit__maplink"
                >
                  View on Google Maps <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </aside>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
