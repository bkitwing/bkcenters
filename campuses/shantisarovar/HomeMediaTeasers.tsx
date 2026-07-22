import Link from 'next/link';
import { ArrowRight, Calendar, Newspaper } from 'lucide-react';
import { SS_NEWS_TAG_ID, type SsEventPost, type SsNewsPost } from './ss-media-data';
import { SS_EVENTS_HREF, SS_NEWS_HREF } from './nav';

function isHttpUrl(s: string | null | undefined): s is string {
  return !!s && (s.startsWith('http://') || s.startsWith('https://'));
}

function eventEyebrow(events: SsEventPost[]) {
  if (events.some((e) => e.status === 'ongoing')) return 'Happening now';
  if (events.some((e) => e.status === 'upcoming')) return 'Coming up';
  return 'From the campus';
}

function statusLabel(status: SsEventPost['status']) {
  if (status === 'ongoing') return 'Ongoing';
  if (status === 'upcoming') return 'Upcoming';
  return 'Past';
}

export function HomeEventsTeaser({ events }: { events: SsEventPost[] }) {
  return (
    <section id="events" className="ss-section ss-section--tone ss-home-events">
      <div className="ss-container">
        <div className="ss-home-events__head">
          <div>
            <p className="ss-eyebrow">
              <Calendar className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden />{' '}
              {events.length ? eventEyebrow(events) : 'Events'}
            </p>
            <h2 className="ss-heading !mb-0">Campus programmes</h2>
            <span className="ss-rule" />
          </div>
          <Link href={SS_EVENTS_HREF} className="ss-home-more">
            All events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {events.length > 0 ? (
          <div className="ss-home-events__rail">
            {events.slice(0, 3).map((e) => (
              <article key={e.id} className="ss-home-event">
                <div className="ss-home-event__media">
                  {e.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <div className="ss-home-event__ph" />
                  )}
                  <span className={`ss-home-event__status ss-home-event__status--${e.status}`}>
                    {statusLabel(e.status)}
                  </span>
                </div>
                <div className="ss-home-event__body">
                  <time dateTime={e.start_date}>{e.dateLabel}</time>
                  <h3>{e.title}</h3>
                  <div className="ss-home-event__actions">
                    <a
                      href={e.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ss-home-event__btn"
                    >
                      Know more
                    </a>
                    {(e.status === 'upcoming' || e.status === 'ongoing') &&
                    isHttpUrl(e.registration_link) ? (
                      <a
                        href={e.registration_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ss-home-event__btn ss-home-event__btn--gold"
                      >
                        Register
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Link href={SS_EVENTS_HREF} className="ss-btn ss-btn--ink !min-h-10 !text-sm mt-2">
            Browse events <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

export function HomeNewsTeaser({ news }: { news: SsNewsPost[] }) {
  if (news.length === 0) return null;

  return (
    <section id="news" className="ss-section ss-section--tone ss-home-news">
      <div className="ss-container">
        <div className="ss-home-news__head">
          <div>
            <p className="ss-eyebrow">
              <Newspaper className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> News
            </p>
            <h2 className="ss-heading !mb-0">Latest news</h2>
            <span className="ss-rule" />
          </div>
          <Link href={SS_NEWS_HREF} className="ss-home-more">
            All news <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="ss-home-news__row">
          {news.slice(0, 3).map((p) => {
            const category =
              p.tags.find((t) => t.id !== SS_NEWS_TAG_ID)?.name ||
              p.tags[0]?.name ||
              'Campus';
            return (
              <a
                key={p.id}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="ss-home-news-card"
              >
                <div className="ss-home-news-card__media">
                  {p.imageThumbUrl || p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageThumbUrl || p.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <div className="ss-home-news-card__ph" />
                  )}
                  <span className="ss-home-news-card__cat">{category}</span>
                </div>
                <div className="ss-home-news-card__body">
                  <time dateTime={p.date}>{p.dateLabel}</time>
                  <h3>{p.title}</h3>
                  <span className="ss-home-news-card__go">
                    Read more <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** @deprecated Prefer HomeEventsTeaser + HomeNewsTeaser for section ordering */
export function HomeMediaTeasers({
  news,
  events,
}: {
  news: SsNewsPost[];
  events: SsEventPost[];
}) {
  return (
    <>
      <HomeEventsTeaser events={events} />
      <HomeNewsTeaser news={news} />
    </>
  );
}
