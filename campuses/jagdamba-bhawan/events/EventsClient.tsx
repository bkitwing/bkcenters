'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import type { JbEventPost, JbEventsPageData } from '../jb-media-data';
import { useLoadMore } from '../hooks/useLoadMore';
import { useJbEventsFetchMore } from '../hooks/useJbEventsFetchMore';
import { JbMediaHero } from '../JbMediaHero';
import { EventsAuraAnimation } from './EventsAuraAnimation';

const LIST_ID = 'jb-events-list';
const GROUP_ORDER = ['upcoming', 'ongoing', 'past'] as const;
const EVENTS_REVEAL_INITIAL = 12;
const EVENTS_REVEAL_BATCH = 12;
type EventGroupId = (typeof GROUP_ORDER)[number];

type EventGroup = {
  id: EventGroupId;
  label: string;
  events: JbEventPost[];
};

function defaultLandingId(groups: EventGroup[]): EventGroupId {
  if (groups.some((g) => g.id === 'upcoming' && g.events.length > 0)) return 'upcoming';
  if (groups.some((g) => g.id === 'ongoing' && g.events.length > 0)) return 'ongoing';
  return 'past';
}

function buildGroups(events: JbEventPost[]): EventGroup[] {
  const map: Record<EventGroupId, JbEventPost[]> = {
    upcoming: events
      .filter((e) => e.status === 'upcoming')
      .sort(
        (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      ),
    ongoing: events.filter((e) => e.status === 'ongoing'),
    past: events.filter((e) => e.status === 'past'),
  };
  const labels: Record<EventGroupId, string> = {
    upcoming: 'Upcoming',
    ongoing: 'Ongoing',
    past: 'Past',
  };
  return GROUP_ORDER.map((id) => ({ id, label: labels[id], events: map[id] }));
}

function mergeEvents(existing: JbEventPost[], incoming: JbEventPost[]): JbEventPost[] {
  const seen = new Set(existing.map((e) => e.id));
  const next = [...existing];
  for (const event of incoming) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    next.push(event);
  }
  return next;
}

function isHttpUrl(s: string | null | undefined): s is string {
  return !!s && (s.startsWith('http://') || s.startsWith('https://'));
}

function EventCard({ event }: { event: JbEventPost }) {
  const canRegister =
    (event.status === 'upcoming' || event.status === 'ongoing') &&
    isHttpUrl(event.registration_link);

  return (
    <article className={`jb-event-card jb-event-card--${event.status}`}>
      <div className="jb-event-card__media">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt={event.imageAlt}
            loading="lazy"
            className="jb-event-card__img"
          />
        ) : (
          <div className="jb-event-card__placeholder" aria-hidden />
        )}
        <span className={`jb-event-card__status jb-event-card__status--${event.status}`}>
          {event.status}
        </span>
      </div>
      <div className="jb-event-card__body">
        <p className="jb-event-card__meta">
          <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <time dateTime={event.start_date}>{event.dateLabel}</time>
        </p>
        <h3 className="jb-event-card__title">{event.title}</h3>
        <div className="jb-event-card__actions">
          <a
            href={event.href}
            target="_blank"
            rel="noopener noreferrer"
            className="jb-event-card__btn jb-event-card__btn--ghost"
          >
            Know more
            <ExternalLink className="w-3.5 h-3.5" aria-hidden />
          </a>
          {canRegister ? (
            <a
              href={event.registration_link!}
              target="_blank"
              rel="noopener noreferrer"
              className="jb-event-card__btn jb-event-card__btn--primary"
            >
              Register
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function EventGroupSection({
  group,
  activeId,
  sectionRef,
  isLast,
  apiSentinel,
}: {
  group: EventGroup;
  activeId: EventGroupId;
  sectionRef: (el: HTMLElement | null) => void;
  isLast?: boolean;
  apiSentinel?: ReactNode;
}) {
  const { visibleItems, hasMore, sentinel } = useLoadMore(
    group.events,
    EVENTS_REVEAL_INITIAL,
    EVENTS_REVEAL_BATCH
  );

  return (
    <section
      id={group.id}
      ref={sectionRef}
      className={`jb-events-group${activeId === group.id ? ' is-active' : ''}`}
      aria-label={`${group.label} events`}
    >
      <div className="jb-events-grid">
        {visibleItems.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      {sentinel}
      {isLast && !hasMore ? apiSentinel : null}
    </section>
  );
}

function EventsScheduleNav({
  groups,
  activeId,
  onSelect,
  trackRef,
}: {
  groups: EventGroup[];
  activeId: string;
  onSelect: (id: EventGroupId) => void;
  trackRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <nav className="jb-gal-nav jb-gal-nav--compact jb-events-nav" aria-label="Event schedule">
      <div className="jb-gal-nav__track" ref={trackRef} role="group">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            data-chip-id={g.id}
            className={`jb-gal-pill${activeId === g.id ? ' is-active' : ''}${
              g.events.length === 0 ? ' is-empty' : ''
            }`}
            onClick={() => onSelect(g.id)}
            aria-current={activeId === g.id ? 'true' : undefined}
          >
            {g.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function EventsClient({ data }: { data: JbEventsPageData }) {
  const [allEvents, setAllEvents] = useState(data.events);
  const [page, setPage] = useState(data.page);
  const [hasMore, setHasMore] = useState(data.hasMore);

  const groups = useMemo(() => buildGroups(allEvents), [allEvents]);
  const visibleGroups = useMemo(() => groups.filter((g) => g.events.length > 0), [groups]);
  const landingId = useMemo(() => defaultLandingId(groups), [groups]);

  const [activeId, setActiveId] = useState<EventGroupId>(landingId);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const navTrackRef = useRef<HTMLDivElement | null>(null);
  const scrollingToRef = useRef<string | null>(null);
  const activeRef = useRef<EventGroupId>(landingId);
  const urlSyncReady = useRef(false);
  const initialScrollDone = useRef(false);

  const onApiBatch = useCallback((batch: { events: JbEventPost[]; page: number; hasMore: boolean }) => {
    setAllEvents((prev) => mergeEvents(prev, batch.events));
    setPage(batch.page);
    setHasMore(batch.hasMore);
  }, []);

  const { sentinelRef: apiSentinelRef } = useJbEventsFetchMore({
    page,
    pageSize: data.pageSize,
    hasMore,
    onBatch: onApiBatch,
  });

  const stickyFocusY = useCallback(() => {
    const raw = getComputedStyle(
      document.querySelector('.jb-oasis') || document.documentElement
    ).getPropertyValue('--jb-gal-sticky-offset');
    return (parseInt(raw, 10) || 120) + 8;
  }, []);

  const scrollClearance = useCallback(() => {
    const root = document.querySelector('.jb-oasis') || document.documentElement;
    const styles = getComputedStyle(root);
    const header = parseFloat(styles.getPropertyValue('--jb-header-h')) || 72;
    const sticky = parseFloat(styles.getPropertyValue('--jb-gal-sticky-offset'));
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
    const hash = id ? `#${id}` : '';
    const { pathname, search, hash: currentHash } = window.location;
    if (currentHash === hash || (!hash && !currentHash)) return;
    window.history.replaceState(window.history.state, '', `${pathname}${search}${hash}`);
  }, []);

  const centerChip = useCallback((id: string) => {
    const chip = navTrackRef.current?.querySelector<HTMLElement>(`[data-chip-id="${id}"]`);
    chip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  const setActiveSmooth = useCallback(
    (id: EventGroupId, opts?: { syncHash?: boolean; centerChip?: boolean }) => {
      if (activeRef.current === id) {
        if (opts?.syncHash && urlSyncReady.current) syncUrl(id);
        return;
      }
      activeRef.current = id;
      setActiveId(id);
      if (opts?.syncHash !== false && urlSyncReady.current) syncUrl(id);
      if (opts?.centerChip) centerChip(id);
    },
    [centerChip, syncUrl]
  );

  const scrollToGroup = useCallback(
    (id: EventGroupId) => {
      const el = sectionRefs.current.get(id) ?? document.getElementById(id);
      setActiveSmooth(id, { syncHash: true, centerChip: true });
      if (!el) return;

      scrollingToRef.current = id;
      requestAnimationFrame(() => {
        scrollElementIntoView(el);
        window.setTimeout(() => {
          scrollingToRef.current = null;
        }, 700);
      });
    },
    [scrollElementIntoView, setActiveSmooth]
  );

  const resolveHashTarget = useCallback(
    (hash: string): EventGroupId => {
      if (!GROUP_ORDER.includes(hash as EventGroupId)) return landingId;
      const match = groups.find((g) => g.id === hash);
      return match && match.events.length > 0 ? (hash as EventGroupId) : landingId;
    },
    [groups, landingId]
  );

  useEffect(() => {
    if (allEvents.length === 0 || initialScrollDone.current) return;
    initialScrollDone.current = true;
    urlSyncReady.current = true;
    const target = resolveHashTarget(window.location.hash.replace(/^#/, ''));
    requestAnimationFrame(() => scrollToGroup(target));
  }, [allEvents.length, resolveHashTarget, scrollToGroup]);

  useEffect(() => {
    const onHash = () => {
      scrollToGroup(resolveHashTarget(window.location.hash.replace(/^#/, '')));
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [resolveHashTarget, scrollToGroup]);

  useEffect(() => {
    if (allEvents.length === 0) return;
    let raf = 0;
    let ticking = false;

    const syncActive = () => {
      ticking = false;
      if (scrollingToRef.current) return;
      const focusY = stickyFocusY();
      let nextId: EventGroupId = visibleGroups[0]?.id ?? landingId;
      for (const g of visibleGroups) {
        const el = sectionRefs.current.get(g.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= focusY) nextId = g.id;
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
  }, [landingId, setActiveSmooth, stickyFocusY, visibleGroups]);

  return (
    <div className="jb-events">
      <JbMediaHero
        eyebrow={
          <>
            <Calendar className="h-4 w-4" aria-hidden /> Media · Events
          </>
        }
        title="Campus Events"
        lede="Rajyoga retreats, workshops and campus programmes at Jagdamba Bhawan Retreat Center — what's happening now and what's ahead."
        animation={<EventsAuraAnimation />}
        actions={
          allEvents.length > 0 ? (
            <a href={`#${landingId}`} className="jb-media-hero__btn jb-media-hero__btn--ghost">
              View schedule
            </a>
          ) : undefined
        }
      />

      <div className="jb-container jb-events__body pb-16 md:pb-24">
        {allEvents.length === 0 ? (
          <div className="jb-media-empty">
            <p className="jb-media-empty__title">Events coming soon</p>
            <p className="jb-media-empty__desc">
              Retreats, conferences and programmes will be listed here as they are announced.
            </p>
          </div>
        ) : (
          <>
            <EventsScheduleNav
              groups={groups}
              activeId={activeId}
              onSelect={scrollToGroup}
              trackRef={(el) => {
                navTrackRef.current = el;
              }}
            />

            <div id={LIST_ID} className="jb-events-list">
              {visibleGroups.map((g, index) => (
                <EventGroupSection
                  key={g.id}
                  group={g}
                  activeId={activeId}
                  isLast={index === visibleGroups.length - 1}
                  apiSentinel={
                    hasMore ? (
                      <div
                        ref={apiSentinelRef}
                        className="jb-load-sentinel"
                        aria-hidden="true"
                      >
                        <div className="jb-load-sentinel__dots">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    ) : null
                  }
                  sectionRef={(el) => {
                    if (el) sectionRefs.current.set(g.id, el);
                    else sectionRefs.current.delete(g.id);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
