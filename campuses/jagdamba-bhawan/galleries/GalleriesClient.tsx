'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import {
  TreePine,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Images,
} from 'lucide-react';
import type {
  JbGalleriesPageData,
  JbGalleryAlbum,
  JbGalleryGroup,
  JbGalleryImage,
} from '../jb-gallery-data';
import { JbMediaHero } from '../JbMediaHero';
import { GalleriesAuraAnimation } from './GalleriesAuraAnimation';

const ALL_ID = 'all';
const GRID_ID = 'jb-gal-grid';
/** Prefetch album media this far before it enters the viewport. */
const SECTION_ROOT_MARGIN = '360px 0px';
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.4;

function lockBodyScroll() {
  const { body, documentElement } = document;
  const prevOverflow = body.style.overflow;
  const prevPadding = body.style.paddingRight;
  const scrollbar = window.innerWidth - documentElement.clientWidth;
  body.style.overflow = 'hidden';
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
  return () => {
    body.style.overflow = prevOverflow;
    body.style.paddingRight = prevPadding;
  };
}

function aspectClass(width: number | undefined, height: number | undefined, index: number): string {
  if (!width || !height) {
    if (index % 7 === 0) return 'is-feature';
    if (index % 5 === 2) return 'is-tall';
    return 'is-square';
  }
  const ratio = width / Math.max(height, 1);
  if (ratio > 1.55) return 'is-wide';
  if (ratio < 0.85) return 'is-tall';
  if (index % 7 === 0) return 'is-feature';
  return 'is-square';
}

/** Fullscreen NMBA-style viewer: zoom, swipe, prev/next, thumb strip. */
function GalleryLightbox({
  images,
  index,
  onClose,
  onChange,
}: {
  images: JbGalleryImage[];
  index: number;
  onClose: () => void;
  onChange: (next: number) => void;
}) {
  const image = images[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    swiping: boolean;
  } | null>(null);

  const total = images.length;
  const canPrev = index > 0;
  const canNext = index < total - 1;

  useEffect(() => {
    const unlock = lockBodyScroll();
    closeRef.current?.focus();
    return unlock;
  }, []);

  useEffect(() => {
    setLoaded(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [index, image?.src]);

  useEffect(() => {
    const strip = thumbStripRef.current;
    if (!strip) return;
    const active = strip.querySelector<HTMLElement>(`[data-thumb-index="${index}"]`);
    active?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && canPrev) onChange(index - 1);
      if (e.key === 'ArrowRight' && canNext) onChange(index + 1);
      if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
      }
      if (e.key === '-' || e.key === '_') {
        setZoom((z) => {
          const next = Math.max(ZOOM_MIN, z - ZOOM_STEP);
          if (next === ZOOM_MIN) setOffset({ x: 0, y: 0 });
          return next;
        });
      }
      if (e.key === '0') {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canNext, canPrev, index, onChange, onClose]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(ZOOM_MIN, z - ZOOM_STEP);
      if (next === ZOOM_MIN) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const onWheel = useCallback((e: ReactWheelEvent) => {
    if (!e.ctrlKey && Math.abs(e.deltaY) < 40) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP / 2 : ZOOM_STEP / 2;
    setZoom((z) => {
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta));
      if (next === ZOOM_MIN) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: offset.x,
        originY: offset.y,
        swiping: zoom <= 1,
      };
    },
    [offset.x, offset.y, zoom]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (zoom > 1) {
        setOffset({ x: drag.originX + dx, y: drag.originY + dy });
      }
    },
    [zoom]
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      dragRef.current = null;

      if (zoom > 1) return;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0 && canNext) onChange(index + 1);
      if (dx > 0 && canPrev) onChange(index - 1);
    },
    [canNext, canPrev, index, onChange, zoom]
  );

  if (!image) return null;

  return (
    <div
      className="jb-gal-lb"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || 'Gallery image'}
    >
      <div className="jb-gal-lb__shell">
        <header className="jb-gal-lb__bar">
          <p className="jb-gal-lb__count" aria-live="polite">
            {index + 1} / {total}
          </p>
          <div className="jb-gal-lb__tools">
            <button
              type="button"
              className="jb-gal-lb__icon"
              onClick={zoomOut}
              disabled={zoom <= ZOOM_MIN}
              aria-label="Zoom out"
            >
              <Minus className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              className="jb-gal-lb__icon"
              onClick={resetZoom}
              aria-label="Reset zoom"
            >
              <span className="jb-gal-lb__zoom-label">{Math.round(zoom * 100)}%</span>
            </button>
            <button
              type="button"
              className="jb-gal-lb__icon"
              onClick={zoomIn}
              disabled={zoom >= ZOOM_MAX}
              aria-label="Zoom in"
            >
              <Plus className="h-5 w-5" aria-hidden />
            </button>
            <button
              ref={closeRef}
              type="button"
              className="jb-gal-lb__icon jb-gal-lb__icon--close"
              onClick={onClose}
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </header>

        <div className="jb-gal-lb__viewport">
          <div
            className={`jb-gal-lb__stage${zoom > 1 ? ' is-zoomed' : ''}`}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {image.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={image.src}
                src={image.src}
                alt={image.alt}
                className={`jb-gal-lb__img${loaded ? ' is-loaded' : ''}`}
                width={image.width}
                height={image.height}
                decoding="async"
                draggable={false}
                onLoad={() => setLoaded(true)}
                style={{
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
                }}
              />
            ) : (
              <div className="jb-gal-lb__ph">
                <TreePine className="w-10 h-10 opacity-50 mb-3" />
                <p>{image.alt}</p>
              </div>
            )}
          </div>

          {canPrev ? (
            <button
              type="button"
              className="jb-gal-lb__nav jb-gal-lb__nav--prev"
              onClick={(e) => {
                e.stopPropagation();
                onChange(index - 1);
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
          ) : null}

          {canNext ? (
            <button
              type="button"
              className="jb-gal-lb__nav jb-gal-lb__nav--next"
              onClick={(e) => {
                e.stopPropagation();
                onChange(index + 1);
              }}
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          ) : null}
        </div>

        {total > 1 ? (
          <footer className="jb-gal-lb__thumbs">
            <div
              ref={thumbStripRef}
              className="jb-gal-lb__thumb-track"
              role="listbox"
              aria-label="Gallery thumbnails"
            >
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  data-thumb-index={i}
                  role="option"
                  aria-selected={i === index}
                  aria-label={`View image ${i + 1}`}
                  className={`jb-gal-lb__thumb${i === index ? ' is-active' : ''}`}
                  onClick={() => onChange(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbSrc || img.src}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}

function GalleryStickyNav({
  ariaLabel,
  chips,
  activeCategory,
  showAll,
  allLabel = 'All',
  onSelect,
  onTrackEl,
}: {
  ariaLabel: string;
  chips: { id: string; label: string }[];
  activeCategory: string;
  showAll?: boolean;
  allLabel?: string;
  onSelect: (id: string) => void;
  onTrackEl?: (el: HTMLDivElement | null) => void;
}) {
  if (chips.length === 0 && !showAll) return null;

  return (
    <nav className="jb-gal-nav" aria-label={ariaLabel}>
      <div className="jb-gal-nav__track" ref={onTrackEl} role="group">
        {showAll ? (
          <button
            type="button"
            data-chip-id={ALL_ID}
            className={`jb-gal-pill${activeCategory === ALL_ID ? ' is-active' : ''}`}
            onClick={() => onSelect(ALL_ID)}
            aria-current={activeCategory === ALL_ID ? 'true' : undefined}
          >
            {allLabel}
          </button>
        ) : null}
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            data-chip-id={chip.id}
            className={`jb-gal-pill${activeCategory === chip.id ? ' is-active' : ''}`}
            onClick={() => onSelect(chip.id)}
            aria-current={activeCategory === chip.id ? 'true' : undefined}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function GalleryCard({
  item,
  index,
  sectionIndex,
  onOpen,
}: {
  item: JbGalleryImage;
  index: number;
  sectionIndex: number;
  onOpen: () => void;
}) {
  const src = item.thumbSrc || item.src;
  const eager = sectionIndex === 0 && index < 6;

  return (
    <li
      className={`jb-gal-card ${aspectClass(item.width, item.height, index)}`}
      style={{ '--gal-i': index } as CSSProperties}
    >
      <button type="button" className="jb-gal-card__btn" onClick={onOpen} aria-label={item.alt}>
        <span className="jb-gal-card__skeleton" aria-hidden />
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="jb-gal-card__img"
          />
        ) : (
          <span className="jb-gal-card__ph" aria-hidden>
            <TreePine className="w-5 h-5 mb-2 opacity-70" />
            {item.alt}
          </span>
        )}
        <span className="jb-gal-card__hint" aria-hidden>
          <ZoomIn className="w-3.5 h-3.5" />
        </span>
      </button>
    </li>
  );
}

function AlbumBlock({
  album,
  index,
  active,
  forceLoad,
  onOpen,
  onSectionEl,
}: {
  album: JbGalleryAlbum;
  index: number;
  active: boolean;
  forceLoad: boolean;
  onOpen: (items: JbGalleryImage[], i: number) => void;
  onSectionEl: (id: string, el: HTMLElement | null) => void;
}) {
  const shellRef = useRef<HTMLElement | null>(null);
  const [loaded, setLoaded] = useState(index < 2 || forceLoad);

  useEffect(() => {
    if (forceLoad) setLoaded(true);
  }, [forceLoad]);

  useEffect(() => {
    if (loaded) return;
    const el = shellRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: SECTION_ROOT_MARGIN, threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loaded]);

  const setRefs = useCallback(
    (el: HTMLElement | null) => {
      shellRef.current = el;
      onSectionEl(album.id, el);
    },
    [album.id, onSectionEl]
  );

  return (
    <section
      id={album.id}
      ref={setRefs}
      className={`jb-gal-section${active ? ' is-active' : ''}`}
      aria-labelledby={`${album.id}-title`}
    >
      <header className="jb-gal-section__head">
        <div className="jb-gal-section__banner">
          <span className="jb-gal-section__index" aria-hidden>
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2 id={`${album.id}-title`} className="jb-gal-section__title">
            {album.title}
          </h2>
        </div>
      </header>

      {loaded ? (
        <ul className="jb-gal-masonry">
          {album.items.map((item, i) => (
            <GalleryCard
              key={item.id}
              item={item}
              index={i}
              sectionIndex={index}
              onOpen={() => onOpen(album.items, i)}
            />
          ))}
        </ul>
      ) : (
        <div
          className="jb-gal-section__placeholder"
          aria-hidden
          style={{ '--gal-ph': Math.min(album.items.length, 10) } as CSSProperties}
        />
      )}
    </section>
  );
}

function pickThumbs(albums: JbGalleryAlbum[], limit = 3): string[] {
  const urls: string[] = [];
  for (const album of albums) {
    for (const item of album.items) {
      const src = item.thumbSrc || item.src;
      if (src && !urls.includes(src)) urls.push(src);
      if (urls.length >= limit) return urls;
    }
  }
  return urls;
}

function titleParts(heading: string): { title: string; accent?: string } {
  const cleaned = heading.replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(' ');
  if (parts.length < 2) return { title: cleaned };
  const accent = parts.pop()!;
  return { title: parts.join(' '), accent };
}

/** Jump chip label — Gallery 1, Gallery 2, … */
function jumpLabel(_heading: string, index: number): string {
  return `Gallery ${index + 1}`;
}

function GroupBlock({
  group,
  groupIndex,
  activeCategory,
  sectionIndexStart,
  forcedIds,
  onSelect,
  onOpen,
  onSectionEl,
  onTrackEl,
}: {
  group: JbGalleryGroup;
  groupIndex: number;
  activeCategory: string;
  sectionIndexStart: number;
  forcedIds: Set<string>;
  onSelect: (id: string) => void;
  onOpen: (items: JbGalleryImage[], i: number) => void;
  onSectionEl: (id: string, el: HTMLElement | null) => void;
  onTrackEl: (groupIndex: number, el: HTMLDivElement | null) => void;
}) {
  const chips = useMemo(
    () => group.albums.map((a) => ({ id: a.id, label: a.title })),
    [group.albums]
  );
  const albumIds = useMemo(() => new Set(group.albums.map((a) => a.id)), [group.albums]);
  const isActiveInGroup =
    activeCategory === ALL_ID ? groupIndex === 0 : albumIds.has(activeCategory);

  return (
    <div
      className={`jb-gal-group${
        groupIndex > 0 ? ' jb-gal-group--service' : ' jb-gal-group--moments'
      }`}
    >
      <GalleryStickyNav
        ariaLabel={`${group.heading} galleries`}
        chips={chips}
        activeCategory={isActiveInGroup ? activeCategory : ''}
        showAll={groupIndex === 0}
        allLabel="All albums"
        onSelect={onSelect}
        onTrackEl={(el) => onTrackEl(groupIndex, el)}
      />

      {group.albums.map((album, i) => (
        <AlbumBlock
          key={album.id}
          album={album}
          index={sectionIndexStart + i}
          active={activeCategory === album.id}
          forceLoad={forcedIds.has(album.id)}
          onOpen={onOpen}
          onSectionEl={onSectionEl}
        />
      ))}
    </div>
  );
}

export default function GalleriesClient({ data }: { data: JbGalleriesPageData }) {
  const groups = data?.groups ?? [];
  const allAlbums = useMemo(() => groups.flatMap((g) => g.albums), [groups]);
  const albumById = useMemo(() => {
    const map = new Map<string, { album: JbGalleryAlbum; groupIndex: number }>();
    groups.forEach((g, gi) => {
      for (const a of g.albums) map.set(a.id, { album: a, groupIndex: gi });
    });
    return map;
  }, [groups]);

  const [activeCategory, setActiveCategory] = useState(ALL_ID);
  const [forcedIds, setForcedIds] = useState<Set<string>>(() => new Set());
  const [lightbox, setLightbox] = useState<{
    items: JbGalleryImage[];
    index: number;
  } | null>(null);

  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const scrollingToRef = useRef<string | null>(null);
  const activeCategoryRef = useRef(ALL_ID);
  const urlSyncReady = useRef(false);
  const groupTrackRefs = useRef<(HTMLDivElement | null)[]>([]);

  const stickyFocusY = useCallback(() => {
    const raw = getComputedStyle(
      document.querySelector('.jb-oasis') || document.documentElement
    ).getPropertyValue('--jb-gal-sticky-offset');
    return (parseInt(raw, 10) || 120) + 8;
  }, []);

  /** Pixels to clear sticky chrome. `header` = site header only; `pills` = header + album chips. */
  const scrollClearance = useCallback((mode: 'header' | 'pills' = 'pills') => {
    const root = document.querySelector('.jb-oasis') || document.documentElement;
    const styles = getComputedStyle(root);
    const header = parseFloat(styles.getPropertyValue('--jb-header-h')) || 72;
    if (mode === 'header') return header + 12;
    const sticky = parseFloat(styles.getPropertyValue('--jb-gal-sticky-offset'));
    return (Number.isFinite(sticky) && sticky > 0 ? sticky : header + 56) + 8;
  }, []);

  const scrollElementIntoView = useCallback(
    (el: HTMLElement | null, mode: 'header' | 'pills' = 'pills') => {
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - scrollClearance(mode);
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    },
    [scrollClearance]
  );

  /**
   * Hash-only URL sync (NMBA pattern) — avoids Next.js RSC refetch on path change.
   * Example: /jagdamba-bhawan/galleries#campus
   */
  const syncUrl = useCallback((id: string | null) => {
    const hash = id && id !== ALL_ID ? `#${id}` : '';
    const { pathname, search, hash: currentHash } = window.location;
    if (currentHash === hash || (!hash && !currentHash)) return;
    window.history.replaceState(window.history.state, '', `${pathname}${search}${hash}`);
  }, []);

  const centerChip = useCallback(
    (id: string) => {
      const meta = albumById.get(id);
      const gi = meta?.groupIndex ?? 0;
      const track = groupTrackRefs.current[gi];
      const chip = track?.querySelector<HTMLElement>(
        `[data-chip-id="${id === ALL_ID ? ALL_ID : id}"]`
      );
      chip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    },
    [albumById]
  );

  const setActiveSmooth = useCallback(
    (id: string, opts?: { syncHash?: boolean; centerChip?: boolean }) => {
      if (activeCategoryRef.current === id) {
        if (opts?.syncHash && urlSyncReady.current) syncUrl(id === ALL_ID ? null : id);
        return;
      }
      activeCategoryRef.current = id;
      setActiveCategory(id);
      if (opts?.syncHash !== false && urlSyncReady.current) {
        syncUrl(id === ALL_ID ? null : id);
      }
      if (opts?.centerChip) centerChip(id);
    },
    [centerChip, syncUrl]
  );

  const scrollToCategory = useCallback(
    (id: string, opts?: { updateUrl?: boolean }) => {
      const updateUrl = opts?.updateUrl !== false;

      if (id === ALL_ID) {
        const targetId = allAlbums[0]?.id;
        scrollingToRef.current = targetId || ALL_ID;
        setActiveSmooth(ALL_ID, { syncHash: false, centerChip: true });
        if (updateUrl) syncUrl(null);
        requestAnimationFrame(() => {
          scrollElementIntoView(document.getElementById(GRID_ID), 'header');
          window.setTimeout(() => {
            scrollingToRef.current = null;
          }, 700);
        });
        return;
      }

      scrollingToRef.current = id;
      setActiveSmooth(id, { syncHash: updateUrl, centerChip: true });
      setForcedIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      requestAnimationFrame(() => {
        window.setTimeout(() => {
          scrollElementIntoView(sectionRefs.current.get(id) || null, 'pills');
          window.setTimeout(() => {
            scrollingToRef.current = null;
          }, 700);
        }, 40);
      });
    },
    [allAlbums, scrollElementIntoView, setActiveSmooth, syncUrl]
  );

  const onSectionEl = useCallback((id: string, el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  }, []);

  const onTrackEl = useCallback((groupIndex: number, el: HTMLDivElement | null) => {
    groupTrackRefs.current[groupIndex] = el;
  }, []);

  // Deep-link from hash on mount
  useEffect(() => {
    if (allAlbums.length === 0) return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && hash !== GRID_ID && albumById.has(hash)) {
      scrollToCategory(hash, { updateUrl: false });
      syncUrl(hash);
    }
    urlSyncReady.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only deep link
  }, [allAlbums.length]);

  // Hashchange (back/forward within page)
  useEffect(() => {
    const onHash = () => {
      if (!urlSyncReady.current) return;
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) {
        setActiveSmooth(ALL_ID, { syncHash: false, centerChip: false });
        return;
      }
      if (albumById.has(hash) && activeCategoryRef.current !== hash) {
        scrollToCategory(hash, { updateUrl: false });
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [albumById, scrollToCategory, setActiveSmooth]);

  // rAF scroll spy — update pill + hash, do not auto-center chips
  useEffect(() => {
    if (allAlbums.length === 0) return;
    let raf = 0;
    let ticking = false;

    const syncActive = () => {
      ticking = false;
      if (scrollingToRef.current) return;
      const focusY = stickyFocusY();
      let nextId = ALL_ID;
      for (const album of allAlbums) {
        const el = sectionRefs.current.get(album.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= focusY) nextId = album.id;
        else break;
      }
      if (nextId === activeCategoryRef.current) return;
      setActiveSmooth(nextId, { syncHash: true, centerChip: false });
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(syncActive);
    };

    syncActive();
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [allAlbums, setActiveSmooth, stickyFocusY]);

  const openImage = useCallback((items: JbGalleryImage[], index: number) => {
    setLightbox({ items, index });
  }, []);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const changeLightboxIndex = useCallback((next: number) => {
    setLightbox((lb) => (lb ? { ...lb, index: next } : lb));
  }, []);

  const scrollToGroup = useCallback(
    (groupIndex: number) => {
      const group = groups[groupIndex];
      if (!group) return;
      if (groupIndex === 0) {
        scrollToCategory(ALL_ID);
        return;
      }
      const heroId = `jb-gal-group-${group.id}`;
      const firstAlbum = group.albums[0]?.id;
      setForcedIds((prev) => {
        if (!firstAlbum || prev.has(firstAlbum)) return prev;
        const next = new Set(prev);
        next.add(firstAlbum);
        return next;
      });
      scrollingToRef.current = firstAlbum || heroId;
      requestAnimationFrame(() => {
        scrollElementIntoView(document.getElementById(heroId), 'header');
        window.setTimeout(() => {
          scrollingToRef.current = null;
        }, 700);
      });
      if (firstAlbum) {
        setActiveSmooth(firstAlbum, { syncHash: true, centerChip: true });
      }
    },
    [groups, scrollElementIntoView, scrollToCategory, setActiveSmooth]
  );

  const primary = groups[0];
  const headingParts = titleParts(primary?.heading || 'Campus in pictures');
  const heroLede =
    primary?.subheading ||
    'Photo collections from Jagdamba Bhawan Retreat Center — campus, retreats and service.';
  const heroThumbs = useMemo(() => pickThumbs(groups[0]?.albums || []), [groups]);
  const jumpLinks = useMemo(
    () =>
      groups.map((g, i) => ({
        id: g.id,
        label: jumpLabel(g.heading, i),
        groupIndex: i,
      })),
    [groups]
  );
  let sectionCursor = 0;

  if (groups.length === 0) {
    return (
      <div className="jb-gal">
        <JbMediaHero
          eyebrow={
            <>
              <Images className="h-4 w-4" aria-hidden /> Media · Galleries
            </>
          }
          title="Campus in"
          titleAccent="pictures"
          lede="Photo collections from Jagdamba Bhawan Retreat Center will appear here soon."
          animation={<GalleriesAuraAnimation />}
        />
        <div className="jb-container pb-16">
          <div className="jb-media-empty mt-10">
            <p className="jb-media-empty__title">Galleries coming soon</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="jb-gal">
      <JbMediaHero
        eyebrow={
          <>
            <Images className="h-4 w-4" aria-hidden /> Media · Galleries
          </>
        }
        title={headingParts.title}
        titleAccent={headingParts.accent}
        lede={heroLede}
        animation={<GalleriesAuraAnimation thumbs={heroThumbs} />}
        actions={
          <>
            {jumpLinks.map((link) => (
              <a
                key={link.id}
                href={
                  link.groupIndex === 0
                    ? `#${GRID_ID}`
                    : `#jb-gal-group-${link.id}`
                }
                className="jb-media-hero__btn jb-media-hero__btn--ghost"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToGroup(link.groupIndex);
                }}
              >
                {link.label}
              </a>
            ))}
          </>
        }
      />

      <div id={GRID_ID} className="jb-gal-flow pb-16 md:pb-24">
        {groups.map((group, gi) => {
          const start = sectionCursor;
          sectionCursor += group.albums.length;
          const activeForGroup =
            activeCategory === ALL_ID || albumById.get(activeCategory)?.groupIndex === gi
              ? activeCategory
              : '';
          const sectionHeading = titleParts(group.heading);
          const sectionThumbs = pickThumbs(group.albums);
          const firstAlbumId = group.albums[0]?.id;

          return (
            <div key={group.id} className="jb-gal-flow__group">
              {gi > 0 ? (
                <JbMediaHero
                  embedded
                  id={`jb-gal-group-${group.id}`}
                  eyebrow={
                    <>
                      <Images className="h-4 w-4" aria-hidden /> Collection{' '}
                      {String(gi + 1).padStart(2, '0')}
                    </>
                  }
                  title={sectionHeading.title}
                  titleAccent={sectionHeading.accent}
                  lede={
                    group.subheading ||
                    'Service, culture and community moments from Jagdamba Bhawan Retreat Center.'
                  }
                  animation={<GalleriesAuraAnimation thumbs={sectionThumbs} />}
                  actions={
                    firstAlbumId ? (
                      <a
                        href={`#${firstAlbumId}`}
                        className="jb-media-hero__btn jb-media-hero__btn--ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToCategory(firstAlbumId);
                        }}
                      >
                        Browse collection
                      </a>
                    ) : undefined
                  }
                />
              ) : null}

              <div className="jb-container jb-gal-sections">
                <GroupBlock
                  group={group}
                  groupIndex={gi}
                  activeCategory={activeForGroup}
                  sectionIndexStart={start}
                  forcedIds={forcedIds}
                  onSelect={scrollToCategory}
                  onOpen={openImage}
                  onSectionEl={onSectionEl}
                  onTrackEl={onTrackEl}
                />
              </div>
            </div>
          );
        })}
      </div>

      {lightbox ? (
        <GalleryLightbox
          images={lightbox.items}
          index={lightbox.index}
          onClose={closeLightbox}
          onChange={changeLightboxIndex}
        />
      ) : null}
    </div>
  );
}
