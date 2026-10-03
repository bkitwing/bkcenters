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
export function SpCourseStory() {
  const [active, setActive] = useState(0);
  const item = DAYS[active];

  return (
    <div className="sp-course-journey">
      <div className="sp-course-journey__rail" role="tablist" aria-label="Course days">
        {DAYS.map((d, i) => (
          <button
            key={d.day}
            type="button"
            role="tab"
            aria-selected={active === i}
            className={`sp-course-journey__step${active === i ? ' is-active' : ''}${
              i < active ? ' is-done' : ''
            }`}
            onClick={() => setActive(i)}
          >
            <span className="sp-course-journey__dot">{d.day}</span>
            <span className="sp-course-journey__name">{d.title}</span>
          </button>
        ))}
      </div>

      <div className="sp-course-journey__stage" role="tabpanel">
        <p className="sp-course-journey__day">Day {item.day} of 7</p>
        <h3 className="sp-course-journey__title">{item.title}</h3>
        <p className="sp-course-journey__blurb">{item.blurb}</p>
        <div className="sp-course-journey__actions">
          <a href="#sp-enquire" className="sp-btn sp-btn--primary !min-h-10 !text-sm">
            <Sparkles className="w-4 h-4" />
            Register your interest
          </a>
          <a
            href="https://courses.brahmakumaris.com/a-personal-journey-for-transformation"
            target="_blank"
            rel="noopener noreferrer"
            className="sp-btn sp-btn--ghost !min-h-10 !text-sm"
          >
            <BookOpen className="w-4 h-4" />
            Online intro
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <Link href="/sonipat-retreat-center#courses" className="sp-course-journey__more">
          All campus courses <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
