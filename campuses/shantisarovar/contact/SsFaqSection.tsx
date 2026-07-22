'use client';

import FAQSection from '@/components/FAQSection';
import type { Center } from '@/lib/types';

/** FAQs already covered by Arrive / Learn sections on the campus contact page. */
const SKIP = [
  /^How to Visit Meditation Center/i,
  /^What is the Brahma Kumaris/i,
  /^In which languages/i,
  /^If I visit the center/i,
  /^Is the Brahma Kumaris only for women/i,
];

type SsFaqSectionProps = {
  center: Center;
  initialVisible?: number;
};

/** Campus contact FAQ — filters + styles via `.ss-faq-wrap`; keeps portal FAQ generic. */
export function SsFaqSection({ center, initialVisible = 5 }: SsFaqSectionProps) {
  return (
    <div className="ss-faq-wrap">
      <FAQSection
        center={center}
        omitTimings
        initialVisible={initialVisible}
        excludeQuestion={(q) => SKIP.some((re) => re.test(q))}
        startCollapsed
      />
    </div>
  );
}
