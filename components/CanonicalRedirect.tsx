// Same as basePath in next.config.js
const BASE_PATH = '/centers';

/**
 * Sends visitors and search engines on to a page's canonical URL when it was
 * reached by a wrong path (e.g. a Nepal province under /india/…).
 *
 * Uses an instant meta refresh, which Google treats as a permanent redirect,
 * instead of permanentRedirect(): Next 14 caches an ISR redirect without its
 * Location header, so every cached copy would be a broken 308. This page caches
 * like any other and works without JavaScript.
 */
export default function CanonicalRedirect({ href }: { href: string }) {
  const url = `${BASE_PATH}${href}`;
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <meta httpEquiv="refresh" content={`0;url=${url}`} />
      <p className="text-neutral-700 dark:text-neutral-300">
        This page has moved to{' '}
        <a href={url} className="font-semibold text-spirit-purple-700 dark:text-spirit-purple-300 underline underline-offset-2">
          {url}
        </a>
      </p>
    </div>
  );
}
