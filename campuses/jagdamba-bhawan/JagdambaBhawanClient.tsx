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
  Navigation,
  TreePine,
} from 'lucide-react';
import { JB_CONTENT, JB_MAP_EMBED_URL, JB_MAPS_URL, type MediaSlot } from './content';
import { JB_ABOUT_HREF, JB_CONTACT_HREF } from './nav';
import type { JbHomePageData } from './jb-home-data';
import type { JbTestimonialsData } from './jb-testimonials-data';
import { HomeTestimonials } from './HomeTestimonials';
import { HomeHeroSlideshow } from './HomeHeroSlideshow';
import { HomeHeroParticles } from './HomeHeroParticles';
import { HomeAmbientVideo } from './HomeAmbientVideo';
import { HomeCoursesCarousel } from './HomeCoursesCarousel';

const c = JB_CONTENT;

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
      <div className={`jb-media ${aspect} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.src} alt={media.alt} loading="lazy" decoding="async" />
      </div>
    );
  }

  return (
    <div className={`jb-media ${aspect} ${className}`} role="img" aria-label={media.alt}>
      <div className="absolute inset-0 jb-placeholder-bg" />
      <div className="absolute inset-0 jb-placeholder-sheen" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center">
        <TreePine className="w-6 h-6 text-[var(--jb-gold)]/80" aria-hidden />
        <p className="text-sm md:text-base font-semibold text-[var(--jb-ink)]/85">
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

export default function JagdambaBhawanClient({
  eventsTeaser,
  newsTeaser,
  home,
  testimonials,
}: {
  eventsTeaser?: React.ReactNode;
  newsTeaser?: React.ReactNode;
  home?: JbHomePageData | null;
  testimonials?: JbTestimonialsData | null;
}) {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.9], [1, reduce ? 1 : 0.35]);

  const mapsUrl = JB_MAPS_URL;
  const heroSlides = home?.heroSlides ?? [];
  const heroSlidesMobile = home?.heroSlidesMobile ?? [];
  const aboutImage = home?.aboutImage ?? null;
  const courses = home?.courses?.length ? home.courses : c.courses.items;
  const galleryThumbs = home?.galleryThumbs?.length
    ? home.galleryThumbs
    : c.galleryGlimpse.thumbs;
  const cinematic = heroSlides.length > 0 || heroSlidesMobile.length > 0;
  const videoEmbedUrl = home?.videoEmbedUrl ?? null;
  const tribute = home?.tribute ?? null;

  return (
    <div>
      <section
        ref={heroRef}
        className={`jb-hero${cinematic ? ' jb-hero--cinema' : ''}`}
      >
        <motion.div style={{ opacity: heroOpacity }} className="jb-hero__media">
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
        <div className="jb-hero__wash" />
        {cinematic ? <HomeHeroParticles /> : null}

        <div className="jb-container jb-hero__content">
          <motion.p
            className="jb-hero__brand"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {c.brand}
          </motion.p>
          <motion.p
            className="jb-hero__tag"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            {c.tagline}
          </motion.p>
          <motion.p
            className="jb-hero__support"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            {c.hero.support}
          </motion.p>
          <motion.div
            className="jb-hero__actions"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link href={JB_CONTACT_HREF} className="jb-btn jb-btn--primary">
              Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => scrollToId('visit')}
              className="jb-btn jb-btn--ghost"
            >
              {c.hero.ctaSecondary}
            </button>
          </motion.div>
        </div>

        <button
          type="button"
          onClick={() => scrollToId('about')}
          className="jb-hero__scroll"
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

      <section id="about" className="jb-section jb-section--campus jb-home-about">
        <div className="jb-container">
          <div className="jb-campus">
            <Reveal className="jb-campus__visual">
              <div className="jb-campus__sticky">
                <MediaPlaceholder
                  media={
                    aboutImage
                      ? {
                          id: aboutImage.id,
                          src: aboutImage.srcDesktop || aboutImage.src,
                          alt: aboutImage.alt,
                          label: aboutImage.label,
                        }
                      : c.about.media
                  }
                  aspect=""
                  className="jb-campus__photo"
                />
              </div>
            </Reveal>

            <div className="jb-campus__story">
              <Reveal>
                <p className="jb-eyebrow">{c.about.eyebrow || 'The campus'}</p>
                <h2 className="jb-heading jb-campus__title">{c.about.title}</h2>
                <span className="jb-rule" />
              </Reveal>

              <Reveal delay={0.04}>
                <ul className="jb-campus__metrics" aria-label="Campus at a glance">
                  {c.about.stats.map((stat) => (
                    <li key={stat.label}>
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={0.08}>
                <article className="jb-campus__chapter">
                  <header className="jb-campus__chapter-head">
                    <span className="jb-campus__chapter-n" aria-hidden>
                      01
                    </span>
                    <h3>The place</h3>
                  </header>
                  <p>{c.about.body}</p>
                </article>
              </Reveal>

              {c.about.body2 ? (
                <Reveal delay={0.12}>
                  <article className="jb-campus__chapter">
                    <header className="jb-campus__chapter-head">
                      <span className="jb-campus__chapter-n" aria-hidden>
                        02
                      </span>
                      <h3>The spirit</h3>
                    </header>
                    <p>{c.about.body2}</p>
                  </article>
                </Reveal>
              ) : null}

              <Reveal delay={0.16}>
                <Link href={JB_ABOUT_HREF} className="jb-campus__more">
                  Know more about the campus
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {eventsTeaser}

      {videoEmbedUrl ? <HomeAmbientVideo embedUrl={videoEmbedUrl} /> : null}

      <section id="courses" className="jb-section jb-section--alt jb-home-courses">
        <div className="jb-container">
          <Reveal>
            <div className="jb-home-courses__head">
              <div>
                <p className="jb-eyebrow">Learning</p>
                <h2 className="jb-heading">{c.courses.title}</h2>
                <span className="jb-rule" />
              </div>
              <Link href={JB_CONTACT_HREF} className="jb-home-courses__all">
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

      <section id="gallery" className="jb-section jb-section--alt jb-home-gallery">
        <div className="jb-container">
          <Reveal>
            <div className="jb-home-gallery__head">
              <div>
                <p className="jb-eyebrow">Glimpse</p>
                <h2 className="jb-heading">{c.galleryGlimpse.title}</h2>
                <span className="jb-rule" />
              </div>
              <Link href={c.galleryGlimpse.href} className="jb-home-gallery__all">
                {c.galleryGlimpse.cta}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal>

          <HomeCoursesCarousel
            ariaLabel="Photo gallery"
            peek="roomy"
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

      <section id="visit" className="jb-section jb-section--tone jb-home-visit">
        <div className="jb-container">
          <Reveal>
            <div className="jb-home-visit__layout">
              <div className="jb-home-visit__copy">
                <p className="jb-eyebrow">Visit</p>
                <h2 className="jb-heading !mb-0">{c.visit.title}</h2>
                <span className="jb-rule" />
                <p className="jb-lede !max-w-md mt-3">{c.visit.support}</p>
                <div className="jb-home-visit__actions">
                  <Link href={JB_CONTACT_HREF} className="jb-btn jb-btn--primary !min-h-10 !text-sm">
                    {c.visit.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jb-btn jb-btn--ink !min-h-10 !text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Maps
                  </a>
                </div>
              </div>
              <div className="jb-home-visit__map jb-media">
                <iframe
                  title="Jagdamba Bhawan map"
                  src={JB_MAP_EMBED_URL}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {testimonials ? <HomeTestimonials data={testimonials} /> : null}

      {tribute ? (
        <section id="tribute" className="jb-section jb-tribute" aria-label="Tribute to Dadi Janki">
          {!reduce ? (
            <div className="jb-tribute__particles" aria-hidden>
              <HomeHeroParticles />
            </div>
          ) : null}
          <div className="jb-container jb-tribute__grid">
            <Reveal className="jb-tribute__portrait">
              <figure className="jb-tribute__frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tribute.imageSrc}
                  alt={tribute.imageAlt}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </Reveal>
            <Reveal delay={0.06} className="jb-tribute__copy">
              <p className="jb-eyebrow jb-tribute__eyebrow">{tribute.eyebrow}</p>
              <h2 className="jb-heading jb-tribute__title">{tribute.title}</h2>
              <span className="jb-rule jb-tribute__rule" />
              <p className="jb-lede jb-tribute__body">{tribute.body}</p>
            </Reveal>
          </div>
        </section>
      ) : null}
    </div>
  );
}
