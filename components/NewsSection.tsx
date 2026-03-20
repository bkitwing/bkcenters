'use client';

import { useState, useCallback } from 'react';
import { NewsPost } from '@/lib/types';

interface NewsSectionProps {
  initialPosts: NewsPost[];
  totalCount: number;
  email: string;
  pageSize?: number;
}

function NewsCard({ post }: { post: NewsPost }) {
  const imageUrl =
    post.featuredImage?.formats?.miniHD?.url ||
    post.featuredImage?.formats?.HD?.url ||
    post.featuredImage?.formats?.microHD?.url ||
    post.featuredImage?.url ||
    null;
  const altText = post.featuredImage?.alternativeText || post.title;
  const newsUrl = `https://www.brahmakumaris.com/news/post/${post.slug}`;
  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <a
      href={newsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] bg-neutral-100 dark:bg-neutral-700 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={altText}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-spirit-purple-50 to-spirit-blue-50 dark:from-spirit-purple-900/20 dark:to-spirit-blue-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-spirit-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        )}
        {post.Featured && (
          <span className="absolute top-2 left-2 bg-spirit-purple-600 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {formattedDate && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">{formattedDate}</p>
        )}
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 leading-snug line-clamp-2 group-hover:text-spirit-purple-700 dark:group-hover:text-spirit-purple-400 transition-colors duration-200">
          {post.title}
        </h3>
        <span className="inline-flex items-center mt-3 text-xs font-medium text-spirit-purple-600 dark:text-spirit-purple-400 group-hover:text-spirit-purple-800 dark:group-hover:text-spirit-purple-300 transition-colors">
          Read more
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </a>
  );
}

export default function NewsSection({ initialPosts, totalCount, email, pageSize = 6 }: NewsSectionProps) {
  const [posts, setPosts] = useState<NewsPost[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const hasMore = posts.length < totalCount;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = currentPage + 1;
      const res = await fetch(
        `/centers/api/centers/news?email=${encodeURIComponent(email)}&page=${nextPage}&pageSize=${pageSize}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      setPosts((prev) => [...prev, ...data.posts]);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more news:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, currentPage, email, pageSize]);

  if (posts.length === 0) return null;

  return (
    <div className="mt-10 pt-10">
      {/* Section Divider */}
      <div className="flex items-center mb-8">
        <div className="flex-grow h-px bg-gradient-to-r from-transparent via-spirit-purple-300 dark:via-spirit-purple-700 to-transparent"></div>
        <div className="px-4">
          <h2 className="text-2xl font-bold text-spirit-purple-700 dark:text-spirit-purple-400 bg-white dark:bg-neutral-900 px-2">News &amp; Updates</h2>
        </div>
        <div className="flex-grow h-px bg-gradient-to-r from-transparent via-spirit-purple-300 dark:via-spirit-purple-700 to-transparent"></div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <NewsCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-spirit-purple-300 dark:border-spirit-purple-700 text-spirit-purple-700 dark:text-spirit-purple-300 bg-white dark:bg-neutral-800 hover:bg-spirit-purple-50 dark:hover:bg-spirit-purple-900/20 hover:border-spirit-purple-400 transition-all duration-200 text-sm font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              <>
                Load More News
                <span className="text-xs text-neutral-500">
                  ({posts.length} of {totalCount})
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
