import Link from 'next/link';
import { ArrowRight, Calendar, Newspaper } from 'lucide-react';
import { JB_NEWS_TAG_ID, type JbEventPost, type JbNewsPost } from './jb-media-data';
import { JB_EVENTS_HREF, JB_NEWS_HREF } from './nav';

function isHttpUrl(s: string | null | undefined): s is string {
  return !!s && (s.startsWith('http://') || s.startsWith('https://'));
}

function eventEyebrow(events: JbEventPost[]) {
  if (events.some((e) => e.status === 'ongoing')) return 'Happening now';
  if (events.some((e) => e.status === 'upcoming')) return 'Coming up';
  return 'From the campus';
}

function statusLabel(status: JbEventPost['status']) {
  if (status === 'ongoing') return 'Ongoing';
  if (status === 'upcoming') return 'Upcoming';
  return 'Past';
}

export function HomeEventsTeaser({ events }: { events: JbEventPost[] }) {
  return (
    <section id="events" className="jb-section jb-section--tone jb-home-events">
      <div className="jb-container">
        <div className="jb-home-events__head">
          <div>
            <p className="jb-eyebrow">
              <Calendar className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden />{' '}
              {events.length ? eventEyebrow(events) : 'Events'}
            </p>
            <h2 className="jb-heading !mb-0">Campus programmes</h2>
            <span className="jb-rule" />
          </div>
          <Link href={JB_EVENTS_HREF} className="jb-home-more">
            All events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {events.length > 0 ? (
          <div className="jb-home-events__rail">
            {events.slice(0, 3).map((e) => (
              <article key={e.id} className="jb-home-event">
                <div className="jb-home-event__media">
                  {e.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <div className="jb-home-event__ph" />
                  )}
                  <span className={`jb-home-event__status jb-home-event__status--${e.status}`}>
                    {statusLabel(e.status)}
                  </span>
                </div>
                <div className="jb-home-event__body">
                  <time dateTime={e.start_date}>{e.dateLabel}</time>
                  <h3>{e.title}</h3>
                  <div className="jb-home-event__actions">
                    <a
                      href={e.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="jb-home-event__btn"
                    >
                      Know more
                    </a>
                    {(e.status === 'upcoming' || e.status === 'ongoing') &&
                    isHttpUrl(e.registration_link) ? (
                      <a
                        href={e.registration_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="jb-home-event__btn jb-home-event__btn--gold"
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
          <Link href={JB_EVENTS_HREF} className="jb-btn jb-btn--ink !min-h-10 !text-sm mt-2">
            Browse events <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

export function HomeNewsTeaser({ news }: { news: JbNewsPost[] }) {
  if (news.length === 0) return null;

  return (
    <section id="news" className="jb-section jb-section--tone jb-home-news">
      <div className="jb-container">
        <div className="jb-home-news__head">
          <div>
            <p className="jb-eyebrow">
              <Newspaper className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> News
            </p>
            <h2 className="jb-heading !mb-0">Latest news</h2>
            <span className="jb-rule" />
          </div>
          <Link href={JB_NEWS_HREF} className="jb-home-more">
            All news <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="jb-home-news__row">
          {news.slice(0, 3).map((p) => {
            const category =
              p.tags.find((t) => t.id !== JB_NEWS_TAG_ID)?.name ||
              p.tags[0]?.name ||
              'Campus';
            return (
              <a
                key={p.id}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="jb-home-news-card"
              >
                <div className="jb-home-news-card__media">
                  {p.imageThumbUrl || p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageThumbUrl || p.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <div className="jb-home-news-card__ph" />
                  )}
                  <span className="jb-home-news-card__cat">{category}</span>
                </div>
                <div className="jb-home-news-card__body">
                  <time dateTime={p.date}>{p.dateLabel}</time>
                  <h3>{p.title}</h3>
                  <span className="jb-home-news-card__go">
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
  news: JbNewsPost[];
  events: JbEventPost[];
}) {
  return (
    <>
      <HomeEventsTeaser events={events} />
      <HomeNewsTeaser news={news} />
    </>
  );
}
