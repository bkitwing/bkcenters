'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import {
  Menu,
  X,
  Phone,
  Home,
  ChevronDown,
  ExternalLink,
  Info,
  Facebook,
  Instagram,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BorderBeam } from '../_components/BorderBeam';
import { JB_CONTENT } from './content';
import {
  JB_NAV,
  JB_ABOUT_HREF,
  JB_CONTACT_HREF,
  JB_HOME_HREF,
  type JbNavChild,
  type JbNavItem,
} from './nav';

const JB_LOGO_URL =
  'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Jagdamba_Bhawan_White_Logo_Bold_500x130_2c81a38e66.webp';

const SOCIAL_ICONS: Record<'facebook' | 'instagram' | 'youtube', LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
};

const JB_SOCIALS = JB_CONTENT.contactCta.socials.map((s) => ({
  ...s,
  Icon: SOCIAL_ICONS[s.icon] ?? Instagram,
}));

/** Match UnifiedHeader hover feel. */
const HOVER_DELAY_IN = 80;
const HOVER_DELAY_OUT = 200;

/** About (no hash) should always land at page top — clear leftover #campus etc. */
function isJbAboutPath(pathname: string) {
  return /\/jagdamba-bhawan\/about\/?$/.test(pathname);
}

function goAboutTop() {
  const { pathname, search, hash } = window.location;
  if (!isJbAboutPath(pathname)) return;
  if (hash) {
    window.history.replaceState(window.history.state, '', `${pathname}${search}`);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onAboutChildClick(child: JbNavChild, close: () => void) {
  close();
  const [path, hashPart] = child.href.split('#');
  if (!hashPart && path === JB_ABOUT_HREF) {
    requestAnimationFrame(() => goAboutTop());
  }
}

function useSyncHeaderHeight(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    const root = document.querySelector<HTMLElement>('.jb-oasis');
    if (!el || !root) return;

    const update = () => {
      const pill = el.querySelector<HTMLElement>('.jb-pill-header');
      const wrapTop = el.getBoundingClientRect().top;
      const bottom = pill
        ? pill.getBoundingClientRect().bottom
        : el.getBoundingClientRect().bottom;
      root.style.setProperty('--jb-header-h', `${Math.ceil(bottom - wrapTop)}px`);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const pill = el.querySelector<HTMLElement>('.jb-pill-header');
    if (pill) ro.observe(pill);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [ref]);
}

function isNavActive(pathname: string, href: string) {
  const base = href.split('#')[0] || href;
  if (base === JB_HOME_HREF) return pathname === JB_HOME_HREF;
  return pathname === base || pathname.startsWith(`${base}/`);
}

function NavLink({
  item,
  onNavigate,
}: {
  item: JbNavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChildren = Boolean(item.children?.length);
  const isHome = item.icon === true;
  const hashOnly = item.href.includes('#');
  const active =
    isNavActive(pathname, item.href) ||
    (hasChildren &&
      item.children!.some((c) => !c.external && isNavActive(pathname, c.href)));

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearHoverTimeout();
    hoverTimeoutRef.current = setTimeout(() => setOpen(true), HOVER_DELAY_IN);
  }, [clearHoverTimeout]);

  const closeMenu = useCallback(() => {
    clearHoverTimeout();
    hoverTimeoutRef.current = setTimeout(() => setOpen(false), HOVER_DELAY_OUT);
  }, [clearHoverTimeout]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => () => clearHoverTimeout(), [clearHoverTimeout]);

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        className={`jb-pill-nav__item${isHome ? ' jb-pill-nav__item--icon' : ''}${
          active && !hashOnly ? ' is-active' : ''
        }`}
        aria-current={active && !hashOnly ? 'page' : undefined}
        aria-label={isHome ? 'Home' : undefined}
        onClick={onNavigate}
      >
        {isHome ? (
          <Home className="jb-pill-nav__icon" aria-hidden />
        ) : (
          <span>{item.label}</span>
        )}
      </Link>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`jb-pill-nav__drop${open ? ' is-open' : ''}${active ? ' is-active' : ''}`}
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <button
        type="button"
        className={`jb-pill-nav__item jb-pill-nav__item--drop${open || active ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          clearHoverTimeout();
          setOpen((v) => !v);
        }}
      >
        <span>{item.label}</span>
        <ChevronDown className="jb-pill-nav__chev" aria-hidden />
      </button>
      {open ? (
        <div className="jb-pill-nav__menu" role="menu">
          <div className="jb-pill-nav__menu-head">
            <span className="jb-pill-nav__menu-icon" aria-hidden>
              <Info className="w-4 h-4" />
            </span>
            <span>
              <span className="jb-pill-nav__menu-title">About</span>
            </span>
          </div>
          <div className="jb-pill-nav__menu-list">
            {item.children!.map((child) =>
              child.external ? (
                <a
                  key={child.href}
                  href={child.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  className="jb-pill-nav__menu-item"
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                >
                  {child.label}
                  <ExternalLink className="jb-pill-nav__ext" aria-hidden />
                </a>
              ) : (
                <Link
                  key={child.href}
                  href={child.href}
                  role="menuitem"
                  className="jb-pill-nav__menu-item"
                  onClick={() => {
                    onAboutChildClick(child, () => {
                      setOpen(false);
                      onNavigate?.();
                    });
                  }}
                >
                  {child.label}
                </Link>
              )
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function JbHeader() {
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useSyncHeaderHeight(wrapRef);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) setAboutOpen(false);
  }, [open]);

  return (
    <>
      <div
        ref={wrapRef}
        className="jb-header-wrap"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="jb-container">
          <header className="jb-pill-header">
            <div className="jb-pill-header__fx" aria-hidden>
              <BorderBeam
                size={90}
                duration={16}
                colorFrom="rgba(232,244,248,0.65)"
                colorTo="rgba(112,188,211,0.95)"
                borderWidth={1.5}
                transition={{ ease: 'linear' }}
              />
            </div>

            <div className="jb-pill-header__inner">
              <Link
                href={JB_HOME_HREF}
                className="jb-pill-header__brand"
                aria-label="Jagdamba Bhawan home"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={JB_LOGO_URL}
                  alt="Brahma Kumaris Jagdamba Bhawan"
                  width={260}
                  height={66}
                  className="jb-pill-header__logo"
                  fetchPriority="high"
                />
              </Link>

              <nav className="jb-pill-nav" aria-label="Campus navigation">
                {JB_NAV.map((item) => (
                  <NavLink key={item.label} item={item} />
                ))}
              </nav>

              <div className="jb-pill-header__controls">
                <Link href={JB_CONTACT_HREF} className="jb-btn jb-btn--header jb-pill-header__cta-mobile">
                  Contact
                </Link>

                <button
                  type="button"
                  className="jb-pill-header__menu-btn"
                  onClick={() => setOpen(true)}
                  aria-label="Open menu"
                  aria-haspopup="dialog"
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </button>

                <div className="jb-pill-header__socials" aria-label="Social media">
                  {JB_SOCIALS.map(({ label, href, Icon }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="jb-pill-header__social"
                      aria-label={label}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </a>
                  ))}
                </div>

                <span className="jb-pill-header__cta-desktop">
                  <Link href={JB_CONTACT_HREF} className="jb-btn jb-btn--header">
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    Contact
                  </Link>
                  <BorderBeam
                    size={30}
                    duration={9}
                    colorFrom="rgba(255,255,255,0.9)"
                    colorTo="rgba(112,188,211,0.65)"
                    borderWidth={1.5}
                    transition={{ ease: 'linear' }}
                  />
                </span>
              </div>
            </div>
          </header>
        </div>
      </div>

      <div className={`jb-sheet${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <button
          type="button"
          className="jb-sheet__backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
        <div className="jb-sheet__panel" role="dialog" aria-label="Campus menu">
          <div className="jb-sheet__top">
            <p className="jb-sheet__title">Jagdamba Bhawan</p>
            <button
              type="button"
              className="jb-sheet__close"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="jb-sheet__nav">
            {JB_NAV.map((item) => {
              if (item.children?.length) {
                return (
                  <div key={item.label} className="jb-sheet__group">
                    <button
                      type="button"
                      className="jb-sheet__link jb-sheet__link--toggle"
                      aria-expanded={aboutOpen}
                      onClick={() => setAboutOpen((v) => !v)}
                    >
                      {item.label}
                      <ChevronDown
                        className={`jb-sheet__chev${aboutOpen ? ' is-open' : ''}`}
                        aria-hidden
                      />
                    </button>
                    {aboutOpen ? (
                      <div className="jb-sheet__subnav">
                        {item.children.map((child) =>
                          child.external ? (
                            <a
                              key={child.href}
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="jb-sheet__sublink"
                              onClick={() => setOpen(false)}
                            >
                              {child.label}
                              <ExternalLink className="w-3.5 h-3.5 opacity-50" aria-hidden />
                            </a>
                          ) : (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="jb-sheet__sublink"
                              onClick={() => {
                                onAboutChildClick(child, () => setOpen(false));
                              }}
                            >
                              {child.label}
                            </Link>
                          )
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="jb-sheet__link"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={JB_CONTACT_HREF}
              className="jb-sheet__link"
              onClick={() => setOpen(false)}
            >
              Contact
            </Link>
          </nav>
          <div className="jb-sheet__socials" aria-label="Social media">
            {JB_SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="jb-sheet__social"
                aria-label={label}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </a>
            ))}
          </div>
          <div className="jb-sheet__theme">
            <span className="jb-sheet__theme-label">Appearance</span>
            <ThemeToggle />
          </div>
          <Link
            href={JB_CONTACT_HREF}
            className="jb-btn jb-btn--primary jb-sheet__cta"
            onClick={() => setOpen(false)}
          >
            Enquire
          </Link>
          <a href="/centers" className="jb-sheet__sub" onClick={() => setOpen(false)}>
            Find a Center
          </a>
        </div>
      </div>
    </>
  );
}
