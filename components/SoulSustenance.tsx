'use client';

import React from 'react';
import { Send, Globe, ChevronRight, Sparkles } from 'lucide-react';

export default function SoulSustenance() {
  return (
    <section className="scroll-mt-20">
      <div className="relative bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-spirit-purple-50/60 via-white to-spirit-gold-50/40 dark:from-spirit-purple-900/20 dark:via-neutral-800 dark:to-spirit-gold-900/10" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-spirit-gold-100/30 dark:bg-spirit-gold-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="relative px-6 sm:px-10 md:px-14 py-10 sm:py-14">
          <div className="text-center max-w-lg mx-auto">
            {/* Icon */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-spirit-purple-100 to-spirit-gold-100 dark:from-spirit-purple-900/40 dark:to-spirit-gold-900/30 border border-spirit-gold-200/50 dark:border-spirit-gold-800/30">
              <Send className="w-5 h-5 sm:w-6 sm:h-6 text-spirit-purple-600 dark:text-spirit-purple-400" />
            </div>

            {/* Heading */}
            <h2 className="text-xl sm:text-2xl lg:text-[1.7rem] font-bold text-neutral-900 dark:text-neutral-100 mb-3 tracking-tight">
              Nourish Your Soul Daily
            </h2>
            <p className="text-sm sm:text-[15px] text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
              Receive daily spiritual messages, blogs, meditation commentary &amp; soul sustenance to support your spiritual journey — straight to your phone.
            </p>

            {/* Subscribe Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://www.brahmakumaris.com/join-sse"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-spirit-purple-600 to-spirit-blue-600 text-white hover:shadow-lg hover:shadow-spirit-purple-200 dark:hover:shadow-spirit-purple-900/30 hover:scale-[1.02] transition-all duration-300"
              >
                <Globe className="w-4 h-4" />
                Subscribe in English
                <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </a>
              <a
                href="https://www.brahmakumaris.com/join-ssh"
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold border border-spirit-purple-200 dark:border-spirit-purple-700 text-spirit-purple-700 dark:text-spirit-purple-300 bg-white dark:bg-neutral-800 hover:bg-spirit-purple-50 dark:hover:bg-spirit-purple-900/20 hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600 hover:shadow-md transition-all duration-300"
              >
                <Globe className="w-4 h-4" />
                हिन्दी में सब्सक्राइब करें
                <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </a>
            </div>

            {/* Subtle note */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free forever · No spam · Unsubscribe anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
