'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, TreePine } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { SP_ABOUT, type MediaSlot } from '../content';
import { SP_CONTACT_HREF } from '../nav';
import type { SpAboutImage, SpAboutPageData } from '../sp-about-data';

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

function Placeholder({ media }: { media: MediaSlot }) {
  if (media.src) {
    return (
      <div className="sp-media sp-space__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.src} alt={media.alt} loading="lazy" decoding="async" />
      </div>
    );
  }
  return (
    <div className="sp-media sp-space__media" role="img" aria-label={media.alt}>
      <div className="absolute inset-0 sp-placeholder-bg" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <TreePine className="w-5 h-5 text-[var(--sp-gold)]/80" aria-hidden />
        <p className="text-sm font-semibold text-[var(--sp-ink)]/85">{media.label}</p>
      </div>
    </div>
  );
}

function storyMedia(image: SpAboutImage | null | undefined, fallback: MediaSlot): MediaSlot {
  if (!image?.src) return fallback;
  return { id: image.id, src: image.src, alt: image.alt, label: image.label };
}

export default function AboutClient({ about }: { about?: SpAboutPageData | null }) {
  const { journey, faculty, spaces, campusIntro } = SP_ABOUT;
  const [journeyOpen, setJourneyOpen] = useState(false);
  const journeyLead = journey.paragraphs[0];
  const journeyRest = journey.paragraphs.slice(1);
  const journeyMedia = storyMedia(about?.journeyImage, journey.media);
  const facultyMedia = storyMedia(about?.facultyImage, faculty.media);

  return (
    <div>
      <section className="sp-section sp-section--campus">
        <div className="sp-container">
          <div className={`sp-about-split sp-about-split--hero${journeyOpen ? ' is-open' : ''}`}>
            <Reveal>
              <Placeholder media={journeyMedia} />
            </Reveal>
            <div className="sp-about-story">
              <Reveal>
                <p className="sp-eyebrow">{journey.eyebrow}</p>
                <h1 className="sp-heading">{journey.title}</h1>
                <span className="sp-rule" />
              </Reveal>
              {journeyLead ? (
                <Reveal delay={0.04}>
                  <p className="sp-lede">{journeyLead}</p>
                </Reveal>
              ) : null}
              {journeyRest.length > 0 ? (
                <details
                  className="sp-about-more"
                  onToggle={(event) => setJourneyOpen(event.currentTarget.open)}
                >
                  <summary className="sp-about-more__btn">
                    {journeyOpen ? 'Show less' : 'Read more'}
                    <ChevronDown className="sp-about-more__chev" aria-hidden />
                  </summary>
                  <div className="sp-about-more__rest">
                    {journeyRest.map((paragraph) => (
                      <p key={paragraph.slice(0, 24)} className="sp-about-copy">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section id="faculty" className="sp-section sp-section--alt">
        <div className="sp-container">
          <div className="sp-about-split sp-about-split--flip">
            <Reveal>
              <Placeholder media={facultyMedia} />
            </Reveal>
            <div>
              <Reveal>
                <p className="sp-eyebrow">{faculty.eyebrow}</p>
                <h2 className="sp-heading">{faculty.title}</h2>
                <span className="sp-rule" />
              </Reveal>
              {faculty.paragraphs.map((paragraph) => (
                <Reveal key={paragraph.slice(0, 24)}>
                  <p className="sp-about-copy">{paragraph}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="campus" className="sp-section">
        <div className="sp-container">
          <Reveal>
            <p className="sp-eyebrow">The grounds</p>
            <h2 className="sp-heading">Our campus</h2>
            <span className="sp-rule" />
            <p className="sp-lede max-w-3xl">{campusIntro}</p>
          </Reveal>
          <div className="sp-spaces">
            {spaces.map((space, i) => (
              <Reveal key={space.id} delay={(i % 2) * 0.05}>
                <article id={space.id} className="sp-space">
                  <Placeholder media={storyMedia(about?.spaceImages[space.id], space.media)} />
                  <div>
                    <h3>{space.title}</h3>
                    <p>{space.text}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sp-section sp-section--tone">
        <div className="sp-container sp-about-cta">
          <div>
            <p className="sp-eyebrow">Nearby</p>
            <h2 className="sp-heading !mb-0">Nearest centres</h2>
            <span className="sp-rule" />
            <p className="sp-lede !max-w-xl">
              Looking for a Rajyoga class closer to home? Find another Brahma Kumaris centre.
            </p>
          </div>
          <div className="sp-about-cta__actions">
            <a href="/centers" className="sp-btn sp-btn--primary">
              Find a Center
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link href={SP_CONTACT_HREF} className="sp-btn sp-btn--ghost">
              Plan a visit
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
