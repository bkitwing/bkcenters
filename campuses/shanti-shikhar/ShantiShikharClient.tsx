'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight, Navigation } from 'lucide-react';
import {
  SHK_CONTENT,
  SHK_INAUGURATION_HREF,
  SHK_MAP_EMBED_URL,
  SHK_MAPS_URL,
} from './content';
import { SHK_CONTACT_HREF, SHK_GALLERIES_HREF } from './nav';
import { HomeAmbientVideo } from './HomeAmbientVideo';
import { HomeCoursesCarousel } from './HomeCoursesCarousel';
import { HomeHeroParticles } from './HomeHeroParticles';

const c = SHK_CONTENT;
const INAUGURATION_EMBED = 'https://www.youtube.com/embed/ND8twQVtplw';

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function MediaPlaceholder({
  alt,
  label,
  className = '',
}: {
  alt: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`shk-media ${className}`} role="img" aria-label={alt}>
      <div className="absolute inset-0 shk-placeholder-bg" />
      <div className="absolute inset-0 shk-placeholder-sheen" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center">
        <p className="text-sm md:text-base font-semibold text-[var(--shk-ink)]/85">{label}</p>
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

const CHAPTERS = [
  { n: '01', title: 'The place', body: c.about.paragraphs[0] },
  { n: '02', title: 'The learning', body: c.about.paragraphs[1] },
  { n: '03', title: 'The purpose', body: c.about.paragraphs[2] },
] as const;

export default function ShantiShikharClient({
  newsTeaser,
}: {
  newsTeaser?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.9], [1, reduce ? 1 : 0.35]);

  const galleryThumbs = [
    c.hero.media,
    c.about.media,
    ...c.inauguration.slides,
    ...c.facilities.items.map((item) => item.media),
  ];

  return (
    <div>
      <section ref={heroRef} className="shk-hero shk-hero--cinema">
        <motion.div style={{ opacity: heroOpacity }} className="shk-hero__media">
          <div className="shk-hero__fallback" aria-hidden />
        </motion.div>
        <div className="shk-hero__wash" />
        <HomeHeroParticles />

        <div className="shk-container shk-hero__content">
          <motion.p
            className="shk-hero__brand"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {c.brand}
          </motion.p>
          <motion.p
            className="shk-hero__tag"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            {c.tagline}
          </motion.p>
          <motion.h1
            className="shk-hero__headline"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            {c.about.title}
          </motion.h1>
          <motion.p
            className="shk-hero__support"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            {c.location}
          </motion.p>
          <motion.div
            className="shk-hero__actions"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Link href={SHK_CONTACT_HREF} className="shk-btn shk-btn--primary">
              Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button type="button" onClick={() => scrollToId('courses')} className="shk-btn shk-btn--ghost">
              {c.hero.ctaSecondary}
            </button>
          </motion.div>
        </div>

        <button type="button" onClick={() => scrollToId('about')} className="shk-hero__scroll" aria-label="Scroll to about">
          <motion.span
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
            className="inline-flex"
          >
            <ArrowDown className="w-5 h-5" />
          </motion.span>
        </button>
      </section>

      <section id="about" className="shk-section shk-section--campus shk-home-about">
        <div className="shk-container">
          <div className="shk-campus">
            <Reveal className="shk-campus__visual">
              <div className="shk-campus__sticky">
                <MediaPlaceholder
                  alt={c.about.media.alt}
                  label={c.about.media.label}
                  className="shk-campus__photo"
                />
              </div>
            </Reveal>

            <div className="shk-campus__story">
              <Reveal>
                <p className="shk-eyebrow">{c.about.eyebrow}</p>
                <h2 className="shk-heading shk-campus__title">{c.about.title}</h2>
                <span className="shk-rule" />
              </Reveal>

              <Reveal delay={0.04}>
                <ul className="shk-campus__metrics" aria-label="Campus at a glance">
                  {c.about.stats.map((stat) => (
                    <li key={stat.label}>
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              {CHAPTERS.map((chapter, index) => (
                <Reveal key={chapter.n} delay={0.08 + index * 0.04}>
                  <article className="shk-campus__chapter">
                    <header className="shk-campus__chapter-head">
                      <span className="shk-campus__chapter-n" aria-hidden>
                        {chapter.n}
                      </span>
                      <h3>{chapter.title}</h3>
                    </header>
                    <p>{chapter.body}</p>
                    {index === CHAPTERS.length - 1 ? (
                      <a
                        href={SHK_INAUGURATION_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shk-home-story-link"
                      >
                        {c.inauguration.cta}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HomeAmbientVideo
        embedUrl={INAUGURATION_EMBED}
        title={c.inauguration.title}
        lede={c.inauguration.subtitle}
      />

      <section id="courses" className="shk-section shk-section--alt shk-home-courses">
        <div className="shk-container">
          <Reveal>
            <div className="shk-home-courses__head">
              <div>
                <p className="shk-eyebrow">{c.services.eyebrow}</p>
                <h2 className="shk-heading">{c.services.title}</h2>
                <span className="shk-rule" />
              </div>
              <Link href={SHK_CONTACT_HREF} className="shk-home-courses__all">
                Enquire about a course
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal>
          <p className="shk-lede !max-w-3xl">{c.services.intro}</p>
          <HomeCoursesCarousel
            ariaLabel="Services"
            items={c.services.items.map((item) => ({
              id: item.id,
              title: item.title,
              blurb: item.text,
              src: null,
              alt: item.title,
            }))}
          />
        </div>
      </section>

      <section id="facilities" className="shk-section shk-home-courses">
        <div className="shk-container">
          <Reveal>
            <div className="shk-home-courses__head">
              <div>
                <p className="shk-eyebrow">{c.facilities.eyebrow}</p>
                <h2 className="shk-heading">{c.facilities.title}</h2>
                <span className="shk-rule" />
              </div>
              <Link href={SHK_GALLERIES_HREF} className="shk-home-courses__all">
                {c.facilities.galleryCta}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal>
          <HomeCoursesCarousel
            ariaLabel="Facilities"
            items={c.facilities.items.map((item) => ({
              id: item.id,
              title: item.title,
              blurb: item.text,
              src: item.media.src,
              alt: item.media.alt,
            }))}
          />
        </div>
      </section>

      {newsTeaser}

      <section id="gallery" className="shk-section shk-section--alt shk-home-gallery">
        <div className="shk-container">
          <Reveal>
            <div className="shk-home-gallery__head">
              <div>
                <p className="shk-eyebrow">Glimpse</p>
                <h2 className="shk-heading">Campus in pictures</h2>
                <span className="shk-rule" />
              </div>
              <Link href={SHK_GALLERIES_HREF} className="shk-home-gallery__all">
                {c.facilities.galleryCta}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal>
          <HomeCoursesCarousel
            ariaLabel="Photo gallery"
            peek="roomy"
            items={galleryThumbs.map((thumb) => ({
              id: thumb.id,
              title: thumb.label,
              src: thumb.src,
              alt: thumb.alt,
              href: SHK_GALLERIES_HREF,
            }))}
          />
        </div>
      </section>

      <section id="visit" className="shk-section shk-home-visit">
        <div className="shk-container">
          <Reveal>
            <div className="shk-home-visit__layout">
              <div className="shk-home-visit__copy">
                <p className="shk-eyebrow">Visit</p>
                <h2 className="shk-heading !mb-0">{c.visit.title}</h2>
                <span className="shk-rule" />
                <p className="shk-lede !max-w-md mt-3">
                  {c.city.subtitle}. {c.city.welcome}
                </p>
                <p className="shk-lede !max-w-md">{c.visit.address}</p>
                <div className="shk-home-visit__actions">
                  <Link href={SHK_CONTACT_HREF} className="shk-btn shk-btn--primary !min-h-10 !text-sm">
                    {c.visit.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href={SHK_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shk-btn shk-btn--ink !min-h-10 !text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Maps
                  </a>
                </div>
              </div>
              <div className="shk-home-visit__map shk-media">
                <iframe
                  title="Shanti Shikhar map"
                  src={SHK_MAP_EMBED_URL}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
