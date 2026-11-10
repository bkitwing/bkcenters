'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Newspaper, Play } from 'lucide-react';
import type { ShkNewsCategory, ShkNewsPageData, ShkNewsPost } from '../news-data';
import { ShkMediaHero } from '../ShkMediaHero';
import { NewsMapAnimation } from './NewsMapAnimation';

const ARCHIVE_ID = 'shk-news-archive';
const ALL_ID = '__all__';

function NewsCard({ post }: { post: ShkNewsPost }) {
  return (
    <article className={`shk-news-card${post.Featured ? ' shk-news-card--featured' : ''}`}>
      <a
        href={post.href}
        target="_blank"
        rel="noopener noreferrer"
        className="shk-news-card__link"
        aria-label={`Read: ${post.title}`}
      >
        <div className="shk-news-card__media">
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageThumbUrl || post.imageUrl}
              alt={post.imageAlt}
              loading="lazy"
              className="shk-news-card__img"
            />
          ) : (
            <div className="shk-news-card__placeholder" aria-hidden />
          )}
          {post.hasVideo ? (
            <span className="shk-news-card__badge" aria-label="Video">
              <Play className="h-3 w-3" />
            </span>
          ) : null}
          {post.Featured ? (
            <span className="shk-news-card__badge shk-news-card__badge--feat">Featured</span>
          ) : null}
        </div>
        <div className="shk-news-card__body">
          <p className="shk-news-card__meta">
            <time dateTime={post.date}>{post.dateLabel}</time>
          </p>
          <h3 className="shk-news-card__title">{post.title}</h3>
          <span className="shk-news-card__out">
            Read on news site
            <ExternalLink className="w-3.5 h-3.5" aria-hidden />
          </span>
        </div>
      </a>
    </article>
  );
}

function NewsCategoryNav({
  categories,
  activeId,
  onSelect,
  trackRef,
}: {
  categories: ShkNewsCategory[];
  activeId: string;
  onSelect: (id: string) => void;
  trackRef?: (el: HTMLDivElement | null) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <nav className="shk-gal-nav shk-news-nav" aria-label="News categories">
      <div className="shk-gal-nav__track" ref={trackRef} role="group">
        <button
          type="button"
          data-chip-id={ALL_ID}
          className={`shk-gal-pill${activeId === ALL_ID ? ' is-active' : ''}`}
          onClick={() => onSelect(ALL_ID)}
          aria-current={activeId === ALL_ID ? 'true' : undefined}
        >
          All stories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            data-chip-id={cat.id}
            className={`shk-gal-pill${activeId === cat.id ? ' is-active' : ''}`}
            onClick={() => onSelect(cat.id)}
            aria-current={activeId === cat.id ? 'true' : undefined}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function NewsClient({ data }: { data: ShkNewsPageData }) {
  const categories = data.categories;
  const [activeCategory, setActiveCategory] = useState(ALL_ID);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const navTrackRef = useRef<HTMLDivElement | null>(null);
  const scrollingToRef = useRef<string | null>(null);
  const activeRef = useRef(ALL_ID);
  const urlSyncReady = useRef(false);

  const stickyFocusY = useCallback(() => {
    const raw = getComputedStyle(
      document.querySelector('.shk-oasis') || document.documentElement
    ).getPropertyValue('--shk-gal-sticky-offset');
    return (parseInt(raw, 10) || 120) + 8;
  }, []);

  const scrollClearance = useCallback(() => {
    const root = document.querySelector('.shk-oasis') || document.documentElement;
    const styles = getComputedStyle(root);
    const header = parseFloat(styles.getPropertyValue('--shk-header-h')) || 72;
    const sticky = parseFloat(styles.getPropertyValue('--shk-gal-sticky-offset'));
    return (Number.isFinite(sticky) && sticky > 0 ? sticky : header + 56) + 8;
  }, []);

  const scrollElementIntoView = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - scrollClearance();
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    },
    [scrollClearance]
  );

  const syncUrl = useCallback((id: string | null) => {
    const hash = id && id !== ALL_ID ? `#${id}` : '';
    const { pathname, search, hash: currentHash } = window.location;
    if (currentHash === hash || (!hash && !currentHash)) return;
    window.history.replaceState(window.history.state, '', `${pathname}${search}${hash}`);
  }, []);

  const centerChip = useCallback((id: string) => {
    const track = navTrackRef.current;
    const chip = track?.querySelector<HTMLElement>(
      `[data-chip-id="${id === ALL_ID ? ALL_ID : id}"]`
    );
    chip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  const setActiveSmooth = useCallback(
    (id: string, opts?: { syncHash?: boolean; centerChip?: boolean }) => {
      if (activeRef.current === id) {
        if (opts?.syncHash && urlSyncReady.current) syncUrl(id === ALL_ID ? null : id);
        return;
      }
      activeRef.current = id;
      setActiveCategory(id);
      if (opts?.syncHash !== false && urlSyncReady.current) {
        syncUrl(id === ALL_ID ? null : id);
      }
      if (opts?.centerChip) centerChip(id);
    },
    [centerChip, syncUrl]
  );

  const scrollToCategory = useCallback(
    (id: string) => {
      scrollingToRef.current = id;
      setActiveSmooth(id, { syncHash: true, centerChip: true });

      const target =
        id === ALL_ID
          ? document.getElementById(ARCHIVE_ID)
          : sectionRefs.current.get(id) ?? document.getElementById(id);

      requestAnimationFrame(() => {
        scrollElementIntoView(target);
        window.setTimeout(() => {
          scrollingToRef.current = null;
        }, 700);
      });
    },
    [scrollElementIntoView, setActiveSmooth]
  );

  useEffect(() => {
    urlSyncReady.current = true;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && (hash === ALL_ID || categories.some((c) => c.id === hash))) {
      requestAnimationFrame(() => scrollToCategory(hash));
    }
    const onHash = () => {
      const h = window.location.hash.replace(/^#/, '');
      if (!h) scrollToCategory(ALL_ID);
      else if (categories.some((c) => c.id === h)) scrollToCategory(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [categories, scrollToCategory]);

  useEffect(() => {
    if (categories.length === 0) return;
    let raf = 0;
    let ticking = false;

    const syncActive = () => {
      ticking = false;
      if (scrollingToRef.current) return;
      const focusY = stickyFocusY();
      let nextId = ALL_ID;
      for (const cat of categories) {
        const el = sectionRefs.current.get(cat.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= focusY) nextId = cat.id;
        else break;
      }
      if (nextId === activeRef.current) return;
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
  }, [categories, setActiveSmooth, stickyFocusY]);

  if (data.posts.length === 0) {
    return (
      <div className="shk-news">
        <ShkMediaHero
          eyebrow={
            <>
              <Newspaper className="h-4 w-4" aria-hidden /> Media · News
            </>
          }
          title="Service News"
          lede="Campus news and seva stories from Shanti Shikhar will appear here as they are published."
          animation={<NewsMapAnimation />}
        />
        <div className="shk-container pb-16">
          <div className="shk-media-empty">
            <p className="shk-media-empty__title">News stories coming soon</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shk-news">
      <ShkMediaHero
        eyebrow={
          <>
            <Newspaper className="h-4 w-4" aria-hidden /> Media · News
          </>
        }
        title="Service News"
        lede="Retreats, conferences, seva and campus highlights from Shanti Shikhar — stories from the Brahma Kumaris news desk."
        animation={<NewsMapAnimation />}
        actions={
          <a href={`#${ARCHIVE_ID}`} className="shk-media-hero__btn shk-media-hero__btn--ghost">
            Browse archive
          </a>
        }
      />

      <div className="shk-container shk-news__body pb-16 md:pb-24">
        {data.latest.length > 0 ? (
          <section className="shk-news-latest" aria-labelledby="shk-news-latest-title">
            <h2 id="shk-news-latest-title" className="shk-news-latest__title">
              Latest stories
            </h2>
            <div className="shk-news-grid shk-news-grid--4">
              {data.latest.map((p) => (
                <NewsCard key={`latest-${p.id}`} post={p} />
              ))}
            </div>
          </section>
        ) : null}

        {categories.length > 0 ? (
          <NewsCategoryNav
            categories={categories}
            activeId={activeCategory}
            onSelect={scrollToCategory}
            trackRef={(el) => {
              navTrackRef.current = el;
            }}
          />
        ) : null}

        <div id={ARCHIVE_ID} className="shk-news-archive">
          {categories.length > 0 ? (
            categories.map((cat, i) => (
              <section
                key={cat.id}
                id={cat.id}
                ref={(el) => {
                  if (el) sectionRefs.current.set(cat.id, el);
                  else sectionRefs.current.delete(cat.id);
                }}
                className={`shk-news-category${activeCategory === cat.id ? ' is-active' : ''}`}
                aria-labelledby={`${cat.id}-title`}
              >
                <header className="shk-news-category__head">
                  <span className="shk-news-category__index" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 id={`${cat.id}-title`} className="shk-news-category__title">
                    {cat.label}
                  </h3>
                  <span className="shk-news-category__count">{cat.posts.length}</span>
                </header>
                <div className="shk-news-grid">
                  {cat.posts.map((p) => (
                    <NewsCard key={`${cat.id}-${p.id}`} post={p} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="shk-news-grid">
              {data.posts.map((p) => (
                <NewsCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
