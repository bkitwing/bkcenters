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
  const shellRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(items[0]?.id || '');
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sectionIds = items.map((i) => i.id);

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

    return () => observers.forEach((o) => o.disconnect());
  }, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveId(id);

    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: 'smooth' });

    const navItem = e.currentTarget;
    const container = scrollRef.current;
    if (container && navItem) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = navItem.getBoundingClientRect();
      const scrollLeft =
        container.scrollLeft +
        (itemRect.left - containerRect.left) -
        containerRect.width / 2 +
        itemRect.width / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    const container = scrollRef.current;
    if (container) {
      container.scrollBy({ left: 120, behavior: 'smooth' });
    }
  };

  // Publish sticky chrome height (shell bottom − header bottom gap included via offsetHeight)
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty('--bk-sticky-h', `${el.offsetHeight}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--bk-sticky-h');
    };
  }, []);

  return (
    <div ref={shellRef} data-bk-section-nav className="bk-section-nav-shell">
      <div className="bk-section-nav-shell__inner">
        <div className="bk-section-nav-pill relative">
          <div
            ref={scrollRef}
            className="flex flex-1 overflow-x-auto scrollbar-hide scroll-smooth px-1.5 py-1"
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'text-[var(--uh-ink-gold-deep,#7a5a14)] bg-[rgba(184,134,11,0.14)] dark:text-[#f0d78c] dark:bg-[rgba(226,197,106,0.18)]'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-[var(--uh-ink-gold-deep,#7a5a14)] hover:bg-[rgba(184,134,11,0.08)] dark:hover:text-[#e2c56a] dark:hover:bg-[rgba(226,197,106,0.1)]'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  {item.label}
                </a>
              );
            })}
          </div>

          {canScrollRight && (
            <button
              onClick={handleScrollRight}
              aria-label="Scroll for more"
              className="absolute right-0 top-0 bottom-0 flex items-center md:hidden z-10"
            >
              <div className="w-10 h-full bg-gradient-to-l from-[rgba(255,253,250,0.98)] dark:from-[rgba(32,26,22,0.95)] via-[rgba(255,253,250,0.85)] dark:via-[rgba(32,26,22,0.75)] to-transparent flex items-center justify-end pr-2 rounded-r-full">
                <ChevronRight className="w-4 h-4 text-amber-700/70 dark:text-amber-300/80 animate-pulse" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
