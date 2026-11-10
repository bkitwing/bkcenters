import Link from 'next/link';
import { ArrowRight, Newspaper } from 'lucide-react';
import { SHK_NEWS_TAG_ID, type ShkNewsPost } from './news-data';
import { SHK_NEWS_HREF } from './nav';

export function HomeNewsTeaser({ news }: { news: ShkNewsPost[] }) {
  return (
    <section id="news" className="shk-section shk-section--tone shk-home-news">
      <div className="shk-container">
        <div className="shk-home-news__head">
          <div>
            <p className="shk-eyebrow">
              <Newspaper className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> News
            </p>
            <h2 className="shk-heading !mb-0">Latest news</h2>
            <span className="shk-rule" />
          </div>
          <Link href={SHK_NEWS_HREF} className="shk-home-more">
            All news <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {news.length > 0 ? (
          <div className="shk-home-news__row">
            {news.slice(0, 3).map((p) => {
              const category = p.tags.find((t) => t.id !== SHK_NEWS_TAG_ID)?.name || 'Campus';
              return (
                <a
                  key={p.id}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shk-home-news-card"
                >
                  <div className="shk-home-news-card__media">
                    {p.imageThumbUrl || p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageThumbUrl || p.imageUrl} alt="" loading="lazy" />
                    ) : (
                      <div className="shk-home-news-card__ph" />
                    )}
                    <span className="shk-home-news-card__cat">{category}</span>
                  </div>
                  <div className="shk-home-news-card__body">
                    <time dateTime={p.date}>{p.dateLabel}</time>
                    <h3>{p.title}</h3>
                    <span className="shk-home-news-card__go">
                      Read more <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="shk-media-empty">
            <p className="shk-media-empty__title">Service news will appear here</p>
            <p className="shk-about-copy !mb-0">
              Campus stories will be published from the news desk. The page is ready for them.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
