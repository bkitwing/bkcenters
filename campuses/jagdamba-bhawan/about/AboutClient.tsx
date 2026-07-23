'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ChevronDown, Compass, Sparkles } from 'lucide-react';
import type {
  JbAboutHero,
  JbAboutImage,
  JbAboutPageData,
  JbAboutSpace,
} from '../jb-about-data';
import { HomeHeroParticles } from '../HomeHeroParticles';
import { JB_CONTACT_HREF, JB_HOME_HREF } from '../nav';

const CAMPUS_ID = 'campus';

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
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/** Ambient YouTube — muted, looped, no chrome (same pattern as home). */
function ambientYoutubeSrc(embedUrl: string) {
  try {
    const u = new URL(embedUrl);
    // Privacy-enhanced host tends to show less UI chrome
    if (u.hostname.includes('youtube.com')) {
      u.hostname = 'www.youtube-nocookie.com';
    }
    u.searchParams.set('autoplay', '1');
    u.searchParams.set('mute', '1');
    u.searchParams.set('controls', '0');
    u.searchParams.set('modestbranding', '1');
    u.searchParams.set('playsinline', '1');
    u.searchParams.set('rel', '0');
    u.searchParams.set('iv_load_policy', '3');
    u.searchParams.set('fs', '0');
    u.searchParams.set('disablekb', '1');
    u.searchParams.set('loop', '1');
    u.searchParams.set('showinfo', '0');
    const id = u.pathname.split('/').filter(Boolean).pop();
    if (id) u.searchParams.set('playlist', id);
    return u.toString();
  } catch {
    return embedUrl;
  }
}

function syncHash(id: string | null) {
  const hash = id ? `#${id}` : '';
  const { pathname, search, hash: currentHash } = window.location;
  if (currentHash === hash || (!hash && !currentHash)) return;
  window.history.replaceState(window.history.state, '', `${pathname}${search}${hash}`);
}

function scrollClearance(kind: 'campus' | 'space') {
  const styles = getComputedStyle(document.documentElement);
  const header = parseFloat(styles.getPropertyValue('--jb-header-h')) || 72;
  if (kind === 'campus') return header + 16;
  return header + 64;
}

function smoothScrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const kind = id === CAMPUS_ID ? 'campus' : 'space';
  const top = el.getBoundingClientRect().top + window.scrollY - scrollClearance(kind);
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

function ExpandableCopy({
  body,
  matchRef,
  mobileLines = 6,
}: {
  body: string;
  matchRef?: React.RefObject<HTMLElement | null>;
  mobileLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsClamp, setNeedsClamp] = useState(false);
  const [maxH, setMaxH] = useState<number | null>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const paras = body.split(/\n\n+/).filter(Boolean);

  useLayoutEffect(() => {
    if (expanded) return;
    const measure = () => {
      const story = storyRef.current;
      if (!story) return;
      const isDesktop = window.matchMedia('(min-width: 960px)').matches;
      if (isDesktop && matchRef?.current) {
        const h = matchRef.current.getBoundingClientRect().height;
        const clampH = Math.max(120, h - 8);
        setMaxH(clampH);
        const prev = story.style.maxHeight;
        story.style.maxHeight = 'none';
        const natural = story.scrollHeight;
        story.style.maxHeight = prev;
        setNeedsClamp(natural > clampH + 12);
      } else {
        setMaxH(null);
        setNeedsClamp(paras.length > 2 || body.length > 420);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    const ro =
      matchRef?.current && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(measure)
        : null;
    if (matchRef?.current && ro) ro.observe(matchRef.current);
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, [body, expanded, matchRef, paras.length]);

  return (
    <div className="jb-about-expand">
      <div
        ref={storyRef}
        className={`jb-about-expand__body${
          !expanded && needsClamp ? ' is-clamped' : ''
        }${!expanded && !maxH && needsClamp ? ' is-mobile-clamp' : ''}`}
        style={
          !expanded && needsClamp && maxH
            ? { maxHeight: maxH }
            : !expanded && needsClamp && !maxH
              ? { WebkitLineClamp: mobileLines }
              : undefined
        }
      >
        {paras.map((para) => (
          <p key={para.slice(0, 48)} className="jb-about-space__body">
            {para}
          </p>
        ))}
      </div>
      {needsClamp ? (
        <button
          type="button"
          className="jb-about-expand__btn"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : 'Read more'}
          <ChevronDown
            className={`jb-about-expand__chev${expanded ? ' is-open' : ''}`}
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );
}

function SpaceGallery({ images, title }: { images: JbAboutImage[]; title: string }) {
  if (images.length === 0) return null;
  return (
    <div className="jb-about-gal" aria-label={`${title} photographs`}>
      <div className="jb-about-gal__rail">
        {images.map((img, i) => (
          <figure key={img.id} className="jb-about-gal__shot">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              loading={i < 2 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </figure>
        ))}
      </div>
    </div>
  );
}

function SpaceChapter({
  space,
  index,
  active,
}: {
  space: JbAboutSpace;
  index: number;
  active: boolean;
}) {
  const visualRef = useRef<HTMLDivElement>(null);
  const n = String(index + 1).padStart(2, '0');
  return (
    <article
      id={space.id}
      className={`jb-about-space${active ? ' is-active' : ''}${
        index % 2 === 1 ? ' jb-about-space--flip' : ''
      }`}
      data-space={space.id}
    >
      <div className="jb-about-space__story">
        <Reveal>
          <p className="jb-about-space__n" aria-hidden>
            {n}
          </p>
          <h3 className="jb-about-space__title">{space.title}</h3>
          <span className="jb-rule" />
          <ExpandableCopy body={space.body} matchRef={visualRef} />
        </Reveal>
      </div>
      <Reveal delay={0.06} className="jb-about-space__visual">
        <div ref={visualRef}>
          <SpaceGallery images={space.images} title={space.title} />
        </div>
      </Reveal>
    </article>
  );
}

function JourneyNav({
  spaces,
  active,
  onNavigate,
}: {
  spaces: JbAboutSpace[];
  active: string;
  onNavigate: (id: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chip = trackRef.current?.querySelector<HTMLElement>(
      `[data-chip-id="${active}"]`
    );
    chip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [active]);

  if (spaces.length === 0) return null;

  return (
    <div className="jb-container jb-about-journey-wrap">
      <nav className="jb-gal-nav jb-about-journey" aria-label="Campus spaces">
        <div className="jb-gal-nav__track" ref={trackRef} role="group">
          <span className="jb-about-journey__label">
            <Compass className="h-3.5 w-3.5" aria-hidden /> Walk
          </span>
          {spaces.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              data-chip-id={s.id}
              className={`jb-gal-pill${active === s.id ? ' is-active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(s.id);
              }}
            >
              {s.title}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}

function AboutVideoHero({
  hero,
  onBeginWalk,
}: {
  hero: JbAboutHero;
  onBeginWalk: () => void;
}) {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  // Above-the-fold: start immediately (home waits for IO because it sits mid-page)
  const [active, setActive] = useState(() => !reduce);

  useEffect(() => {
    if (reduce) return;
    const el = heroRef.current;
    if (!el) return;
    // Keep playing while in view; pause mount when far away to save bandwidth
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { rootMargin: '20% 0px', threshold: 0.01 }
    );
    io.observe(el);
    setActive(true);
    return () => io.disconnect();
  }, [reduce]);

  const src = hero.videoUrl && active && !reduce ? ambientYoutubeSrc(hero.videoUrl) : null;

  return (
    <section
      ref={heroRef}
      className="jb-about-hero"
      aria-label="About Jagdamba Bhawan"
    >
      <div className="jb-about-hero__media" aria-hidden>
        {src ? (
          <div className="jb-about-hero__video">
            <iframe
              key={src}
              src={src}
              title=""
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              tabIndex={-1}
              loading="eager"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : hero.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.image.src} alt="" fetchPriority="high" />
        ) : (
          <div className="jb-about-hero__ph" />
        )}
      </div>
      <div className="jb-about-hero__wash" />
      {!reduce ? (
        <div className="jb-about-hero__particles">
          <HomeHeroParticles />
        </div>
      ) : null}
      <div className="jb-about-hero__copy">
        <p className="jb-eyebrow jb-about-hero__eyebrow">About the campus</p>
        <h1 className="jb-about-hero__title">{hero.title}</h1>
        {hero.body ? (
          <p className="jb-about-hero__lede">{hero.body.split(/\n\n+/)[0]}</p>
        ) : null}
        <div className="jb-about-hero__actions">
          <a
            href={`#${CAMPUS_ID}`}
            className="jb-btn jb-btn--primary"
            onClick={(e) => {
              e.preventDefault();
              onBeginWalk();
            }}
          >
            Begin the walk
            <ArrowRight className="w-4 h-4" />
          </a>
          <Link href={JB_CONTACT_HREF} className="jb-btn jb-btn--ghost jb-about-hero__ghost">
            Plan a visit
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function AboutClient({ data }: { data: JbAboutPageData }) {
  const [activeSpace, setActiveSpace] = useState(data.spaces[0]?.id || '');
  const activeHashRef = useRef<string | null>(null);
  const scrollingToRef = useRef<string | null>(null);
  const urlSyncReady = useRef(false);

  const sectionIds = [
    ...(data.campusIntro ? [CAMPUS_ID] : []),
    ...data.spaces.map((s) => s.id),
  ];

  const navigateTo = useCallback((id: string) => {
    scrollingToRef.current = id;
    activeHashRef.current = id;
    if (id !== CAMPUS_ID) setActiveSpace(id);
    syncHash(id);
    requestAnimationFrame(() => {
      smoothScrollToId(id);
      window.setTimeout(() => {
        scrollingToRef.current = null;
      }, 800);
    });
  }, []);

  // Deep-link on direct land + hashchange (back/forward)
  useEffect(() => {
    const applyHash = (instant = false) => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash || !sectionIds.includes(hash)) return;
      activeHashRef.current = hash;
      if (hash !== CAMPUS_ID) setActiveSpace(hash);
      scrollingToRef.current = hash;
      const run = () => {
        if (instant) {
          const el = document.getElementById(hash);
          if (el) {
            const kind = hash === CAMPUS_ID ? 'campus' : 'space';
            const top =
              el.getBoundingClientRect().top + window.scrollY - scrollClearance(kind);
            window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
          }
        } else {
          smoothScrollToId(hash);
        }
        window.setTimeout(() => {
          scrollingToRef.current = null;
        }, instant ? 100 : 800);
      };
      // Wait a tick so sticky header height + images can settle
      requestAnimationFrame(() => {
        window.setTimeout(run, instant ? 40 : 60);
      });
    };

    // Suppress browser's native jump, then place ourselves
    if (window.location.hash) {
      const y = window.scrollY;
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
        applyHash(true);
        urlSyncReady.current = true;
      });
    } else {
      // About (no hash) must land at top — clear prior scroll restoration to #campus
      window.scrollTo(0, 0);
      activeHashRef.current = null;
      urlSyncReady.current = true;
    }

    const onHash = () => {
      if (!urlSyncReady.current) return;
      if (scrollingToRef.current) return;
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) {
        activeHashRef.current = null;
        return;
      }
      if (sectionIds.includes(hash) && activeHashRef.current !== hash) {
        navigateTo(hash);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + section list
  }, [sectionIds.join('|'), navigateTo]);

  // Smooth scroll-spy → replaceState hash (no jerk)
  useEffect(() => {
    if (sectionIds.length === 0) return;
    let raf = 0;
    let ticking = false;

    const spy = () => {
      ticking = false;
      if (scrollingToRef.current || !urlSyncReady.current) return;
      const focusY = scrollClearance('space') + 8;
      let next: string | null = null;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= focusY) next = id;
        else break;
      }
      if (next === activeHashRef.current) return;
      activeHashRef.current = next;
      if (next && next !== CAMPUS_ID) setActiveSpace(next);
      else if (next === CAMPUS_ID) setActiveSpace('');
      syncHash(next);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(spy);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [sectionIds.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="jb-about-page">
      {data.hero ? <AboutVideoHero hero={data.hero} onBeginWalk={() => navigateTo(CAMPUS_ID)} /> : null}

      {data.chapters.length > 0 ? (
        <section className="jb-section jb-about-chapters" aria-label="Our story">
          <div className="jb-container">
            {data.chapters.map((ch, i) => (
              <div
                key={ch.id}
                className={`jb-about-chapter${i % 2 === 1 ? ' jb-about-chapter--flip' : ''}`}
              >
                <Reveal className="jb-about-chapter__visual">
                  {ch.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ch.image.src} alt={ch.image.alt} loading="lazy" decoding="async" />
                  ) : (
                    <div className="jb-about-chapter__ph" />
                  )}
                </Reveal>
                <Reveal delay={0.05} className="jb-about-chapter__copy">
                  <p className="jb-eyebrow">
                    <Sparkles className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Story
                  </p>
                  <h2 className="jb-heading">{ch.title}</h2>
                  <span className="jb-rule" />
                  {ch.body.split(/\n\n+/).map((para) => (
                    <p key={para.slice(0, 40)} className="jb-lede jb-prose !max-w-none">
                      {para}
                    </p>
                  ))}
                </Reveal>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.campusIntro ? (
        <section className="jb-section jb-about-intro" id={CAMPUS_ID}>
          <div className="jb-container">
            <div className="jb-about-intro__grid">
              <Reveal className="jb-about-intro__visual">
                {data.campusIntro.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.campusIntro.image.src}
                    alt={data.campusIntro.image.alt}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="jb-about-intro__ph" />
                )}
              </Reveal>
              <Reveal delay={0.05} className="jb-about-intro__copy">
                <p className="jb-eyebrow">Orientation</p>
                <h2 className="jb-heading">{data.campusIntro.title}</h2>
                <span className="jb-rule" />
                <p className="jb-lede jb-prose jb-about-intro__body">
                  {data.campusIntro.body}
                </p>
              </Reveal>
            </div>
          </div>
        </section>
      ) : null}

      {data.spaces.length > 0 ? (
        <>
          <JourneyNav
            spaces={data.spaces}
            active={activeSpace}
            onNavigate={navigateTo}
          />
          <section className="jb-about-tour" aria-label="Campus spaces">
            <div className="jb-container">
              {data.spaces.map((space, i) => (
                <SpaceChapter
                  key={space.id}
                  space={space}
                  index={i}
                  active={activeSpace === space.id}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}

      <section className="jb-section jb-about-close">
        <div className="jb-container jb-about-close__inner">
          <Reveal>
            <p className="jb-eyebrow">Visit</p>
            <h2 className="jb-heading">Come walk these paths yourself</h2>
            <span className="jb-rule" />
            <p className="jb-lede jb-prose">
              Every corner of Jagdamba Bhawan is designed for stillness and learning. We would love
              to welcome you in Pisoli, Pune.
            </p>
            <div className="jb-about-close__actions">
              <Link href={JB_CONTACT_HREF} className="jb-btn jb-btn--primary">
                Visit & enquire
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href={JB_HOME_HREF} className="jb-btn jb-btn--ghost">
                Back to home
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
