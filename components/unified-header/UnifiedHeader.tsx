"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sparkles,
  MapPin,
  Search,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  NAVIGATION,
  BK_LOGO_URL,
  ACCENT_COLORS,
  type AppId,
  type NavSection,
} from "./navigation-config";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CURRENT_APP: AppId = "centers";
const BASE_PATH = "/centers";
const HOVER_DELAY_IN = 80;
const HOVER_DELAY_OUT = 200;

// ---------------------------------------------------------------------------
// Mobile section metadata — curiosity-driven taglines
// ---------------------------------------------------------------------------
const CENTERS_SECTION_META: Record<string, { tagline: string; gradient: string }> = {
  "Search": {
    tagline: "Find your nearest meditation center",
    gradient: "from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:to-teal-500/10",
  },
  "Nearby": {
    tagline: "Centers around your current location",
    gradient: "from-cyan-500/10 to-sky-500/5 dark:from-cyan-500/20 dark:to-sky-500/10",
  },
  "All States": {
    tagline: "Browse centers across India",
    gradient: "from-blue-500/10 to-indigo-500/5 dark:from-blue-500/20 dark:to-indigo-500/10",
  },
  "HQ Campuses": {
    tagline: "Visit our retreat & headquarters",
    gradient: "from-violet-500/10 to-purple-500/5 dark:from-violet-500/20 dark:to-purple-500/10",
  },
};

const OTHER_APP_META: Record<string, { hook: string; gradient: string }> = {
  meditation: {
    hook: "Begin your inner journey",
    gradient: "from-sky-500/10 to-cyan-500/5 dark:from-sky-500/20 dark:to-cyan-500/10",
  },
  courses: {
    hook: "Structured path to self-mastery",
    gradient: "from-indigo-500/10 to-blue-500/5 dark:from-indigo-500/20 dark:to-blue-500/10",
  },
  wisdom: {
    hook: "Daily messages & spiritual insights",
    gradient: "from-violet-500/10 to-purple-500/5 dark:from-violet-500/20 dark:to-purple-500/10",
  },
  events: {
    hook: "Upcoming Retreat, Conferences, Talks",
    gradient: "from-rose-500/10 to-pink-500/5 dark:from-rose-500/20 dark:to-pink-500/10",
  },
  news: {
    hook: "How Services are done in Society",
    gradient: "from-amber-500/10 to-yellow-500/5 dark:from-amber-500/20 dark:to-yellow-500/10",
  },
  aboutus: {
    hook: "Its All about us",
    gradient: "from-slate-500/10 to-gray-500/5 dark:from-slate-500/20 dark:to-gray-500/10",
  },
};

// ---------------------------------------------------------------------------
// Desktop: Gradient color map for SimpleDropdown hero headers
// ---------------------------------------------------------------------------
const SIMPLE_DROPDOWN_GRADIENTS: Record<string, string> = {
  sky: "from-sky-500/10 via-sky-500/8 to-cyan-500/5 dark:from-sky-500/20 dark:via-sky-500/15 dark:to-cyan-500/10",
  emerald: "from-emerald-500/10 via-emerald-500/8 to-teal-500/5 dark:from-emerald-500/20 dark:via-emerald-500/15 dark:to-teal-500/10",
  rose: "from-rose-500/10 via-rose-500/8 to-pink-500/5 dark:from-rose-500/20 dark:via-rose-500/15 dark:to-pink-500/10",
  amber: "from-amber-500/10 via-amber-500/8 to-orange-500/5 dark:from-amber-500/20 dark:via-amber-500/15 dark:to-orange-500/10",
  indigo: "from-indigo-500/10 via-indigo-500/8 to-blue-500/5 dark:from-indigo-500/20 dark:via-indigo-500/15 dark:to-blue-500/10",
  slate: "from-slate-500/10 via-slate-500/8 to-gray-500/5 dark:from-slate-500/20 dark:via-slate-500/15 dark:to-gray-500/10",
  violet: "from-violet-500/10 via-violet-500/8 to-purple-500/5 dark:from-violet-500/20 dark:via-violet-500/15 dark:to-purple-500/10",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getAppFromHref(href: string): AppId | null {
  if (href.startsWith("/meditation")) return "meditation";
  if (href.startsWith("/centers")) return "centers";
  if (href.startsWith("/wisdom")) return "wisdom";
  if (href.startsWith("/events")) return "events";
  if (href.startsWith("/news")) return "news";
  if (href.startsWith("/about-us") || href.startsWith("/journey") || href.startsWith("/founder-and-instruments") || href.startsWith("/current-leaders") || href.startsWith("/contributions")) return "aboutus";
  return null;
}

function toInternalHref(href: string): string {
  if (href.startsWith(BASE_PATH)) {
    const stripped = href.slice(BASE_PATH.length);
    return stripped || "/";
  }
  return href;
}

// ---------------------------------------------------------------------------
// SmartLink — uses Next Link for same-app, <a> for cross-app
// ---------------------------------------------------------------------------
function SmartLink({
  href,
  children,
  className,
  onClick,
  title,
  "aria-current": ariaCurrent,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  "aria-current"?: "page" | undefined;
}) {
  const targetApp = getAppFromHref(href);
  if (targetApp === CURRENT_APP) {
    return (
      <Link href={toInternalHref(href)} prefetch={false} className={className} onClick={onClick} title={title} aria-current={ariaCurrent}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} onClick={onClick} title={title} aria-current={ariaCurrent}>
      {children}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Desktop: Centers Mega Dropdown (current app — with gradient hero header)
// ---------------------------------------------------------------------------
function CentersMegaDropdown({
  section,
  onClose,
  pathname,
  onNearbyClick,
}: {
  section: NavSection;
  onClose: () => void;
  pathname: string;
  onNearbyClick: () => void;
}) {
  const colors = ACCENT_COLORS[section.accentColor];
  const Icon = section.icon;

  return (
    <div className="absolute top-full right-0 mt-1.5 w-[320px] bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-700/50 rounded-2xl shadow-2xl shadow-emerald-500/8 dark:shadow-emerald-900/30 overflow-hidden animate-in fade-in-0 zoom-in-[0.98] slide-in-from-top-1 duration-150 z-50">
      {/* Gradient hero header — soft */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-emerald-500/8 to-teal-500/5 dark:from-emerald-500/20 dark:via-emerald-500/15 dark:to-teal-500/10 px-4 py-3.5">
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-400/10 dark:bg-emerald-400/10 rounded-full -translate-y-12 translate-x-12" />
        <div className="relative z-10">
          <SmartLink href={section.href} onClick={onClose} className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${colors.bgSubtle} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${colors.text}`} />
            </div>
            <div>
              <span className={`block text-[14px] font-bold ${colors.text}`}>{section.label}</span>
              <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 font-medium leading-snug">{section.description}</span>
            </div>
          </SmartLink>
        </div>
      </div>
      <div className="p-1.5">
        {section.subItems.map((item) => {
          const ItemIcon = item.icon;
          const internalHref = toInternalHref(item.href);
          const isNearby = item.href === "/centers?nearby=true";
          const isActive = !isNearby && (pathname === internalHref || (internalHref !== "/" && pathname.startsWith(internalHref)));

          if (isNearby) {
            return (
              <button
                key={item.href}
                onClick={() => { onClose(); onNearbyClick(); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${colors.text} hover:${colors.bgSubtle}`}
              >
                <ItemIcon className="w-4 h-4" />
                {item.label}
                <MapPin className="w-3.5 h-3.5 ml-auto opacity-50" />
              </button>
            );
          }

          return (
            <SmartLink
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                isActive
                  ? `${colors.bgSubtle} ${colors.text} font-semibold`
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 hover:translate-x-0.5"
              }`}
            >
              <ItemIcon className="w-4 h-4 opacity-60" />
              {item.label}
            </SmartLink>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop: Simple Dropdown (for other apps — with gradient hero header)
// ---------------------------------------------------------------------------
function SimpleDropdown({
  section,
  onClose,
  align = "left",
}: {
  section: NavSection;
  onClose: () => void;
  align?: "left" | "right";
}) {
  const colors = ACCENT_COLORS[section.accentColor];
  const gradient = SIMPLE_DROPDOWN_GRADIENTS[section.accentColor] || SIMPLE_DROPDOWN_GRADIENTS.slate;
  const Icon = section.icon;

  return (
    <div className={`absolute top-full mt-1.5 w-60 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-700/50 rounded-2xl shadow-xl shadow-black/8 dark:shadow-black/30 overflow-hidden animate-in fade-in-0 zoom-in-[0.98] slide-in-from-top-1 duration-150 z-50 ${align === "right" ? "right-0" : "left-0"}`}>
      {/* Gradient hero header — soft */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} px-4 py-3.5`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.04] rounded-full -translate-y-10 translate-x-10" />
        <div className="relative z-10">
          <SmartLink href={section.href} onClick={onClose} className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${colors.bgSubtle} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${colors.text}`} />
            </div>
            <div>
              <span className={`block text-[14px] font-bold ${colors.text}`}>{section.label}</span>
              <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 font-medium leading-snug">{section.description}</span>
            </div>
          </SmartLink>
        </div>
      </div>
      <div className="p-1.5">
        {section.subItems.map((item) => {
          const ItemIcon = item.icon;
          return (
            <SmartLink
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 hover:translate-x-0.5"
            >
              <ItemIcon className="w-4 h-4 opacity-60" />
              {item.label}
            </SmartLink>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile: Current App Hero Card
// ---------------------------------------------------------------------------
function MobileCurrentAppHero({
  onNavigate,
}: {
  onNavigate: () => void;
}) {
  const section = NAVIGATION.find((s) => s.id === CURRENT_APP);
  if (!section) return null;
  const Icon = section.icon;

  return (
    <div className="px-4 pt-4 pb-2">
      <SmartLink
        href={section.href}
        onClick={onNavigate}
        className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-900 p-5 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/40"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{section.label}</h2>
              <p className="text-[13px] text-white/70 font-medium">{section.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[13px] text-white/80 font-medium">
            <span>Search all centers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </SmartLink>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile: Centers Content Cards
// ---------------------------------------------------------------------------
function MobileCentersContentCards({
  pathname,
  onNavigate,
  onNearbyClick,
}: {
  pathname: string;
  onNavigate: () => void;
  onNearbyClick: () => void;
}) {
  const section = NAVIGATION.find((s) => s.id === CURRENT_APP);
  if (!section) return null;
  const colors = ACCENT_COLORS[section.accentColor];

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          Find a Center
        </p>
        <div className="h-px flex-1 ml-3 bg-neutral-100 dark:bg-neutral-800" />
      </div>

      <div className="space-y-2">
        {section.subItems.map((item) => {
          const ItemIcon = item.icon;
          const internalHref = toInternalHref(item.href);
          const isNearby = item.href === "/centers?nearby=true";
          const isActive = !isNearby && (pathname === internalHref || (internalHref !== "/" && pathname.startsWith(internalHref)));
          const meta = CENTERS_SECTION_META[item.label];
          const gradient = meta?.gradient || "from-neutral-500/10 to-neutral-500/5";
          const tagline = meta?.tagline || "";

          if (isNearby) {
            return (
              <button
                key={item.href}
                onClick={() => { onNavigate(); onNearbyClick(); }}
                className={`w-full flex items-center gap-3.5 p-3.5 bg-gradient-to-r ${gradient} rounded-2xl transition-all duration-200`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colors.bgSubtle} ${colors.text} shadow-sm`}>
                  <ItemIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className={`block text-[15px] font-semibold ${colors.text}`}>
                    {item.label}
                  </span>
                  {tagline && (
                    <span className="block text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                      {tagline}
                    </span>
                  )}
                </div>
                <MapPin className="w-4 h-4 text-neutral-400" />
              </button>
            );
          }

          return (
            <SmartLink
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`w-full flex items-center gap-3.5 p-3.5 bg-gradient-to-r ${gradient} rounded-2xl transition-all duration-200`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isActive
                  ? `${colors.bgSubtle} ${colors.text}`
                  : "bg-white/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300"
              } shadow-sm`}>
                <ItemIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className={`block text-[15px] font-semibold ${
                  isActive ? colors.text : "text-neutral-900 dark:text-neutral-100"
                }`}>
                  {item.label}
                </span>
                {tagline && (
                  <span className="block text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                    {tagline}
                  </span>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </SmartLink>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile: Ecosystem Section — other apps as 2-col grid
// ---------------------------------------------------------------------------
function MobileEcosystemSection({
  currentApp,
  onNavigate,
}: {
  currentApp: AppId;
  onNavigate: () => void;
}) {
  const otherSections = NAVIGATION.filter((s) => s.id !== currentApp);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          Explore More
        </p>
        <div className="h-px flex-1 ml-3 bg-neutral-100 dark:bg-neutral-800" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {otherSections.map((section) => {
          const Icon = section.icon;
          const colors = ACCENT_COLORS[section.accentColor];
          const meta = OTHER_APP_META[section.id];
          const gradient = meta?.gradient || "from-neutral-500/10 to-neutral-500/5";
          const hook = meta?.hook || section.description;

          return (
            <SmartLink
              key={section.id}
              href={section.href}
              onClick={onNavigate}
              className={`group relative flex flex-col p-3.5 rounded-2xl bg-gradient-to-br ${gradient} transition-all duration-200 active:scale-[0.98]`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${colors.bgSubtle}`}>
                <Icon className={`w-5 h-5 ${colors.text}`} />
              </div>
              <span className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                {section.label}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug font-medium">
                {hook}
              </span>
              <ArrowRight className={`w-3.5 h-3.5 ${colors.text} mt-2.5 opacity-60 group-active:translate-x-0.5 transition-transform`} />
            </SmartLink>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile: Quick Actions Footer
// ---------------------------------------------------------------------------
function MobileQuickActions({
  onNavigate,
}: {
  onNavigate: () => void;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          Quick Start
        </p>
        <div className="h-px flex-1 ml-3 bg-neutral-100 dark:bg-neutral-800" />
      </div>
      <a
        href="https://www.brahmakumaris.com/m"
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/10 to-orange-500/5 dark:from-rose-500/20 dark:to-orange-500/10 transition-all duration-200 active:scale-[0.98]"
      >
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="block text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            Learn Meditation
          </span>
          <span className="block text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
            Start your first session today
          </span>
        </div>
        <ExternalLink className="w-4 h-4 text-neutral-300 dark:text-neutral-600 shrink-0" />
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile: WhatsApp Soul Sustenance Channels
// ---------------------------------------------------------------------------
function MobileWhatsAppSection() {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          Daily Inspiration on WhatsApp
        </p>
        <div className="h-px flex-1 ml-3 bg-neutral-100 dark:bg-neutral-800" />
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/5 dark:from-green-500/20 dark:via-emerald-500/10 dark:to-teal-500/10 p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 dark:bg-[#25D366]/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
              Join Soul Sustenance Channel
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
              Receive daily spiritual wisdom on WhatsApp
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="https://www.brahmakumaris.com/join-sse"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#22c55e] text-white text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] shadow-sm shadow-green-500/20"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            English
          </a>
          <a
            href="https://www.brahmakumaris.com/join-ssh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#22c55e] text-white text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] shadow-sm shadow-green-500/20"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            हिन्दी
          </a>
        </div>
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2.5 text-center leading-snug">
          WhatsApp Channel · Your privacy is always protected
        </p>
      </div>
    </div>
  );
}

// ===========================================================================
// MAIN HEADER COMPONENT
// ===========================================================================
export function UnifiedHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const whatsappDesktopRef = useRef<HTMLDivElement>(null);
  const whatsappMobileRef = useRef<HTMLDivElement>(null);

  // Close everything on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
      if (whatsappDesktopRef.current && !whatsappDesktopRef.current.contains(e.target as Node) && whatsappMobileRef.current && !whatsappMobileRef.current.contains(e.target as Node)) {
        setIsWhatsAppOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseEnter = useCallback((sectionId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setActiveDropdown(sectionId), HOVER_DELAY_IN);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setActiveDropdown(null), HOVER_DELAY_OUT);
  }, []);

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const closeDropdown = useCallback(() => setActiveDropdown(null), []);

  // Geolocation handler
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        router.push(
          `/?lat=${latitude}&lng=${longitude}&address=${encodeURIComponent("Current Location")}`
        );
      },
      (error) => {
        let errorMessage = "Failed to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please allow location access in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        alert(errorMessage);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }, [router]);

  return (
    <>
      <header
        className="sticky top-0 z-[70] w-full bg-gradient-to-r from-white/90 via-emerald-50/30 to-white/90 dark:from-neutral-950/90 dark:via-emerald-950/20 dark:to-neutral-950/90 backdrop-blur-2xl backdrop-saturate-[1.8] border-b border-emerald-200/40 dark:border-emerald-800/20 shadow-[0_1px_8px_rgba(16,185,129,0.06)] dark:shadow-[0_1px_8px_rgba(16,185,129,0.08)]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a
              href="https://www.brahmakumaris.com"
              className="flex items-center shrink-0"
              aria-label="Brahma Kumaris Home"
            >
              <img
                src={BK_LOGO_URL}
                alt="Brahma Kumaris"
                width={160}
                height={44}
                className="h-9 w-auto object-contain"
                fetchPriority="high"
              />
            </a>

            {/* ========== Desktop Navigation ========== */}
            <nav
              className="hidden lg:flex items-center gap-1"
              ref={navRef}
              role="navigation"
              aria-label="Main navigation"
            >
              <div className="flex items-center gap-0.5 rounded-full bg-neutral-100/60 dark:bg-neutral-800/50 p-1 ring-1 ring-neutral-200/40 dark:ring-neutral-700/30">
                {NAVIGATION.map((section) => {
                  const isCurrentSection = section.id === CURRENT_APP;
                  const Icon = section.icon;
                  const colors = ACCENT_COLORS[section.accentColor];
                  const isDropdownOpen = activeDropdown === section.id;

                  return (
                    <div
                      key={section.id}
                      className="relative"
                      onMouseEnter={() => handleMouseEnter(section.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {isCurrentSection ? (
                        <button
                          onClick={() => setActiveDropdown(isDropdownOpen ? null : section.id)}
                          className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap select-none bg-gradient-to-r from-white via-emerald-50/80 to-white dark:from-neutral-800 dark:via-emerald-900/30 dark:to-neutral-800 shadow-sm shadow-emerald-500/10 ${colors.text} ring-1 ring-emerald-200/50 dark:ring-emerald-700/30`}
                          aria-expanded={isDropdownOpen}
                          aria-haspopup="true"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{section.label}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveDropdown(isDropdownOpen ? null : section.id)}
                          className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap select-none ${
                            isDropdownOpen
                              ? `bg-white/70 dark:bg-neutral-700/50 ${colors.text} shadow-sm`
                              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-white/70 dark:hover:bg-neutral-700/50"
                          }`}
                          aria-expanded={isDropdownOpen}
                          aria-haspopup="true"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{section.label}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                      )}

                      {isDropdownOpen && isCurrentSection && (
                        <CentersMegaDropdown
                          section={section}
                          onClose={closeDropdown}
                          pathname={pathname}
                          onNearbyClick={handleUseMyLocation}
                        />
                      )}

                      {isDropdownOpen && !isCurrentSection && (
                        <SimpleDropdown
                          section={section}
                          onClose={closeDropdown}
                          align={section.id === "aboutus" || section.id === "news" ? "right" : "left"}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-0.5 ml-1">
                {/* WhatsApp button */}
                <div className="relative" ref={whatsappDesktopRef}>
                  <button
                    onClick={() => setIsWhatsAppOpen(!isWhatsAppOpen)}
                    className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 ${
                      isWhatsAppOpen
                        ? "text-[#25D366] bg-green-50 dark:bg-green-950/30 shadow-sm ring-1 ring-green-200/50 dark:ring-green-800/30"
                        : "text-neutral-400 dark:text-neutral-500 hover:text-[#25D366] hover:bg-green-50/50 dark:hover:bg-green-950/20"
                    }`}
                    title="Join Soul Sustenance on WhatsApp"
                    aria-expanded={isWhatsAppOpen}
                    aria-haspopup="true"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                  {isWhatsAppOpen && (
                    <div className="absolute top-full right-0 mt-1.5 w-64 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-700/50 rounded-2xl shadow-xl shadow-black/8 dark:shadow-black/30 overflow-hidden animate-in fade-in-0 zoom-in-[0.98] slide-in-from-top-1 duration-150 z-50">
                      <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/5 dark:from-green-500/20 dark:via-emerald-500/10 dark:to-teal-500/10 px-4 py-3">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-400/10 rounded-full -translate-y-8 translate-x-8" />
                        <div className="relative z-10 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 dark:bg-[#25D366]/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">Daily Soul Sustenance</p>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Join our WhatsApp Channel</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 space-y-1">
                        <a
                          href="https://www.brahmakumaris.com/join-sse"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsWhatsAppOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-neutral-600 dark:text-neutral-400 hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-[#25D366] hover:translate-x-0.5"
                        >
                          <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          <span className="font-medium">English</span>
                          <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                        </a>
                        <a
                          href="https://www.brahmakumaris.com/join-ssh"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsWhatsAppOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-neutral-600 dark:text-neutral-400 hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-[#25D366] hover:translate-x-0.5"
                        >
                          <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          <span className="font-medium">हिन्दी</span>
                          <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                        </a>
                      </div>
                      <div className="px-4 pb-2.5">
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center leading-snug">
                          WhatsApp Channel · Privacy always protected
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <ThemeToggle />
              </div>
            </nav>

            {/* ========== Mobile Controls ========== */}
            <div className="flex lg:hidden items-center gap-0.5">
              <Link
                href="/"
                prefetch={false}
                className="flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-200 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Search Centers"
              >
                <Search className="w-5 h-5" />
              </Link>
              {/* WhatsApp — mobile */}
              <div className="relative" ref={whatsappMobileRef}>
                <button
                  onClick={() => setIsWhatsAppOpen(!isWhatsAppOpen)}
                  className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-200 ${
                    isWhatsAppOpen
                      ? "text-[#25D366] bg-green-50 dark:bg-green-950/30"
                      : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                  title="Join Soul Sustenance on WhatsApp"
                  aria-expanded={isWhatsAppOpen}
                  aria-haspopup="true"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </button>
                {isWhatsAppOpen && (
                  <div className="absolute top-full right-0 mt-1.5 w-64 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-700/50 rounded-2xl shadow-xl shadow-black/8 dark:shadow-black/30 overflow-hidden animate-in fade-in-0 zoom-in-[0.98] slide-in-from-top-1 duration-150 z-[80]">
                    <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/5 dark:from-green-500/20 dark:via-emerald-500/10 dark:to-teal-500/10 px-4 py-3">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-green-400/10 rounded-full -translate-y-8 translate-x-8" />
                      <div className="relative z-10 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 dark:bg-[#25D366]/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">Daily Soul Sustenance</p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Join our WhatsApp Channel</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <a href="https://www.brahmakumaris.com/join-sse" target="_blank" rel="noopener noreferrer" onClick={() => setIsWhatsAppOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-neutral-600 dark:text-neutral-400 hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-[#25D366]">
                        <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        <span className="font-medium">English</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                      </a>
                      <a href="https://www.brahmakumaris.com/join-ssh" target="_blank" rel="noopener noreferrer" onClick={() => setIsWhatsAppOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-neutral-600 dark:text-neutral-400 hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-[#25D366]">
                        <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        <span className="font-medium">हिन्दी</span>
                        <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                      </a>
                    </div>
                    <div className="px-4 pb-2.5">
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center leading-snug">WhatsApp Channel · Privacy always protected</p>
                    </div>
                  </div>
                )}
              </div>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl relative"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className={`w-5 h-5 transition-all duration-300 absolute ${isMobileMenuOpen ? "rotate-90 opacity-0 scale-0" : "rotate-0 opacity-100 scale-100"}`} />
                <X className={`w-5 h-5 transition-all duration-300 absolute ${isMobileMenuOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-0"}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* FULL-SCREEN MOBILE MENU                                          */}
      {/* ================================================================ */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div
            className="absolute top-16 inset-x-0 bottom-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
            onClick={closeMobileMenu}
          />

          <div
            className="absolute top-16 left-0 right-0 bottom-0 bg-white dark:bg-neutral-950 overflow-y-auto overscroll-contain animate-in slide-in-from-top-2 fade-in duration-200"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
              marginTop: "env(safe-area-inset-top, 0px)",
            }}
          >
            {/* 1. Current App Hero */}
            <MobileCurrentAppHero onNavigate={closeMobileMenu} />

            {/* 2. Centers Content Cards */}
            <MobileCentersContentCards pathname={pathname} onNavigate={closeMobileMenu} onNearbyClick={handleUseMyLocation} />

            {/* Divider */}
            <div className="mx-4 border-t border-neutral-100 dark:border-neutral-800" />

            {/* 3. Ecosystem */}
            <MobileEcosystemSection currentApp={CURRENT_APP} onNavigate={closeMobileMenu} />

            {/* Divider */}
            <div className="mx-4 border-t border-neutral-100 dark:border-neutral-800" />

            {/* 4. Quick Actions */}
            <MobileQuickActions onNavigate={closeMobileMenu} />

            {/* Divider */}
            <div className="mx-4 border-t border-neutral-100 dark:border-neutral-800" />

            {/* 5. WhatsApp Soul Sustenance */}
            <MobileWhatsAppSection />
          </div>
        </div>
      )}
    </>
  );
}
