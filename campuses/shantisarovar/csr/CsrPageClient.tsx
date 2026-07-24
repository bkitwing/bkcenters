'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useReducedMotion,
  useInView,
  animate,
} from 'motion/react';
import {
  ArrowDown,
  ArrowUpRight,
  BookHeart,
  BookOpen,
  Clock,
  Download,
  Droplets,
  ExternalLink,
  Eye,
  Globe,
  Handshake,
  Heart,
  HeartPulse,
  Home,
  Layers,
  Leaf,
  Mail,
  Phone,
  Presentation,
  Recycle,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';
import { HomeHeroParticles } from '../HomeHeroParticles';
import {
  CSR_CONTACT_DETAILS,
  CSR_CONTACT_HREF,
  CSR_HERO_VIDEO_MP4,
  CSR_IMPACT_THEMES,
  CSR_INITIATIVES,
  CSR_PAGE_PATH,
  CSR_PUBLICATIONS,
  CSR_WHY_PARTNER,
  type CsrPublication,
  type CsrStat,
} from './csr-data';

/**
 * BKAudio ringtone-style download: Azure → browser Blob → Save-as.
 * Works on production (Azure CORS for www.brahmakumaris.com). On localhost
 * without CORS, falls back to opening the PDF so Save As is still available.
 */
async function downloadPdfToDevice(pub: CsrPublication): Promise<void> {
  try {
    const res = await fetch(pub.pdfUrl, {
      mode: 'cors',
      credentials: 'omit',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = pub.downloadFilename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  } catch {
    window.open(pub.pdfUrl, '_blank', 'noopener,noreferrer');
  }
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

function trackPdfEvent(
  event: 'pdf_download' | 'pdf_view',
  pub: CsrPublication
) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, {
    page_path: CSR_PAGE_PATH,
    pdf_name: pub.analyticsName,
    pdf_type: pub.analyticsType,
    source: 'csr_publications_page',
  });
}

function trackCsrEnquiry() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'contact_center', {
    event_category: 'csr_partnership',
    event_label: 'Shanti Sarovar CSR enquiry',
    page_path: CSR_PAGE_PATH,
    source: 'csr_publications_page',
  });
}

const STAT_ICONS: Record<CsrStat['icon'], React.ComponentType<{ className?: string }>> = {
  layers: Layers,
  sun: Sun,
  recycle: Recycle,
  droplet: Droplets,
  presentation: Presentation,
  clock: Clock,
  users: Users,
  solar: Sun,
};

const WHY_ICONS = {
  shield: ShieldCheck,
  leaf: Leaf,
  eye: Eye,
  handshake: Handshake,
} as const;

const THEME_ICONS = {
  heart: Heart,
  sun: Sun,
  droplet: Droplets,
  cross: HeartPulse,
  home: Home,
  spark: Sparkles,
} as const;

function DownloadToast({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="ss-csr-toast" role="status" aria-live="polite">
      Your PDF download has started.
    </div>
  );
}

const INITIATIVE_ICONS = {
  leaf: Leaf,
  book: BookHeart,
  handshake: Handshake,
  heart: Heart,
} as const;

function CsrVideoHero() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(() => !reduce);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const el = heroRef.current;
    if (!el) return;
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active || reduce) return;
    const play = video.play();
    if (play && typeof play.catch === 'function') play.catch(() => {});
  }, [active, reduce, videoReady]);

  const mountVideo = Boolean(CSR_HERO_VIDEO_MP4) && active && !reduce;

  return (
    <section
      ref={heroRef}
      className="ss-csr-hero"
      aria-labelledby="ss-csr-hero-title"
    >
      <div className="ss-csr-hero__media" aria-hidden="true">
        <div className="ss-csr-hero__tone" />
        {mountVideo ? (
          <div className={`ss-csr-hero__video${videoReady ? ' is-ready' : ''}`}>
            <video
              ref={videoRef}
              src={CSR_HERO_VIDEO_MP4}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onLoadedData={() => setVideoReady(true)}
              onCanPlay={() => setVideoReady(true)}
              onPlaying={() => setVideoReady(true)}
            />
          </div>
        ) : null}
      </div>
      <div className="ss-csr-hero__wash" />
      {!reduce ? (
        <div className="ss-csr-hero__particles">
          <HomeHeroParticles />
        </div>
      ) : null}
      <div className="ss-csr-hero__copy">
        <p className="ss-csr-eyebrow">CSR PARTNERSHIPS</p>
        <h1 id="ss-csr-hero-title" className="ss-csr-hero__title">
          Creating Sustainable Impact, Together
        </h1>
        <p className="ss-csr-hero__support">
          Discover our impact at Shanti Sarovar through two thoughtfully prepared
          publications—begin with the concise overview or explore the complete
          portfolio of partnership-ready CSR projects.
        </p>
        <div className="ss-csr-hero__actions">
          <a href="#publications" className="ss-btn ss-btn--primary">
            Explore Publications
            <ArrowDown className="w-4 h-4" aria-hidden="true" />
          </a>
          <Link
            href={CSR_CONTACT_HREF}
            className="ss-btn ss-btn--ghost ss-csr-hero__ghost"
            onClick={trackCsrEnquiry}
          >
            Connect for CSR Partnership
          </Link>
        </div>
      </div>
    </section>
  );
}

function PublicationStatistics({ stats }: { stats: CsrStat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0px' });
  const reduce = useReducedMotion();

  return (
    <div ref={ref} className="ss-csr-stats">
      {stats.map((stat) => {
        const Icon = STAT_ICONS[stat.icon];
        return (
          <div key={stat.label} className="ss-csr-stat">
            <span className="ss-csr-stat__icon" aria-hidden="true">
              <Icon className="w-4 h-4" />
            </span>
            <StatValue value={stat.value} active={inView && !reduce} />
            <span className="ss-csr-stat__label">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatValue({ value, active }: { value: string; active: boolean }) {
  const match = value.match(/^([^\d]*)([\d,.]+)(.*)$/);
  const [display, setDisplay] = useState(match ? match[1] + '0' + match[3] : value);

  useEffect(() => {
    if (!active || !match) {
      setDisplay(value);
      return;
    }
    const prefix = match[1];
    const numStr = match[2].replace(/,/g, '');
    const suffix = match[3];
    const target = parseFloat(numStr);
    if (Number.isNaN(target)) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, target, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        const rounded = Number.isInteger(target) ? Math.round(v) : Math.round(v * 10) / 10;
        const formatted =
          match[2].includes(',')
            ? rounded.toLocaleString('en-IN')
            : String(rounded);
        setDisplay(`${prefix}${formatted}${suffix}`);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, value]);

  return <span className="ss-csr-stat__value">{active || !match ? display : value}</span>;
}

function PublicationCover({ pub }: { pub: CsrPublication }) {
  const reduce = useReducedMotion();
  return (
    <div className="ss-csr-cover" data-theme={pub.theme}>
      <div className="ss-csr-cover__stack" aria-hidden="true">
        <span />
        <span />
      </div>
      <motion.div
        className="ss-csr-cover__frame"
        whileHover={reduce ? undefined : { y: -4, rotate: -0.6 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {pub.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pub.coverImage}
            alt={pub.coverAlt}
            loading="lazy"
            decoding="async"
            className="ss-csr-cover__img"
          />
        ) : (
          <div className="ss-csr-cover__placeholder" role="img" aria-label={pub.coverAlt}>
            <BookOpen className="w-8 h-8" aria-hidden="true" />
            <p>{pub.title}</p>
            <span>{pub.pageCount} pages</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function PublicationCard({
  pub,
  reverse,
  onDownload,
}: {
  pub: CsrPublication;
  reverse?: boolean;
  onDownload: (pub: CsrPublication) => void;
}) {
  return (
    <Reveal>
      <article
        className={`ss-csr-card${reverse ? ' ss-csr-card--reverse' : ''}`}
        data-theme={pub.theme}
        id={pub.id}
      >
        <PublicationCover pub={pub} />
        <div className="ss-csr-card__body">
          <span className="ss-csr-card__badge">{pub.badge}</span>
          <p className="ss-csr-card__title">{pub.title}</p>
          <h3 className="ss-csr-card__hook">{pub.hook}</h3>
          <p className="ss-csr-card__sub">{pub.subheading}</p>
          <p className="ss-csr-card__desc">{pub.description}</p>

          <PublicationStatistics stats={pub.statistics} />

          <p className="ss-csr-card__support">{pub.supportingLine}</p>

          {pub.topics.length > 0 ? (
            <ul className="ss-csr-topics" aria-label="Partnership themes">
              {pub.topics.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : null}

          {pub.readinessLine ? (
            <p className="ss-csr-readiness">{pub.readinessLine}</p>
          ) : null}

          <div className="ss-csr-card__actions">
            <button
              type="button"
              className="ss-btn ss-btn--primary ss-csr-card__download"
              aria-label={
                pub.id === 'portfolio'
                  ? 'Download the Brahma Kumaris CSR Partnership Portfolio 2026 PDF'
                  : 'Download the Shanti Sarovar CSR Impact Overview and 2027 Vision PDF'
              }
              onClick={() => onDownload(pub)}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              {pub.primaryCta}
            </button>
            <a
              href={pub.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ss-btn ss-btn--ghost"
              aria-label={
                pub.id === 'portfolio'
                  ? 'View the Brahma Kumaris CSR Partnership Portfolio 2026 in a new tab'
                  : 'View the Shanti Sarovar CSR Impact Overview and 2027 Vision in a new tab'
              }
              onClick={() => trackPdfEvent('pdf_view', pub)}
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              View PDF
            </a>
          </div>
          <p className="ss-csr-card__micro">{pub.microcopy}</p>
        </div>
      </article>
    </Reveal>
  );
}

export default function CsrPageClient() {
  const [toast, setToast] = useState(false);
  const downloadLock = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onDownload = useCallback(async (pub: CsrPublication) => {
    if (downloadLock.current) return;
    downloadLock.current = true;
    trackPdfEvent('pdf_download', pub);
    setToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 2800);
    try {
      await downloadPdfToDevice(pub);
    } finally {
      window.setTimeout(() => {
        downloadLock.current = false;
      }, 900);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const portfolio = CSR_PUBLICATIONS[0];

  return (
    <div className="ss-csr-page">
      <DownloadToast show={toast} />

      <CsrVideoHero />

      {/* Intro */}
      <section className="ss-section ss-csr-intro" aria-labelledby="ss-csr-intro-title">
        <div className="ss-container ss-csr-intro__inner">
          <Reveal>
            <p className="ss-csr-eyebrow ss-csr-eyebrow--ink">CSR PUBLICATIONS</p>
            <h2 id="ss-csr-intro-title" className="ss-csr-section-title">
              Discover the Impact. Explore the Possibilities.
            </h2>
            <span className="ss-rule" aria-hidden="true" />
            <p className="ss-csr-lede">
              These publications offer two ways to understand our work. The concise Impact
              Overview presents Shanti Sarovar’s current outreach and future vision, while
              the detailed CSR Partnership Portfolio introduces scalable projects,
              implementation models and measurable opportunities for collaboration.
            </p>
            <p className="ss-csr-start">Choose your starting point</p>
          </Reveal>
        </div>
      </section>

      {/* Publications */}
      <section
        id="publications"
        className="ss-section ss-section--tone ss-csr-pubs"
        aria-label="CSR publications"
      >
        <div className="ss-container ss-csr-pubs__grid">
          {CSR_PUBLICATIONS.map((pub, i) => (
            <PublicationCard
              key={pub.id}
              pub={pub}
              reverse={i % 2 === 1}
              onDownload={onDownload}
            />
          ))}
        </div>
      </section>

      {/* Global initiatives */}
      <section
        className="ss-section ss-csr-initiatives"
        aria-labelledby="ss-csr-initiatives-title"
      >
        <div className="ss-container">
          <Reveal>
            <p className="ss-csr-eyebrow ss-csr-eyebrow--ink">OUR INITIATIVES</p>
            <h2 id="ss-csr-initiatives-title" className="ss-csr-section-title">
              Explore Brahma Kumaris Seva Worldwide
            </h2>
            <span className="ss-rule" aria-hidden="true" />
            <p className="ss-csr-lede">
              Beyond the CSR publications, discover how Brahma Kumaris serve communities
              through environment, education, social welfare and health programmes.
            </p>
          </Reveal>
          <div className="ss-csr-initiatives__grid">
            {CSR_INITIATIVES.map((item, i) => {
              const Icon = INITIATIVE_ICONS[item.icon];
              return (
                <Reveal key={item.id} delay={i * 0.05}>
                  <article className="ss-csr-initiative">
                    <span className="ss-csr-initiative__icon" aria-hidden="true">
                      <Icon className="w-5 h-5" />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ss-btn ss-btn--outline"
                    >
                      Explore
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why partner */}
      <section className="ss-section ss-csr-why" aria-labelledby="ss-csr-why-title">
        <div className="ss-container">
          <Reveal>
            <p className="ss-csr-eyebrow ss-csr-eyebrow--ink">WHY PARTNER WITH US</p>
            <h2 id="ss-csr-why-title" className="ss-csr-section-title">
              Values-Led Action. Measurable Social Impact.
            </h2>
            <span className="ss-rule" aria-hidden="true" />
          </Reveal>
          <div className="ss-csr-why__grid">
            {CSR_WHY_PARTNER.map((item, i) => {
              const Icon = WHY_ICONS[item.icon];
              return (
                <Reveal key={item.title} delay={i * 0.06}>
                  <div className="ss-csr-why__item">
                    <span className="ss-csr-why__icon" aria-hidden="true">
                      <Icon className="w-5 h-5" />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact themes */}
      <section
        className="ss-section ss-section--campus ss-csr-themes"
        aria-labelledby="ss-csr-themes-title"
      >
        <div className="ss-container">
          <Reveal>
            <h2 id="ss-csr-themes-title" className="ss-csr-section-title">
              Areas of Impact
            </h2>
            <span className="ss-rule" aria-hidden="true" />
          </Reveal>
          <div className="ss-csr-themes__grid">
            {CSR_IMPACT_THEMES.map((theme, i) => {
              const Icon = THEME_ICONS[theme.icon];
              return (
                <Reveal key={theme.title} delay={(i % 3) * 0.05}>
                  <div className="ss-csr-theme">
                    <span className="ss-csr-theme__icon" aria-hidden="true">
                      <Icon className="w-5 h-5" />
                    </span>
                    <h3>{theme.title}</h3>
                    <p>{theme.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact for CSR */}
      <section
        id="csr-contact"
        className="ss-section ss-section--tone ss-csr-contact"
        aria-labelledby="ss-csr-contact-title"
      >
        <div className="ss-container">
          <Reveal>
            <p className="ss-csr-eyebrow ss-csr-eyebrow--ink">CONNECT WITH US</p>
            <h2 id="ss-csr-contact-title" className="ss-csr-section-title">
              For More Information
            </h2>
            <span className="ss-rule" aria-hidden="true" />
            <p className="ss-csr-lede">
              Speak with the Shanti Sarovar CSR desk, or visit our Contact page for
              campus directions and a full enquiry form.
            </p>
          </Reveal>

          <div className="ss-csr-contact__grid">
            <Reveal>
              <div className="ss-csr-contact__card">
                <h3>
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  Phone
                </h3>
                <ul className="ss-csr-contact__phones">
                  {CSR_CONTACT_DETAILS.phones.map((p) => (
                    <li key={p.tel}>
                      <a href={`tel:${p.tel}`}>{p.display}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <div className="ss-csr-contact__card">
                <h3>
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  Email
                </h3>
                <a href={`mailto:${CSR_CONTACT_DETAILS.email}`}>
                  {CSR_CONTACT_DETAILS.email}
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="ss-csr-contact__card">
                <h3>
                  <Globe className="w-4 h-4" aria-hidden="true" />
                  Websites
                </h3>
                <p>
                  <a
                    href={CSR_CONTACT_DETAILS.website.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {CSR_CONTACT_DETAILS.website.label}
                  </a>
                </p>
                <p>
                  <span className="ss-csr-contact__label">Global</span>
                  {CSR_CONTACT_DETAILS.globalWebsites.map((site) => (
                    <a
                      key={site.href}
                      href={site.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ss-csr-contact__site"
                    >
                      {site.label}
                    </a>
                  ))}
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12}>
            <div className="ss-csr-contact__cta">
              <Link
                href={CSR_CONTACT_HREF}
                className="ss-btn ss-btn--primary"
                onClick={trackCsrEnquiry}
              >
                Visit Contact Page
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="ss-section ss-csr-cta" aria-labelledby="ss-csr-cta-title">
        <div className="ss-container">
          <Reveal>
            <div className="ss-csr-cta__panel">
              <h2 id="ss-csr-cta-title">Ready to Create Meaningful Impact Together?</h2>
              <p>
                Explore the publications and discover how values-led partnerships can
                strengthen communities, protect the environment and create lasting social
                impact.
              </p>
              <div className="ss-csr-cta__actions">
                <button
                  type="button"
                  className="ss-btn ss-btn--primary"
                  aria-label="Download the Brahma Kumaris CSR Partnership Portfolio 2026 PDF"
                  onClick={() => onDownload(portfolio)}
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download CSR Portfolio
                </button>
                <Link
                  href={CSR_CONTACT_HREF}
                  className="ss-btn ss-btn--ghost"
                  onClick={trackCsrEnquiry}
                >
                  Connect for CSR Partnership
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
