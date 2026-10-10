'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, ChevronRight, ArrowRight } from 'lucide-react';

const DAYS = [
  { day: 1, title: 'Soul', blurb: 'Who am I beyond the body?' },
  { day: 2, title: 'God', blurb: 'Connect with the Supreme.' },
  { day: 3, title: 'Karma', blurb: 'Thoughts create destiny.' },
  { day: 4, title: 'Time', blurb: 'The cycle of the world drama.' },
  { day: 5, title: 'Family', blurb: 'One spiritual family tree.' },
  { day: 6, title: 'Rajyoga', blurb: 'Meditation that fills you.' },
  { day: 7, title: 'Living', blurb: 'Values in daily life.' },
] as const;

/** 7-day journey rail — distinct from other contact sections. */
export function ShkCourseStory() {
  const [active, setActive] = useState(0);
  const item = DAYS[active];

  return (
    <div className="shk-course-journey">
      <div className="shk-course-journey__rail" role="tablist" aria-label="Course days">
        {DAYS.map((d, i) => (
          <button
            key={d.day}
            type="button"
            role="tab"
            aria-selected={active === i}
            className={`shk-course-journey__step${active === i ? ' is-active' : ''}${
              i < active ? ' is-done' : ''
            }`}
            onClick={() => setActive(i)}
          >
            <span className="shk-course-journey__dot">{d.day}</span>
            <span className="shk-course-journey__name">{d.title}</span>
          </button>
        ))}
      </div>

      <div className="shk-course-journey__stage" role="tabpanel">
        <p className="shk-course-journey__day">Day {item.day} of 7</p>
        <h3 className="shk-course-journey__title">{item.title}</h3>
        <p className="shk-course-journey__blurb">{item.blurb}</p>
        <div className="shk-course-journey__actions">
          <a href="#shk-enquire" className="shk-btn shk-btn--primary !min-h-10 !text-sm">
            <Sparkles className="w-4 h-4" />
            Register your interest
          </a>
          <a
            href="https://courses.brahmakumaris.com/a-personal-journey-for-transformation"
            target="_blank"
            rel="noopener noreferrer"
            className="shk-btn shk-btn--ghost !min-h-10 !text-sm"
          >
            <BookOpen className="w-4 h-4" />
            Online intro
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <Link href="/shanti-shikhar#courses" className="shk-course-journey__more">
          All campus courses <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
