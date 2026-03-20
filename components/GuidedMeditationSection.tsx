import React from 'react';
import { Headphones, Globe, Smartphone, ArrowRight } from 'lucide-react';

const GuidedMeditationSection: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-spirit-purple-50 via-spirit-gold-50/30 to-spirit-purple-50 dark:from-neutral-800/80 dark:via-neutral-800/60 dark:to-neutral-800/80 rounded-2xl border border-spirit-gold-200/60 dark:border-neutral-700 overflow-hidden">
      {/* Header */}
      <div className="relative px-6 pt-6 pb-4 md:px-8 md:pt-8 md:pb-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-spirit-purple-600 to-spirit-purple-700 dark:from-spirit-purple-500 dark:to-spirit-purple-700 flex items-center justify-center shadow-lg shadow-spirit-purple-600/20">
            <Headphones className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
              Guided Meditation
            </h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Practice guided Rajyoga meditation commentaries by experienced Brahma Kumaris teachers — based on your age, mood, and life situations.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 md:px-8 pb-2">
        <div className="flex flex-wrap gap-2">
          {['Inner Peace', 'Stress Relief', 'Self Awareness', 'Positive Thinking', 'Sleep', 'Focus'].map((tag) => (
            <span
              key={tag}
              className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-white/70 dark:bg-neutral-700/60 text-spirit-purple-700 dark:text-spirit-gold-400 border border-spirit-gold-200/50 dark:border-neutral-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* CTA Cards */}
      <div className="px-6 md:px-8 py-5 md:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Web Portal */}
          <a
            href="https://www.brahmakumaris.com/meditation"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-spirit-purple-100 dark:bg-spirit-purple-900/30 flex items-center justify-center group-hover:bg-spirit-purple-200 dark:group-hover:bg-spirit-purple-900/50 transition-colors">
              <Globe className="w-5 h-5 text-spirit-purple-600 dark:text-spirit-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">Listen Online</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">brahmakumaris.com</p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-spirit-purple-500 transition-colors flex-shrink-0" />
          </a>

          {/* Android App */}
          <a
            href="https://play.google.com/store/apps/details?id=com.official.brahmakumaris"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-spirit-gold-300 dark:hover:border-spirit-gold-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-spirit-gold-100 dark:bg-spirit-gold-900/30 flex items-center justify-center group-hover:bg-spirit-gold-200 dark:group-hover:bg-spirit-gold-900/50 transition-colors">
              <Smartphone className="w-5 h-5 text-spirit-gold-600 dark:text-spirit-gold-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">Android App</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Google Play</p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-spirit-gold-500 transition-colors flex-shrink-0" />
          </a>

          {/* iOS App */}
          <a
            href="https://apps.apple.com/us/app/time-for-meditation/id6759336524"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600 hover:shadow-md transition-all duration-200"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-spirit-purple-100 dark:bg-spirit-purple-900/30 flex items-center justify-center group-hover:bg-spirit-purple-200 dark:group-hover:bg-spirit-purple-900/50 transition-colors">
              <svg className="w-5 h-5 text-spirit-purple-600 dark:text-spirit-purple-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">iOS App</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">App Store</p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-spirit-purple-500 transition-colors flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Bottom note */}
      <div className="px-6 md:px-8 pb-5 md:pb-6">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center leading-relaxed">
          Free guided meditation audio in Hindi &amp; English — curated for all ages and life situations
        </p>
      </div>
    </div>
  );
};

export default GuidedMeditationSection;
