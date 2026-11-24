"use client";

/*
 * Desktop dropdowns for the shared brahmakumaris.com pill header.
 * Every site renders every section the same way from the shared NAVIGATION:
 *   - sections with sub-links (Wisdom, Meditation) open a wide mega menu,
 *     centred under the header pill;
 *   - all other sections open a grouped list under their button.
 * Keep this file identical across the apps that use the header. Each app
 * passes its own `Link`, which opens pages of the same app with Next
 * navigation and pages of other apps as full links.
 */

import type { ComponentType, ReactNode } from "react";
import { Bookmark, ExternalLink, MapPin } from "lucide-react";
import { ACCENT_COLORS, type NavSection, type NavSubItem } from "./navigation-config";
import { LiveDot, LiveSessionPill, SS_LIVE_HREF } from "./LiveSession";
import { TodaysMessageCard } from "./TodaysMessage";

export type MenuLinkProps = { href: string; onClick?: () => void; className?: string; children: ReactNode };

export type SectionMenuProps = {
  section: NavSection;
  onClose: () => void;
  /** The app's own link component (same app: Next navigation; other apps: full link). */
  Link: ComponentType<MenuLinkProps>;
  /** True when `href` is the page being viewed (the app decides, as only it knows its routes). */
  isActive?: (href: string) => boolean;
  /** Grouped menus: which edge of the nav button the panel lines up with. */
  align?: "left" | "right";
  /** Centers app: run "Nearby" in place (location search) instead of navigating. */
  onNearby?: () => void;
};

const FALLBACK_COLORS = {
  bg: "bg-violet-600",
  text: "text-violet-600 dark:text-violet-400",
  border: "border-violet-500",
  bgSubtle: "bg-violet-50 dark:bg-violet-950/40",
};

const HERO_GRADIENTS: Record<string, string> = {
  sky: "from-sky-500/10 via-sky-500/8 to-cyan-500/5 dark:from-sky-500/20 dark:via-sky-500/15 dark:to-cyan-500/10",
  emerald: "from-emerald-500/10 via-emerald-500/8 to-teal-500/5 dark:from-emerald-500/20 dark:via-emerald-500/15 dark:to-teal-500/10",
  rose: "from-rose-500/10 via-rose-500/8 to-pink-500/5 dark:from-rose-500/20 dark:via-rose-500/15 dark:to-pink-500/10",
  amber: "from-amber-500/10 via-amber-500/8 to-orange-500/5 dark:from-amber-500/20 dark:via-amber-500/15 dark:to-orange-500/10",
  indigo: "from-indigo-500/10 via-indigo-500/8 to-blue-500/5 dark:from-indigo-500/20 dark:via-indigo-500/15 dark:to-blue-500/10",
  violet: "from-violet-500/10 via-purple-500/8 to-fuchsia-500/5 dark:from-violet-500/20 dark:via-purple-500/15 dark:to-fuchsia-500/10",
  slate: "from-slate-500/10 via-slate-500/8 to-gray-500/5 dark:from-slate-500/20 dark:via-slate-500/15 dark:to-gray-500/10",
};

/** Short line under each mega-menu column heading. */
const COLUMN_TAGLINES: Record<string, string> = {
  "Soul Sustenance": "A thought to carry through your day",
  Blogs: "Stories that shift perspective",
  Audio: "Listen, absorb, transform",
  Galleries: "Visual moments of stillness",
  Testimonials: "Real journeys, real change",
  "Movies & Documentaries": "Films that inspire reflection",
  Anubhavgatha: "Experiences from the heart",
  Explore: "Find the right meditation",
  "How you want to feel": "Choose a feeling to experience",
  "By life stage": "Meditations for every age",
  "Meditation music": "Tracks for focus and calm",
};

/** Line shown in a featured band (e.g. Activities, Meditation for). */
const FEATURED_TAGLINES: Record<string, string> = {
  Activities: "Play, reflect & grow: spiritual games and self-checks",
  "Meditation for": "Guided meditations for what you are going through",
};

/** Links to other organisations open in a new tab; brahmakumaris.com sites do not. */
const isOffsite = (href: string) =>
  /^https?:\/\//.test(href) && !/^https?:\/\/([a-z0-9-]+\.)*brahmakumaris\.com(\/|$)/.test(href);

/** Sections with sub-links get the wide mega menu (anchored to the header pill, not the button). */
export function isMegaSection(section: NavSection): boolean {
  return section.subItems.some((item) => (item.children?.length ?? 0) > 0);
}

export function SectionMenu(props: SectionMenuProps) {
  return isMegaSection(props.section) ? <MegaMenu {...props} /> : <GroupedMenu {...props} />;
}

function Hero({ section, onClose, Link, compact = false }: SectionMenuProps & { compact?: boolean }) {
  const colors = ACCENT_COLORS[section.accentColor] ?? FALLBACK_COLORS;
  const Icon = section.icon;
  const hasLive = section.subItems.some((i) => i.live);
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br ${
        HERO_GRADIENTS[section.accentColor] ?? HERO_GRADIENTS.slate
      } ${compact ? "px-4 py-3.5" : "px-5 py-3"}`}
    >
      <div className="absolute right-0 top-0 h-28 w-28 -translate-y-12 translate-x-12 rounded-full bg-white/20 dark:bg-white/5" />
      <div className="relative z-10 flex items-center gap-3">
        <Link href={section.href} onClick={onClose} className="group flex min-w-0 items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bgSubtle}`}>
            <Icon className={`h-4 w-4 ${colors.text}`} />
          </span>
          <span className={compact ? "min-w-0" : "flex min-w-0 items-baseline gap-2"}>
            <span className={`block text-[14px] font-bold ${colors.text} group-hover:underline`}>{section.label}</span>
            <span className={`block text-[11.5px] font-medium leading-snug text-neutral-500 dark:text-neutral-400 ${compact ? "" : "truncate"}`}>
              {section.description}
            </span>
          </span>
        </Link>
        {hasLive && !compact && (
          <Link href={SS_LIVE_HREF} onClick={onClose} className="ml-auto shrink-0">
            <LiveSessionPill />
          </Link>
        )}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  onClose,
  Link,
  isActive,
  onNearby,
  colors,
}: Omit<SectionMenuProps, "section"> & { item: NavSubItem; colors: typeof FALLBACK_COLORS }) {
  const ItemIcon = item.icon;
  const active = isActive?.(item.href) ?? false;
  const cls = `flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
    active
      ? `${colors.bgSubtle} ${colors.text} font-semibold`
      : "text-neutral-600 hover:translate-x-0.5 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
  }`;
  const content = (
    <>
      <ItemIcon className="h-4 w-4 shrink-0 opacity-60" />
      <span className="min-w-0 text-left">{item.label}</span>
      {item.live && <LiveDot className="ml-auto" />}
    </>
  );
  if (onNearby && item.href.includes("nearby=true")) {
    return (
      <button type="button" onClick={() => { onClose(); onNearby(); }} className={`${cls} ${colors.text} font-medium`}>
        {content}
        <MapPin className="ml-auto h-3.5 w-3.5 opacity-50" />
      </button>
    );
  }
  if (isOffsite(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={cls}>
        {content}
        <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-40" />
      </a>
    );
  }
  return (
    <Link href={item.href} onClick={onClose} className={cls}>
      {content}
    </Link>
  );
}

/** Grouped list under the nav button (Centers, News & Events, About, Initiatives, …). */
function GroupedMenu(props: SectionMenuProps) {
  const { section, align = "left" } = props;
  const colors = ACCENT_COLORS[section.accentColor] ?? FALLBACK_COLORS;
  return (
    <div
      className={`absolute top-full z-50 mt-1.5 w-[300px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-neutral-200/50 bg-white shadow-2xl shadow-black/8 animate-in fade-in-0 zoom-in-[0.98] slide-in-from-top-1 duration-150 dark:border-neutral-700/50 dark:bg-neutral-900 dark:shadow-black/30 ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      <Hero {...props} compact />
      <div className="max-h-[calc(100dvh-var(--bk-header-h,4.75rem)-9rem)] overflow-y-auto overscroll-contain p-1.5">
        {section.subItems.map((item, index) => {
          const prevGroup = index > 0 ? section.subItems[index - 1]?.group : undefined;
          const showGroup = Boolean(item.group && item.group !== prevGroup);
          return (
            <div key={item.id ?? item.href}>
              {showGroup && (
                <div className={`mx-2 mb-1 pt-2 ${index === 0 ? "" : "mt-1.5 border-t border-neutral-100 dark:border-neutral-800"}`}>
                  <span className="px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500">
                    {item.group}
                  </span>
                </div>
              )}
              <ItemRow {...props} item={item} colors={colors} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Wide menu with columns, a featured band and a footer (Wisdom, Meditation). */
function MegaMenu(props: SectionMenuProps) {
  const { section, onClose, Link, isActive } = props;
  const colors = ACCENT_COLORS[section.accentColor] ?? FALLBACK_COLORS;
  const columns = section.subItems.filter((s) => (s.children?.length ?? 0) > 0 && !s.featured);
  const featured = section.subItems.find((s) => s.featured);
  // LIVE has its own pill in the hero row, so it is not repeated in the footer
  const flatItems = section.subItems.filter((s) => !(s.children?.length) && !s.featured && !s.live);
  const showSaved = section.id === "wisdom";
  const FeaturedIcon = featured?.icon;

  return (
    <div className="absolute left-1/2 top-full z-50 mt-2 flex max-h-[calc(100dvh-var(--bk-header-h,4.75rem)-1.5rem)] w-[min(880px,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-neutral-200/50 bg-white shadow-2xl shadow-black/10 animate-in fade-in-0 zoom-in-[0.98] slide-in-from-top-1 duration-150 dark:border-neutral-700/50 dark:bg-neutral-900 dark:shadow-black/40">
      <Hero {...props} />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {/* Wisdom: today's Soul Sustenance first, as it is the one thing that changes daily */}
        {section.id === "wisdom" && (
          <div className="px-3 pt-3">
            <TodaysMessageCard Link={Link} onNavigate={onClose} />
          </div>
        )}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-x-1 px-2 py-1">
          {columns.map((sub) => {
            const SubIcon = sub.icon;
            const tagline = COLUMN_TAGLINES[sub.label] ?? "";
            return (
              <div key={sub.href + sub.label} className="px-2 py-1.5">
                <Link
                  href={sub.href}
                  onClick={onClose}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 text-[11.5px] font-bold uppercase tracking-wider ${colors.text}`}
                >
                  <SubIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{sub.label}</span>
                </Link>
                {tagline && (
                  <p className="mb-1 px-2 text-[11px] font-medium leading-snug text-neutral-400 dark:text-neutral-500">{tagline}</p>
                )}
                <div>
                  {sub.children?.map((child) => {
                    const ChildIcon = child.icon;
                    const active = isActive?.(child.href) ?? false;
                    return (
                      <Link
                        key={child.href + child.label}
                        href={child.href}
                        onClick={onClose}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1 text-[13px] leading-snug transition-all duration-150 ${
                          active
                            ? `${colors.bgSubtle} ${colors.text} font-semibold`
                            : "text-neutral-600 hover:translate-x-0.5 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                        }`}
                      >
                        <ChildIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        <span>{child.label}</span>
                        {child.live && <LiveDot className="ml-1" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {featured && FeaturedIcon && (
          <div className="mx-3 mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-gradient-to-r from-cyan-500/12 via-sky-500/8 to-emerald-500/10 px-4 py-3 ring-1 ring-cyan-500/15 dark:from-cyan-500/20 dark:via-sky-500/12 dark:to-emerald-500/15 dark:ring-cyan-400/15">
            <Link href={featured.href} onClick={onClose} className="group flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm dark:bg-neutral-800 dark:text-cyan-300">
                <FeaturedIcon className="h-4.5 w-4.5" />
              </span>
              <span>
                <span className="block text-[14px] font-bold text-neutral-900 group-hover:underline dark:text-neutral-100">{featured.label}</span>
                {FEATURED_TAGLINES[featured.label] && (
                  <span className="block text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                    {FEATURED_TAGLINES[featured.label]}
                  </span>
                )}
              </span>
            </Link>
            <div className="flex flex-wrap gap-1.5 sm:ml-auto">
              {featured.children?.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <Link
                    key={child.href + child.label}
                    href={child.href}
                    onClick={onClose}
                    className="flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[12px] font-medium text-neutral-700 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white hover:text-cyan-700 dark:bg-neutral-800/80 dark:text-neutral-200 dark:ring-white/10 dark:hover:text-cyan-300"
                  >
                    <ChildIcon className="h-3.5 w-3.5 opacity-70" />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {(flatItems.length > 0 || showSaved) && (
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-t border-neutral-100 bg-neutral-50/50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-800/30">
          {flatItems.map((item) => {
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition-all duration-150 hover:bg-white hover:text-neutral-900 hover:shadow-sm dark:text-neutral-400 dark:hover:bg-neutral-700/50 dark:hover:text-neutral-100"
              >
                <ItemIcon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {showSaved && (
            <Link
              href="/wisdom/saved"
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition-all duration-150 hover:bg-white hover:text-rose-600 hover:shadow-sm dark:text-neutral-400 dark:hover:bg-neutral-700/50 dark:hover:text-rose-400"
            >
              <Bookmark className="h-4 w-4" />
              Saved
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
