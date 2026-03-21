'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MapPin, BookOpen, Headphones, CalendarDays, Newspaper, Map, HelpCircle, MessageCircle, ChevronRight } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  iconName: string;
}

interface SectionNavProps {
  items: NavItem[];
}

const iconMap: Record<string, React.ElementType> = {
  MapPin, BookOpen, Headphones, CalendarDays, Newspaper, Map, HelpCircle, MessageCircle,
};

export default function SectionNav({ items }: SectionNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(items[0]?.id || '');
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check if scrollable to the right
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasMore = el.scrollWidth - el.scrollLeft - el.clientWidth > 4;
    setCanScrollRight(hasMore);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sectionIds = items.map(i => i.id);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveId(id);
          }
        },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [items]);

  // Scroll the clicked nav item to center of the scrollable area
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveId(id);

    // Scroll the target section into view
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: 'smooth' });

    // Scroll the nav item to center of the nav bar
    const navItem = e.currentTarget;
    const container = scrollRef.current;
    if (container && navItem) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = navItem.getBoundingClientRect();
      const scrollLeft = container.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width / 2) + (itemRect.width / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  // Scroll nav bar to the right when chevron is tapped
  const handleScrollRight = () => {
    const container = scrollRef.current;
    if (container) {
      container.scrollBy({ left: 120, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky z-40 backdrop-blur-md border-b border-spirit-purple-200/60 dark:border-spirit-purple-800/30 shadow-[0_1px_8px_rgba(107,70,193,0.06)]" style={{ top: 'var(--header-h, 3.5rem)' }}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-spirit-purple-50/70 via-white to-spirit-purple-50/70 dark:from-spirit-purple-950/40 dark:via-neutral-900/95 dark:to-spirit-purple-950/40" />

      <div className="container mx-auto px-4 relative">
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-hide -mb-px scroll-smooth"
          >
            {items.map((item) => {
              const Icon = iconMap[item.iconName];
              const isActive = activeId === item.id;
              return (
                <a
                  key={item.id}
                  data-nav-id={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'text-spirit-purple-700 dark:text-spirit-purple-300 border-spirit-purple-600 dark:border-spirit-purple-400'
                      : 'text-neutral-500 dark:text-neutral-400 border-transparent hover:text-spirit-purple-600 dark:hover:text-spirit-purple-400 hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                </a>
              );
            })}
          </div>

          {/* Scroll-more chevron button — tapping scrolls nav right, mobile only */}
          {canScrollRight && (
            <button
              onClick={handleScrollRight}
              aria-label="Scroll for more"
              className="absolute right-0 top-0 bottom-0 flex items-center md:hidden z-10"
            >
              <div className="w-9 h-full bg-gradient-to-l from-spirit-purple-50 dark:from-neutral-900 via-spirit-purple-50/80 dark:via-neutral-900/80 to-transparent flex items-center justify-end pr-1">
                <ChevronRight className="w-4 h-4 text-spirit-purple-500 dark:text-spirit-purple-400 animate-pulse" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
