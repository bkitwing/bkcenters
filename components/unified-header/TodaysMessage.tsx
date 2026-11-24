"use client";

/*
 * "Today's message" card for the Wisdom menu (desktop mega menu and the phone
 * menu). Reads /wisdom/api/today once per visit, only when a menu first opens,
 * so page loads are unaffected. Keep this file identical across the apps that
 * use the shared header.
 */

import { useEffect, useState, type ComponentType } from "react";
import { ArrowRight, Sun } from "lucide-react";
import type { MenuLinkProps } from "./SectionMenus";

type Lang = "eng" | "hin";
type TodayItem = { title: string; href: string; date: string; image: string | null };
type Today = Partial<Record<Lang, TodayItem | null>>;

/** Full URL so the courses subdomain reads it from www too. */
const TODAY_API = "https://www.brahmakumaris.com/wisdom/api/today";
const ALL_MESSAGES_HREF = "/wisdom/soul-sustenance";
const LANG_KEY = "bk-today-lang";

const LABELS: Record<Lang, { eyebrow: string; read: string }> = {
  eng: { eyebrow: "Today's message", read: "Read" },
  hin: { eyebrow: "आज का संदेश", read: "पढ़ें" },
};

// One request per visit, shared by every card on the page
let request: Promise<Today | null> | null = null;

async function firstJson(urls: string[]): Promise<Today | null> {
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (r.ok) return (await r.json()) as Today;
    } catch {
      /* try the next one */
    }
  }
  return null;
}

function loadToday(): Promise<Today | null> {
  // Local development: this app's own endpoint (wisdom), else a wisdom dev server on :3000
  const local = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  const urls = local ? ["/wisdom/api/today", "http://localhost:3000/wisdom/api/today"] : [TODAY_API];
  request ??= firstJson(urls);
  return request;
}

/** Page language first (Hindi pages open Hindi), then the reader's last choice, then English. */
function initialLang(): Lang {
  if (/\/hin(\/|$)/.test(window.location.pathname)) return "hin";
  if (/\/eng(\/|$)/.test(window.location.pathname)) return "eng";
  try {
    return localStorage.getItem(LANG_KEY) === "hin" ? "hin" : "eng";
  } catch {
    return "eng";
  }
}

function formatDate(date: string, lang: Lang): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const d = new Date(`${date}T00:00:00Z`);
  return lang === "hin"
    ? d.toLocaleDateString("hi-IN", { day: "numeric", month: "long", timeZone: "UTC" })
    : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  const option = (value: Lang, text: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={lang === value}
      onClick={() => onChange(value)}
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors ${
        lang === value
          ? "bg-white text-amber-800 shadow-sm ring-1 ring-amber-900/10 dark:bg-neutral-700 dark:text-amber-200 dark:ring-white/10"
          : "text-amber-800/70 hover:text-amber-900 dark:text-amber-200/70 dark:hover:text-amber-100"
      }`}
    >
      {text}
    </button>
  );
  return (
    <div role="radiogroup" aria-label="Language" className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-900/[0.06] p-0.5 dark:bg-white/[0.06]">
      {option("eng", "EN")}
      {option("hin", "हिं")}
    </div>
  );
}

export function TodaysMessageCard({
  Link,
  onNavigate,
  compact = false,
}: {
  /** The app's own link (same app: Next navigation; other apps: full link). */
  Link: ComponentType<MenuLinkProps>;
  onNavigate?: () => void;
  /** Phone menu: smaller thumbnail, title on two lines. */
  compact?: boolean;
}) {
  const [data, setData] = useState<Today | null | undefined>(undefined);
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    let live = true;
    loadToday().then((d) => {
      if (live) setData(d);
    });
    return () => {
      live = false;
    };
  }, []);

  const choose = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* private mode: choice lasts for this visit */
    }
  };

  const item = data ? (data[lang] ?? data[lang === "eng" ? "hin" : "eng"] ?? null) : null;
  const shell =
    "flex items-center gap-3 rounded-xl bg-amber-50/80 ring-1 ring-amber-500/15 dark:bg-amber-400/[0.07] dark:ring-amber-300/15";
  const thumbSize = compact ? "h-[45px] w-20" : "h-[54px] w-24";

  // Loading: same size as the card, so the menu never jumps
  if (data === undefined) {
    return (
      <div className={`${shell} ${compact ? "p-2.5" : "px-3 py-2.5"}`} aria-hidden="true">
        <div className={`${thumbSize} shrink-0 animate-pulse rounded-lg bg-amber-200/40 dark:bg-white/10`} />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 w-32 animate-pulse rounded bg-amber-200/50 dark:bg-white/10" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-amber-200/50 dark:bg-white/10" />
        </div>
      </div>
    );
  }

  // Unavailable: a plain, useful link rather than an empty box
  if (!item) {
    return (
      <Link
        href={ALL_MESSAGES_HREF}
        onClick={onNavigate}
        className={`${shell} group px-3 py-2.5 text-[13px] font-medium text-amber-900 dark:text-amber-100`}
      >
        <Sun className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
        <span>Today&apos;s message · a thought to carry through your day</span>
        <ArrowRight className="ml-auto h-4 w-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    );
  }

  const label = LABELS[lang];
  const date = formatDate(item.date, lang);
  const eyebrow = (
    <span
      className={`flex min-w-0 items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 ${
        lang === "hin" ? "" : "uppercase tracking-wider"
      }`}
    >
      <Sun className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="shrink-0">{label.eyebrow}</span>
      {date && (
        <span className="truncate font-medium normal-case tracking-normal text-amber-700/70 dark:text-amber-300/70">· {date}</span>
      )}
    </span>
  );
  const thumb = item.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.image}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${thumbSize} shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10`}
    />
  ) : (
    <span className={`${thumbSize} flex shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-white/10`}>
      <Sun className="h-5 w-5 text-amber-600 dark:text-amber-300" aria-hidden="true" />
    </span>
  );

  // Phone menu: label and language on top, then picture and a two-line title
  if (compact) {
    return (
      <div className={`${shell} flex-col !items-stretch !gap-2 p-2.5`} lang={lang === "hin" ? "hi" : "en"}>
        <div className="flex items-center justify-between gap-2">
          {eyebrow}
          <LangSwitch lang={lang} onChange={choose} />
        </div>
        <Link href={item.href} onClick={onNavigate} className="group flex items-center gap-3">
          {thumb}
          <span className="line-clamp-2 min-w-0 flex-1 text-[14px] font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            {item.title}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-amber-700/70 dark:text-amber-300/70" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  // Desktop menu: one slim row
  return (
    <div className={`${shell} px-3 py-2.5`} lang={lang === "hin" ? "hi" : "en"}>
      <Link href={item.href} onClick={onNavigate} className="group flex min-w-0 flex-1 items-center gap-3">
        {thumb}
        <span className="min-w-0 flex-1">
          {eyebrow}
          <span className="mt-0.5 block truncate text-[14px] font-semibold leading-snug text-neutral-900 group-hover:underline dark:text-neutral-100">
            {item.title}
          </span>
        </span>
        <span className="ml-1 flex shrink-0 items-center gap-1 text-[12px] font-semibold text-amber-800 dark:text-amber-200">
          {label.read}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </Link>
      <LangSwitch lang={lang} onChange={choose} />
    </div>
  );
}
