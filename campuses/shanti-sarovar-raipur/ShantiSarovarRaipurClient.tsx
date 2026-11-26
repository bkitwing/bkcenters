'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Heart,
  Navigation,
  Sparkles,
  Sunrise,
  Youtube,
} from 'lucide-react';
import { SRP_CONTENT, SRP_MAP_EMBED_URL, SRP_MAPS_URL } from './content';
import { SRP_CONTACT_HREF, SRP_COURSE_HREF, SRP_GALLERIES_HREF } from './nav';
import { HomeCoursesCarousel } from './HomeCoursesCarousel';
import { HomeHeroParticles } from './HomeHeroParticles';
import { HomeHeroSlideshow, type SrpHomeImage } from './HomeHeroSlideshow';
import type { SrpGalleryThumb, SrpHeroSlide, SrpService } from './logo-data';

const c = SRP_CONTENT;

/** Home bands — set to true to show them again. */
const SHOW_HOME_PROGRAMMES = false;
const SHOW_HOME_VIDEOS = false;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

const CHAPTERS = c.about.paragraphs.map((body, index) => ({
  n: String(index + 1).padStart(2, '0'),
  title: c.about.chapters[index],
  body,
}));

export default function ShantiSarovarRaipurClient({
  newsTeaser,
  heroSlides = [],
  services = [],
  gallery = [],
}: {
  newsTeaser?: React.ReactNode;
  /** Web carousel from Strapi "Hero Section". */
  heroSlides?: SrpHomeImage[];
  /** Cards from Strapi "Services offered Section". */
  services?: SrpService[];
  /** Campus pictures from Strapi "Photo Gallery Section". */
  gallery?: SrpGalleryThumb[];
}) {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.9], [1, reduce ? 1 : 0.35]);

  const galleryThumbs = gallery.length > 0 ? gallery : c.gallery.items;

  return (
    <div>
      <section ref={heroRef} className="srp-hero srp-hero--cinema">
        <motion.div style={{ opacity: heroOpacity }} className="srp-hero__media">
          {heroSlides.length > 0 ? (
            <HomeHeroSlideshow slides={heroSlides} />
          ) : (
            <div className="srp-hero__fallback" aria-hidden />
          )}
        </motion.div>
        <div className="srp-hero__wash" />
        <HomeHeroParticles />

        <div className="srp-container srp-hero__content">
          <motion.p
            className="srp-hero__brand"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {c.brand}
          </motion.p>
          <motion.p
            className="srp-hero__tag"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            {c.tagline}
          </motion.p>
          <motion.h1
            className="srp-hero__headline"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            {c.hero.headline}
          </motion.h1>
          <motion.p
            className="srp-hero__support"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            {c.hero.support}
          </motion.p>
          <motion.div
            className="srp-hero__actions"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Link href={SRP_CONTACT_HREF} className="srp-btn srp-btn--primary">
              Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href={SRP_COURSE_HREF} className="srp-btn srp-btn--ghost">
              {c.hero.ctaSecondary}
            </Link>
          </motion.div>
        </div>

        <button type="button" onClick={() => scrollToId('about')} className="srp-hero__scroll" aria-label="Scroll to about">
          <motion.span
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
            className="inline-flex"
          >
            <ArrowDown className="w-5 h-5" />
          </motion.span>
        </button>
      </section>

      <section id="about" className="srp-section srp-section--campus srp-home-about">
        <div className="srp-container">
          <div className="srp-campus">
            <Reveal className="srp-campus__visual">
              <div className="srp-campus__day" aria-labelledby="srp-campus-day-title">
                <div className="srp-campus__day-orbit" aria-hidden="true">
                  <motion.span
                    className="srp-campus__orbit-ring srp-campus__orbit-ring--outer"
                    animate={reduce ? undefined : { rotate: 360 }}
                    transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.span
                    className="srp-campus__orbit-ring srp-campus__orbit-ring--inner"
                    animate={reduce ? undefined : { rotate: -360 }}
                    transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.span
                    className="srp-campus__orbit-core"
                    animate={reduce ? undefined : { scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.span
                    className="srp-campus__orbit-icon"
                    animate={reduce ? undefined : { scale: [1, 1.08, 1], opacity: [1, 0.75, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Heart />
                  </motion.span>
                </div>
                <p className="srp-campus__day-eyebrow">A day at Shanti Sarovar</p>
                <h3 id="srp-campus-day-title" className="srp-campus__day-title">
                  Make space for what matters.
                </h3>
                <p className="srp-campus__day-intro">An inward journey from noise to clarity</p>
                <ol className="srp-campus__timeline">
                  <motion.li
                    initial={reduce ? false : { opacity: 0, x: -12 }}
                    whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="srp-campus__moment-icon"><Sunrise aria-hidden="true" /></span>
                    <div>
                      <span className="srp-campus__moment-label">Arrive</span>
                      <p>Quiet the noise of the outside world and arrive in the present.</p>
                    </div>
                  </motion.li>
                  <motion.li
                    initial={reduce ? false : { opacity: 0, x: -12 }}
                    whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="srp-campus__moment-icon"><Sparkles aria-hidden="true" /></span>
                    <div>
                      <span className="srp-campus__moment-label">Find stillness</span>
                      <p>Turn inward through Rajyoga meditation and meet your inner peace.</p>
                    </div>
                  </motion.li>
                  <motion.li
                    initial={reduce ? false : { opacity: 0, x: -12 }}
                    whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: 0.27, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="srp-campus__moment-icon"><BookOpen aria-hidden="true" /></span>
                    <div>
                      <span className="srp-campus__moment-label">Discover</span>
                      <p>Explore new perspectives and the quiet wisdom within.</p>
                    </div>
                  </motion.li>
                  <motion.li
                    initial={reduce ? false : { opacity: 0, x: -12 }}
                    whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="srp-campus__moment-icon"><Heart aria-hidden="true" /></span>
                    <div>
                      <span className="srp-campus__moment-label">Carry the calm</span>
                      <p>Return to the world with clarity, balance and renewed purpose.</p>
                    </div>
                  </motion.li>
                </ol>
              </div>
            </Reveal>

            <div className="srp-campus__story">
              <Reveal>
                <p className="srp-eyebrow">{c.about.eyebrow}</p>
                <h2 className="srp-heading srp-campus__title">{c.about.title}</h2>
                <span className="srp-rule" />
              </Reveal>

              <Reveal delay={0.04}>
                <ul className="srp-campus__metrics" aria-label="Campus at a glance">
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
                  <article className="srp-campus__chapter">
                    <header className="srp-campus__chapter-head">
                      <span className="srp-campus__chapter-n" aria-hidden>
                        {chapter.n}
                      </span>
                      <h3>{chapter.title}</h3>
                    </header>
                    <p>{chapter.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>


      <section id="services" className="srp-section srp-section--alt srp-home-courses">
        <div className="srp-container">
          <Reveal>
            <div className="srp-home-courses__head">
              <div>
                <p className="srp-eyebrow">{c.services.eyebrow}</p>
                <h2 className="srp-heading">{c.services.title}</h2>
                <span className="srp-rule" />
              </div>
              <Link href={SRP_CONTACT_HREF} className="srp-home-courses__all">
                Enquire about a course
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal>
          <p className="srp-lede srp-home-courses__intro !max-w-3xl">{c.services.intro}</p>
          <HomeCoursesCarousel
            ariaLabel="Services offered"
            items={
              services.length > 0
                ? services.map((item) => ({
                    id: item.id,
                    title: item.title,
                    blurb: item.blurb,
                    src: item.src,
                    alt: item.alt,
                  }))
                : c.services.items.map((item) => ({
                    id: item.id,
                    title: item.title,
                    blurb: item.text,
                    src: null,
                    alt: item.title,
                  }))
            }
          />
        </div>
      </section>

      {SHOW_HOME_PROGRAMMES ? (
        <section id="programmes" className="srp-section srp-home-band">
          <div className="srp-container">
            <Reveal>
              <div className="srp-home-band__card">
                <div className="srp-home-band__copy">
                  <p className="srp-eyebrow">
                    <CalendarDays className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden />{' '}
                    {c.programmes.eyebrow}
                  </p>
                  <h2 className="srp-heading !mb-0">{c.programmes.title}</h2>
                  <span className="srp-rule" />
                  <p className="srp-lede !max-w-2xl">{c.programmes.text}</p>
                </div>
                <Link href={SRP_CONTACT_HREF} className="srp-btn srp-btn--primary shrink-0">
                  {c.programmes.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {SHOW_HOME_VIDEOS ? (
        <section id="videos" className="srp-section srp-section--alt srp-home-band">
          <div className="srp-container">
            <Reveal>
              <div className="srp-home-band__card">
                <div className="srp-home-band__copy">
                  <p className="srp-eyebrow">
                    <Youtube className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden />{' '}
                    {c.videos.eyebrow}
                  </p>
                  <h2 className="srp-heading !mb-0">{c.videos.title}</h2>
                  <span className="srp-rule" />
                  <p className="srp-lede !max-w-2xl">{c.videos.text}</p>
                </div>
                <a
                  href={c.videos.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="srp-btn srp-btn--primary shrink-0"
                >
                  {c.videos.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      <section id="gallery" className="srp-section srp-home-gallery">
        <div className="srp-container">
          <Reveal>
            <div className="srp-home-gallery__head">
              <div>
                <p className="srp-eyebrow">{c.gallery.eyebrow}</p>
                <h2 className="srp-heading">{c.gallery.title}</h2>
                <span className="srp-rule" />
              </div>
              <Link href={SRP_GALLERIES_HREF} className="srp-home-gallery__all">
                {c.gallery.cta}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal>
          <p className="srp-lede srp-home-gallery__intro !max-w-3xl">{c.gallery.intro}</p>
          <HomeCoursesCarousel
            ariaLabel="Photo gallery"
            peek="roomy"
            items={galleryThumbs.map((thumb) => ({
              id: thumb.id,
              title: 'title' in thumb ? thumb.title : thumb.label,
              src: thumb.src,
              alt: thumb.alt,
              href: SRP_GALLERIES_HREF,
            }))}
          />
        </div>
      </section>

      {newsTeaser}

      <section id="visit" className="srp-section srp-home-visit">
        <div className="srp-container">
          <Reveal>
            <div className="srp-home-visit__layout">
              <div className="srp-home-visit__copy">
                <p className="srp-eyebrow">Visit</p>
                <h2 className="srp-heading !mb-0">{c.visit.title}</h2>
                <span className="srp-rule" />
                <p className="srp-lede !max-w-md mt-3">
                  {c.city.subtitle}. {c.city.welcome}
                </p>
                <p className="srp-lede !max-w-md">{c.visit.address}</p>
                <div className="srp-home-visit__actions">
                  <Link href={SRP_CONTACT_HREF} className="srp-btn srp-btn--primary !min-h-10 !text-sm">
                    {c.visit.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href={SRP_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="srp-btn srp-btn--ghost !min-h-10 !text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Maps
                  </a>
                </div>
              </div>
              <div className="srp-home-visit__map srp-media">
                <iframe
                  title="Shanti Sarovar, Raipur map"
                  src={SRP_MAP_EMBED_URL}
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
