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
export function JbCourseStory() {
  const [active, setActive] = useState(0);
  const item = DAYS[active];

  return (
    <div className="jb-course-journey">
      <div className="jb-course-journey__rail" role="tablist" aria-label="Course days">
        {DAYS.map((d, i) => (
          <button
            key={d.day}
            type="button"
            role="tab"
            aria-selected={active === i}
            className={`jb-course-journey__step${active === i ? ' is-active' : ''}${
              i < active ? ' is-done' : ''
            }`}
            onClick={() => setActive(i)}
          >
            <span className="jb-course-journey__dot">{d.day}</span>
            <span className="jb-course-journey__name">{d.title}</span>
          </button>
        ))}
      </div>

      <div className="jb-course-journey__stage" role="tabpanel">
        <p className="jb-course-journey__day">Day {item.day} of 7</p>
        <h3 className="jb-course-journey__title">{item.title}</h3>
        <p className="jb-course-journey__blurb">{item.blurb}</p>
        <div className="jb-course-journey__actions">
          <a href="#jb-enquire" className="jb-btn jb-btn--primary !min-h-10 !text-sm">
            <Sparkles className="w-4 h-4" />
            Register your interest
          </a>
          <a
            href="https://courses.brahmakumaris.com/a-personal-journey-for-transformation"
            target="_blank"
            rel="noopener noreferrer"
            className="jb-btn jb-btn--ghost !min-h-10 !text-sm"
          >
            <BookOpen className="w-4 h-4" />
            Online intro
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <Link href="/jagdamba-bhawan#courses" className="jb-course-journey__more">
          All campus courses <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
