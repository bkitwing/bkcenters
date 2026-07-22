'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Newspaper, Play } from 'lucide-react';
import type { SsNewsCategory, SsNewsPageData, SsNewsPost } from '../ss-media-data';
import { SsMediaHero } from '../SsMediaHero';
import { NewsMapAnimation } from './NewsMapAnimation';

const ARCHIVE_ID = 'ss-news-archive';
const ALL_ID = '__all__';

function NewsCard({ post }: { post: SsNewsPost }) {
  return (
    <article className={`ss-news-card${post.Featured ? ' ss-news-card--featured' : ''}`}>
      <a
        href={post.href}
        target="_blank"
        rel="noopener noreferrer"
        className="ss-news-card__link"
        aria-label={`Read: ${post.title}`}
      >
        <div className="ss-news-card__media">
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageThumbUrl || post.imageUrl}
              alt={post.imageAlt}
              loading="lazy"
              className="ss-news-card__img"
            />
          ) : (
            <div className="ss-news-card__placeholder" aria-hidden />
          )}
          {post.hasVideo ? (
            <span className="ss-news-card__badge" aria-label="Video">
              <Play className="h-3 w-3" />
            </span>
          ) : null}
          {post.Featured ? (
            <span className="ss-news-card__badge ss-news-card__badge--feat">Featured</span>
          ) : null}
        </div>
        <div className="ss-news-card__body">
          <p className="ss-news-card__meta">
            <time dateTime={post.date}>{post.dateLabel}</time>
          </p>
          <h3 className="ss-news-card__title">{post.title}</h3>
          <span className="ss-news-card__out">
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
  categories: SsNewsCategory[];
  activeId: string;
  onSelect: (id: string) => void;
  trackRef?: (el: HTMLDivElement | null) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <nav className="ss-gal-nav ss-news-nav" aria-label="News categories">
      <div className="ss-gal-nav__track" ref={trackRef} role="group">
        <button
          type="button"
          data-chip-id={ALL_ID}
          className={`ss-gal-pill${activeId === ALL_ID ? ' is-active' : ''}`}
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
            className={`ss-gal-pill${activeId === cat.id ? ' is-active' : ''}`}
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

export default function NewsClient({ data }: { data: SsNewsPageData }) {
  const categories = data.categories;
  const [activeCategory, setActiveCategory] = useState(ALL_ID);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const navTrackRef = useRef<HTMLDivElement | null>(null);
  const scrollingToRef = useRef<string | null>(null);
  const activeRef = useRef(ALL_ID);
  const urlSyncReady = useRef(false);

  const stickyFocusY = useCallback(() => {
    const raw = getComputedStyle(
      document.querySelector('.ss-oasis') || document.documentElement
    ).getPropertyValue('--ss-gal-sticky-offset');
    return (parseInt(raw, 10) || 120) + 8;
  }, []);

  const scrollClearance = useCallback(() => {
    const root = document.querySelector('.ss-oasis') || document.documentElement;
    const styles = getComputedStyle(root);
    const header = parseFloat(styles.getPropertyValue('--ss-header-h')) || 72;
    const sticky = parseFloat(styles.getPropertyValue('--ss-gal-sticky-offset'));
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
      <div className="ss-news">
        <SsMediaHero
          eyebrow={
            <>
              <Newspaper className="h-4 w-4" aria-hidden /> Media · News
            </>
          }
          title="Service News"
          lede="Campus news and seva stories from Shanti Sarovar will appear here as they are published."
          animation={<NewsMapAnimation />}
        />
        <div className="ss-container pb-16">
          <div className="ss-media-empty">
            <p className="ss-media-empty__title">News stories coming soon</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ss-news">
      <SsMediaHero
        eyebrow={
          <>
            <Newspaper className="h-4 w-4" aria-hidden /> Media · News
          </>
        }
        title="Service News"
        lede="Retreats, conferences, seva and campus highlights from Shanti Sarovar — stories from the Brahma Kumaris news desk."
        animation={<NewsMapAnimation />}
        actions={
          <a href={`#${ARCHIVE_ID}`} className="ss-media-hero__btn ss-media-hero__btn--ghost">
            Browse archive
          </a>
        }
      />

      <div className="ss-container ss-news__body pb-16 md:pb-24">
        {data.latest.length > 0 ? (
          <section className="ss-news-latest" aria-labelledby="ss-news-latest-title">
            <h2 id="ss-news-latest-title" className="ss-news-latest__title">
              Latest stories
            </h2>
            <div className="ss-news-grid ss-news-grid--4">
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

        <div id={ARCHIVE_ID} className="ss-news-archive">
          {categories.length > 0 ? (
            categories.map((cat, i) => (
              <section
                key={cat.id}
                id={cat.id}
                ref={(el) => {
                  if (el) sectionRefs.current.set(cat.id, el);
                  else sectionRefs.current.delete(cat.id);
                }}
                className={`ss-news-category${activeCategory === cat.id ? ' is-active' : ''}`}
                aria-labelledby={`${cat.id}-title`}
              >
                <header className="ss-news-category__head">
                  <span className="ss-news-category__index" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 id={`${cat.id}-title`} className="ss-news-category__title">
                    {cat.label}
                  </h3>
                  <span className="ss-news-category__count">{cat.posts.length}</span>
                </header>
                <div className="ss-news-grid">
                  {cat.posts.map((p) => (
                    <NewsCard key={`${cat.id}-${p.id}`} post={p} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="ss-news-grid">
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
