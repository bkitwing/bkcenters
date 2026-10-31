import type { ComponentType, ReactNode } from 'react';

export type SectionTone = 'white' | 'tint';

interface CenterPageSectionProps {
  /** Anchor id (used by the section menu) */
  id: string;
  /** Small label above the title saying what kind of section this is */
  eyebrow?: string;
  icon?: ComponentType<{ className?: string }>;
  title?: string;
  /** One line on what the section is for */
  intent?: ReactNode;
  /** Optional link/button on the right of the header */
  action?: ReactNode;
  /** Alternating band backgrounds keep sections visually separate */
  tone?: SectionTone;
  /** Hairline above the band (off for the first band, under the section menu) */
  divider?: boolean;
  children: ReactNode;
}

/**
 * A full-width band on the center detail page: one consistent header (label,
 * title, purpose) and background, so each section reads as its own block.
 */
export default function CenterPageSection({
  id,
  eyebrow,
  icon: Icon,
  title,
  intent,
  action,
  tone = 'white',
  divider = true,
  children,
}: CenterPageSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={`scroll-mt-bk ${divider ? 'border-t border-neutral-200/80 dark:border-neutral-800' : ''} ${
        tone === 'tint' ? 'bg-[#FBF7F0] dark:bg-neutral-800/40' : 'bg-white dark:bg-neutral-900'
      }`}
    >
      <div className="container mx-auto px-4 py-10 md:py-14">
        {title && (
          <header className="mb-6 md:mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              {eyebrow && (
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-spirit-purple-700 dark:text-spirit-purple-300">
                  {Icon && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-spirit-purple-100 dark:bg-spirit-purple-900/40" aria-hidden>
                      <Icon className="h-4 w-4" />
                    </span>
                  )}
                  {eyebrow}
                </p>
              )}
              <h2 id={headingId} className="mt-2 text-2xl md:text-3xl font-bold leading-tight text-neutral-900 dark:text-neutral-100">
                {title}
              </h2>
              {intent && (
                <p className="mt-1.5 text-sm md:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">{intent}</p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
