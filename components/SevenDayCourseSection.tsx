'use client';

import React, { useState } from 'react';
import { BookOpen, Clock, Users, Sparkles, ChevronRight, Calendar, Sun, Circle, Hexagon, Triangle, Diamond, Octagon, Pentagon, Square } from 'lucide-react';

interface SevenDayCourseSectionProps {
  centerName: string;
  contact?: string;
  mobile?: string;
}

const courseDays = [
  {
    day: 1,
    title: 'Soul Consciousness',
    subtitle: 'Who Am I?',
    description: 'Discover your true identity as a soul — a point of conscious light. Understand the difference between the body and the soul.',
    icon: Circle,
    color: 'from-spirit-purple-500 to-spirit-blue-500',
    bgLight: 'bg-spirit-purple-50',
    borderColor: 'border-spirit-purple-200',
  },
  {
    day: 2,
    title: 'Supreme Soul',
    subtitle: 'God — The Supreme Father',
    description: 'Learn about the Supreme Soul — His form, His qualities, and how to connect with Him through Rajyoga meditation.',
    icon: Hexagon,
    color: 'from-spirit-gold-400 to-spirit-gold-600',
    bgLight: 'bg-spirit-gold-50',
    borderColor: 'border-spirit-gold-200',
  },
  {
    day: 3,
    title: 'Law of Karma',
    subtitle: 'Action & Reaction',
    description: 'Understand how every thought, word, and action creates an account. Learn to create positive karma and settle past accounts.',
    icon: Triangle,
    color: 'from-orange-400 to-red-500',
    bgLight: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    day: 4,
    title: 'Cycle of Time',
    subtitle: 'The World Drama',
    description: 'Discover the eternal cycle of four ages — Golden, Silver, Copper, and Iron — and where we stand today in the world drama.',
    icon: Diamond,
    color: 'from-spirit-blue-400 to-spirit-blue-600',
    bgLight: 'bg-spirit-blue-50',
    borderColor: 'border-spirit-blue-200',
  },
  {
    day: 5,
    title: 'Tree of Humanity',
    subtitle: 'The Spiritual Family',
    description: 'See how all souls are connected like branches of one great tree, with the Supreme Soul as the Seed. Understand the variety of religions and paths.',
    icon: Pentagon,
    color: 'from-green-400 to-emerald-600',
    bgLight: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    day: 6,
    title: 'Rajyoga Meditation',
    subtitle: 'Connecting with God',
    description: 'Practice the art of Rajyoga — a simple, powerful meditation that connects you directly with the Supreme Source of peace, love, and power.',
    icon: Octagon,
    color: 'from-spirit-purple-400 to-spirit-rose-500',
    bgLight: 'bg-spirit-rose-50',
    borderColor: 'border-spirit-rose-200',
  },
  {
    day: 7,
    title: 'Living with Values',
    subtitle: 'A New Way of Life',
    description: 'Learn to live with divine qualities in your daily life — purity, peace, love, happiness, and power. Begin your spiritual journey with confidence.',
    icon: Square,
    color: 'from-spirit-rose-400 to-spirit-purple-500',
    bgLight: 'bg-spirit-purple-50',
    borderColor: 'border-spirit-purple-200',
  },
];

export default function SevenDayCourseSection({ centerName, contact, mobile }: SevenDayCourseSectionProps) {
  const [activeDay, setActiveDay] = useState(0);
  const activeItem = courseDays[activeDay];
  const ActiveIcon = activeItem.icon;

  return (
    <section id="seven-day-course" className="scroll-mt-20">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-spirit-purple-50 dark:bg-spirit-purple-900/20 text-spirit-purple-700 dark:text-spirit-purple-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <BookOpen className="w-4 h-4" />
          <span>Free Foundation Course</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          7-Day Rajyoga Meditation Course
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto text-lg">
          Begin your spiritual journey with our complimentary introductory course.
          Walk in any day, no registration needed.
        </p>
      </div>

      {/* Key Benefits Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { icon: Calendar, label: 'Monday to Sunday', sub: 'Start any day' },
          { icon: Clock, label: 'Morning & Evening', sub: 'Flexible timings' },
          { icon: Sparkles, label: '100% Free', sub: 'No fees ever' },
          { icon: Users, label: 'Open to All', sub: 'No experience needed' },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 text-center hover:shadow-md hover:border-spirit-purple-200 dark:hover:border-spirit-purple-700 transition-all duration-300 group">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-spirit-purple-100 to-spirit-blue-100 dark:from-spirit-purple-900/30 dark:to-spirit-blue-900/30 flex items-center justify-center group-hover:from-spirit-purple-200 group-hover:to-spirit-blue-200 transition-colors">
              <item.icon className="w-5 h-5 text-spirit-purple-600 dark:text-spirit-purple-400" />
            </div>
            <p className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">{item.label}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Course Day Timeline + Detail */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        {/* Day Selector - Horizontal scroll on mobile */}
        <div className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50">
          <div className="flex overflow-x-auto scrollbar-hide">
            {courseDays.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveDay(idx)}
                  className={`flex-shrink-0 flex flex-col items-center px-4 md:px-6 py-4 transition-all duration-200 relative min-w-[80px] md:min-w-[100px] ${
                    activeDay === idx
                      ? 'bg-white dark:bg-neutral-800 text-spirit-purple-700 dark:text-spirit-purple-400'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white/60 dark:hover:bg-neutral-700/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all ${
                    activeDay === idx
                      ? `bg-gradient-to-br ${item.color} text-white shadow-md`
                      : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-300'
                  }`}>
                    <span className="text-xs font-bold">{item.day}</span>
                  </div>
                  <span className={`text-[11px] font-medium text-center leading-tight ${
                    activeDay === idx ? 'text-spirit-purple-700 dark:text-spirit-purple-400' : 'text-neutral-500 dark:text-neutral-400'
                  }`}>
                    {item.title.split(' ')[0]}
                  </span>
                  {activeDay === idx && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-spirit-purple-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Day Detail */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Icon + Day Number */}
            <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${activeItem.color} flex items-center justify-center shadow-lg`}>
              <ActiveIcon className="w-8 h-8 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r ${activeItem.color} text-white`}>
                  Day {activeItem.day}
                </span>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{activeItem.subtitle}</span>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">{activeItem.title}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-base">{activeItem.description}</p>
            </div>
          </div>
        </div>

        {/* Bottom Info Strip */}
        <div className="border-t border-neutral-100 dark:border-neutral-700 bg-gradient-to-r from-spirit-purple-50/50 via-spirit-blue-50/50 to-spirit-gold-50/50 dark:from-spirit-purple-900/10 dark:via-spirit-blue-900/10 dark:to-spirit-gold-900/10 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">Walk in anytime</span> — Classes run daily at {centerName}. No registration required.
            </p>
            <div className="flex items-center gap-1.5 text-sm text-spirit-purple-600 dark:text-spirit-purple-400 font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Everything is offered free of charge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Single CTA Section — shown once below the course card */}
      <div className="mt-8 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Ready to Begin?</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-xl mx-auto">
              The best way to experience Rajyoga is to visit your nearest center and learn in person from experienced teachers. For a quick introduction, explore our online courses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {(contact || mobile) && (
              <a
                href={`tel:${(mobile || contact || '').split(',')[0].trim().replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-spirit-purple-600 to-spirit-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              >
                <Sun className="w-4 h-4" />
                Visit Center &amp; Start Learning
              </a>
            )}
          </div>

          {/* Online Course Links */}
          <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-700">
            <p className="text-xs text-center text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold mb-3">Quick Introduction Online</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://courses.brahmakumaris.com/a-personal-journey-for-transformation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 px-5 py-2.5 rounded-xl font-medium text-sm hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600 hover:text-spirit-purple-700 dark:hover:text-spirit-purple-400 hover:bg-spirit-purple-50/50 dark:hover:bg-spirit-purple-900/20 transition-all duration-200"
              >
                <BookOpen className="w-4 h-4" />
                Online Course (English)
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://courses.brahmakumaris.com/sahaj-rajyog"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 px-5 py-2.5 rounded-xl font-medium text-sm hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600 hover:text-spirit-purple-700 dark:hover:text-spirit-purple-400 hover:bg-spirit-purple-50/50 dark:hover:bg-spirit-purple-900/20 transition-all duration-200"
              >
                <BookOpen className="w-4 h-4" />
                ऑनलाइन कोर्स (हिन्दी)
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs text-center text-neutral-400 dark:text-neutral-500 mt-3">
              Online courses offer a brief overview. For the full depth of wisdom and experience, we recommend visiting the center in person.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
