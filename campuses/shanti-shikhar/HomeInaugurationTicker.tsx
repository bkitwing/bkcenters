'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, X } from 'lucide-react';
import type { ShkVideo } from './content';

/**
 * Slim ticker band between About and Services. Clicking it opens a popup
 * where visitors can switch between the campus videos without leaving the site.
 */
export function HomeInaugurationTicker({
  videos,
  cta,
  items,
  title,
}: {
  videos: readonly ShkVideo[];
  cta: string;
  items: readonly string[];
  /** Accessible name for the ticker band. */
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Two copies of the track make the loop seamless.
  const track = (copy: number) => (
    <ul className="shk-inaug__list" aria-hidden={copy > 0 || undefined}>
      {items.map((item) => (
        <li key={`${copy}-${item}`} className="shk-inaug__item">
          <span className="shk-inaug__spark" aria-hidden>
            ✦
          </span>
          {item}
        </li>
      ))}
    </ul>
  );

  if (videos.length === 0) return null;

  return (
    <>
      <section className="shk-inaug" aria-label={title}>
        <button
          ref={triggerRef}
          type="button"
          className="shk-container shk-inaug__band"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          <span className="shk-inaug__cta">
            <span className="shk-inaug__play" aria-hidden>
              <Play className="h-3.5 w-3.5" fill="currentColor" />
            </span>
            {cta}
          </span>
          <span className="shk-inaug__marquee">
            <span className="shk-inaug__track">
              {track(0)}
              {track(1)}
            </span>
          </span>
        </button>
      </section>

      {open ? <VideoModal videos={videos} onClose={close} /> : null}
    </>
  );
}

function VideoModal({
  videos,
  onClose,
}: {
  videos: readonly ShkVideo[];
  onClose: () => void;
}) {
  const [activeId, setActiveId] = useState(videos[0].id);
  const active = videos.find((v) => v.id === activeId) ?? videos[0];
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Keep keyboard focus inside the dialog.
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([tabindex="-1"]), a[href], iframe',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const onTabKey = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = (index + step + videos.length) % videos.length;
    setActiveId(videos[next].id);
    tabRefs.current[next]?.focus();
  };

  const src = `https://www.youtube-nocookie.com/embed/${active.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <div
      className="shk-vmodal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shk-vmodal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} className="shk-vmodal__panel">
        <header className="shk-vmodal__head">
          <div className="min-w-0">
            <p className="shk-vmodal__eyebrow">Shanti Shikhar</p>
            <h2 id="shk-vmodal-title" className="shk-vmodal__title">
              {active.title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="shk-vmodal__close"
            onClick={onClose}
            aria-label="Close video"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {videos.length > 1 ? (
          <div className="shk-vmodal__tabs" role="tablist" aria-label="Choose a video">
            {videos.map((video, index) => {
              const selected = video.id === active.id;
              return (
                <button
                  key={video.id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`shk-vtab-${video.id}`}
                  aria-selected={selected}
                  aria-controls="shk-vmodal-player"
                  tabIndex={selected ? 0 : -1}
                  className={`shk-vmodal__tab${selected ? ' is-active' : ''}`}
                  onClick={() => setActiveId(video.id)}
                  onKeyDown={(e) => onTabKey(e, index)}
                >
                  <Play className="h-3 w-3" fill="currentColor" aria-hidden />
                  {video.label}
                </button>
              );
            })}
          </div>
        ) : null}

        <div
          id="shk-vmodal-player"
          className="shk-vmodal__frame"
          role="tabpanel"
          aria-labelledby={`shk-vtab-${active.id}`}
        >
          <iframe
            key={active.youtubeId}
            src={src}
            title={active.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <a
          href={active.href}
          target="_blank"
          rel="noopener noreferrer"
          className="shk-vmodal__ext"
        >
          Watch on YouTube
        </a>
      </div>
    </div>
  );
}
