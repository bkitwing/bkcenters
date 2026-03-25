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
// Desktop Mega Dropdown (Centers — current app, positioned from nav container)
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

  return (
    <div className="absolute top-full right-0 mt-1.5 w-[320px] bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-700/70 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden animate-in fade-in-0 zoom-in-[0.98] slide-in-from-top-1 duration-150 z-50">
      <div className={`px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 ${colors.bgSubtle}`}>
        <SmartLink href={section.href} onClick={onClose} className="flex items-center gap-2">
          <section.icon className={`w-4 h-4 ${colors.text}`} />
          <span className={`text-sm font-semibold ${colors.text}`}>{section.label}</span>
        </SmartLink>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{section.description}</p>
      </div>
      <div className="p-1.5">
        {section.subItems.map((item) => {
          const ItemIcon = item.icon;
          const internalHref = toInternalHref(item.href);
          // "Nearby" is special — triggers geolocation
          const isNearby = item.href === "/centers?nearby=true";
          const isActive = !isNearby && (pathname === internalHref || (internalHref !== "/" && pathname.startsWith(internalHref)));

          if (isNearby) {
            return (
              <button
                key={item.href}
                onClick={() => { onClose(); onNearbyClick(); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${colors.text} hover:${colors.bgSubtle}`}
              >
                <ItemIcon className="w-4 h-4" />
                {item.label}
              </button>
            );
          }

          return (
            <SmartLink
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? `${colors.bgSubtle} ${colors.text} font-medium`
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200"
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
// Desktop Simple Dropdown (for other apps: Wisdom, News, Events, etc.)
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
  return (
    <div className={`absolute top-full mt-1.5 w-56 bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-700/70 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden animate-in fade-in-0 zoom-in-[0.98] slide-in-from-top-1 duration-150 z-50 ${align === "right" ? "right-0" : "left-0"}`}>
      <div className={`px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 ${colors.bgSubtle}`}>
        <SmartLink href={section.href} onClick={onClose} className="flex items-center gap-2">
          <section.icon className={`w-4 h-4 ${colors.text}`} />
          <span className={`text-sm font-semibold ${colors.text}`}>{section.label}</span>
        </SmartLink>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{section.description}</p>
      </div>
      <div className="p-1.5">
        {section.subItems.map((item) => {
          const ItemIcon = item.icon;
          return (
            <SmartLink
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200"
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
// Mobile Sub-Navigation (accordion for current app — Centers)
// ---------------------------------------------------------------------------
function MobileSubNav({
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
    <div className="px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
        {section.label}
      </p>
      <div className="space-y-1">
        {section.subItems.map((item) => {
          const ItemIcon = item.icon;
          const internalHref = toInternalHref(item.href);
          const isNearby = item.href === "/centers?nearby=true";
          const isActive = !isNearby && (pathname === internalHref || (internalHref !== "/" && pathname.startsWith(internalHref)));

          if (isNearby) {
            return (
              <button
                key={item.href}
                onClick={() => { onNavigate(); onNearbyClick(); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 ${colors.text} active:bg-neutral-100 dark:active:bg-neutral-800`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors.bgSubtle}`}>
                  <ItemIcon className="w-[18px] h-[18px]" />
                </div>
                <span className="flex-1 text-left">{item.label}</span>
                <MapPin className="w-4 h-4 text-neutral-400" />
              </button>
            );
          }

          return (
            <SmartLink
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                isActive
                  ? `${colors.bgSubtle} ${colors.text}`
                  : "text-neutral-800 dark:text-neutral-200 active:bg-neutral-100 dark:active:bg-neutral-800"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isActive ? colors.bgSubtle : "bg-neutral-100 dark:bg-neutral-800"
              }`}>
                <ItemIcon className="w-[18px] h-[18px]" />
              </div>
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </SmartLink>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile Other Sections
// ---------------------------------------------------------------------------
function MobileOtherSections({
  currentApp,
  onNavigate,
}: {
  currentApp: AppId;
  onNavigate: () => void;
}) {
  const otherSections = NAVIGATION.filter((s) => s.id !== currentApp);
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
        Explore More
      </p>
      <div className="space-y-1">
        {otherSections.map((section) => {
          const Icon = section.icon;
          const colors = ACCENT_COLORS[section.accentColor];
          return (
            <SmartLink
              key={section.id}
              href={section.href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium text-neutral-800 dark:text-neutral-200 active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors.bgSubtle}`}>
                <Icon className={`w-[18px] h-[18px] ${colors.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block">{section.label}</span>
                <span className="block text-[12px] text-neutral-400 dark:text-neutral-500 font-normal">{section.description}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-neutral-300 dark:text-neutral-600 shrink-0" />
            </SmartLink>
          );
        })}
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
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Geolocation handler (preserved from old Header)
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
        className="sticky top-0 z-50 w-full bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl backdrop-saturate-150 border-b border-neutral-200/60 dark:border-neutral-800/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
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
              {/* Section tabs with dropdowns */}
              <div className="flex items-center gap-0.5 rounded-full bg-neutral-100/80 dark:bg-neutral-800/60 p-1">
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
                          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap select-none bg-white dark:bg-neutral-900 shadow-sm ${colors.text} ring-1 ring-black/[0.04] dark:ring-white/[0.06]`}
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
                          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap select-none ${
                            isDropdownOpen
                              ? `bg-white/60 dark:bg-neutral-700/40 ${colors.text}`
                              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white/60 dark:hover:bg-neutral-700/40"
                          }`}
                          aria-expanded={isDropdownOpen}
                          aria-haspopup="true"
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{section.label}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                      )}

                      {/* Dropdown for current app (centers mega) */}
                      {isDropdownOpen && isCurrentSection && (
                        <CentersMegaDropdown
                          section={section}
                          onClose={closeDropdown}
                          pathname={pathname}
                          onNearbyClick={handleUseMyLocation}
                        />
                      )}

                      {/* Dropdown for other apps (simple) */}
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

              {/* Theme toggle */}
              <div className="flex items-center gap-0.5 ml-1">
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
          className="fixed inset-0 z-40 lg:hidden"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeMobileMenu}
          />

          {/* Menu panel — full width, starts below header */}
          <div
            className="absolute top-16 left-0 right-0 bottom-0 bg-white dark:bg-neutral-950 overflow-y-auto overscroll-contain animate-in slide-in-from-top-2 fade-in duration-200"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
              marginTop: "env(safe-area-inset-top, 0px)",
            }}
          >
            {/* Section Cards */}
            <div className="grid grid-cols-4 gap-2 px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              {NAVIGATION.map((section) => {
                const isActive = section.id === CURRENT_APP;
                const Icon = section.icon;
                const colors = ACCENT_COLORS[section.accentColor];
                return (
                  <SmartLink
                    key={section.id}
                    href={section.href}
                    onClick={closeMobileMenu}
                    className={`flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl text-center transition-all duration-200 ${
                      isActive
                        ? `${colors.bgSubtle} ${colors.text} ring-1 ${colors.border}/20`
                        : "text-neutral-500 dark:text-neutral-400 active:bg-neutral-100 dark:active:bg-neutral-800"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive ? `${colors.bgSubtle} ${colors.text}` : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                    }`}>
                      <Icon className={`w-5 h-5 ${isActive ? "" : "inherit"}`} />
                    </div>
                    <span className="text-[11px] font-bold leading-none tracking-wide">{section.label}</span>
                  </SmartLink>
                );
              })}
            </div>

            {/* Current App Sub-Nav */}
            <MobileSubNav pathname={pathname} onNavigate={closeMobileMenu} onNearbyClick={handleUseMyLocation} />

            {/* Divider */}
            <div className="mx-5 border-t border-neutral-100 dark:border-neutral-800" />

            {/* Other Sections */}
            <MobileOtherSections currentApp={CURRENT_APP} onNavigate={closeMobileMenu} />

            {/* Divider */}
            <div className="mx-5 border-t border-neutral-100 dark:border-neutral-800" />

            {/* Quick Links */}
            <div className="px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
                Quick Links
              </p>
              <a
                href="https://www.brahmakumaris.com/m"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium text-neutral-800 dark:text-neutral-200 active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-rose-50 dark:bg-rose-950/40">
                  <Sparkles className="w-[18px] h-[18px] text-rose-600 dark:text-rose-400" />
                </div>
                <span>Learn Meditation</span>
                <ExternalLink className="w-4 h-4 ml-auto text-neutral-300 dark:text-neutral-600" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
