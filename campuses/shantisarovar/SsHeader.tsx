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
import { Menu, X, Phone, Home, ChevronDown, ExternalLink, Info } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BorderBeam } from '../_components/BorderBeam';
import {
  SS_NAV,
  SS_CONTACT_HREF,
  SS_HOME_HREF,
  type SsNavItem,
} from './nav';

const SS_LOGO_URL =
  'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Brahma_Kumaris_Logo_Shanti_Sarovar2_b7be975114_f3d57fd5a0.png';

/** Match UnifiedHeader hover feel. */
const HOVER_DELAY_IN = 80;
const HOVER_DELAY_OUT = 200;

function useSyncHeaderHeight(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    const root = document.querySelector<HTMLElement>('.ss-oasis');
    if (!el || !root) return;

    const update = () => {
      const pill = el.querySelector<HTMLElement>('.ss-pill-header');
      const wrapTop = el.getBoundingClientRect().top;
      const bottom = pill
        ? pill.getBoundingClientRect().bottom
        : el.getBoundingClientRect().bottom;
      root.style.setProperty('--ss-header-h', `${Math.ceil(bottom - wrapTop)}px`);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const pill = el.querySelector<HTMLElement>('.ss-pill-header');
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
  if (base === SS_HOME_HREF) return pathname === SS_HOME_HREF;
  return pathname === base || pathname.startsWith(`${base}/`);
}

function NavLink({
  item,
  onNavigate,
}: {
  item: SsNavItem;
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
        className={`ss-pill-nav__item${isHome ? ' ss-pill-nav__item--icon' : ''}${
          active && !hashOnly ? ' is-active' : ''
        }`}
        aria-current={active && !hashOnly ? 'page' : undefined}
        aria-label={isHome ? 'Home' : undefined}
        onClick={onNavigate}
      >
        {isHome ? (
          <Home className="ss-pill-nav__icon" aria-hidden />
        ) : (
          <span>{item.label}</span>
        )}
      </Link>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`ss-pill-nav__drop${open ? ' is-open' : ''}${active ? ' is-active' : ''}`}
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <button
        type="button"
        className={`ss-pill-nav__item ss-pill-nav__item--drop${open || active ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          clearHoverTimeout();
          setOpen((v) => !v);
        }}
      >
        <span>{item.label}</span>
        <ChevronDown className="ss-pill-nav__chev" aria-hidden />
      </button>
      {open ? (
        <div className="ss-pill-nav__menu" role="menu">
          <div className="ss-pill-nav__menu-head">
            <span className="ss-pill-nav__menu-icon" aria-hidden>
              <Info className="w-4 h-4" />
            </span>
            <span>
              <span className="ss-pill-nav__menu-title">About</span>
              <span className="ss-pill-nav__menu-sub">Campus &amp; Brahma Kumaris</span>
            </span>
          </div>
          <div className="ss-pill-nav__menu-list">
            {item.children!.map((child) =>
              child.external ? (
                <a
                  key={child.href}
                  href={child.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  className="ss-pill-nav__menu-item"
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                >
                  {child.label}
                  <ExternalLink className="ss-pill-nav__ext" aria-hidden />
                </a>
              ) : (
                <Link
                  key={child.href}
                  href={child.href}
                  role="menuitem"
                  className="ss-pill-nav__menu-item"
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
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

export function SsHeader() {
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
        className="ss-header-wrap"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="ss-container">
          <header className="ss-pill-header">
            <div className="ss-pill-header__fx" aria-hidden>
              <BorderBeam
                size={90}
                duration={16}
                colorFrom="rgba(255,248,235,0.55)"
                colorTo="rgba(184,149,90,0.95)"
                borderWidth={1.5}
                transition={{ ease: 'linear' }}
              />
            </div>

            <div className="ss-pill-header__inner">
              <Link
                href={SS_HOME_HREF}
                className="ss-pill-header__brand"
                aria-label="Shanti Sarovar home"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SS_LOGO_URL}
                  alt="Brahma Kumaris Shanti Sarovar"
                  width={260}
                  height={66}
                  className="ss-pill-header__logo"
                  fetchPriority="high"
                />
              </Link>

              <nav className="ss-pill-nav" aria-label="Campus navigation">
                {SS_NAV.map((item) => (
                  <NavLink key={item.label} item={item} />
                ))}
              </nav>

              <div className="ss-pill-header__controls">
                <Link href={SS_CONTACT_HREF} className="ss-btn ss-btn--header ss-pill-header__cta-mobile">
                  Contact
                </Link>

                <button
                  type="button"
                  className="ss-pill-header__menu-btn"
                  onClick={() => setOpen(true)}
                  aria-label="Open menu"
                  aria-haspopup="dialog"
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </button>

                <span className="ss-pill-header__cta-desktop">
                  <Link href={SS_CONTACT_HREF} className="ss-btn ss-btn--header">
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    Contact
                  </Link>
                  <BorderBeam
                    size={30}
                    duration={9}
                    colorFrom="rgba(255,255,255,0.9)"
                    colorTo="rgba(184,149,90,0.55)"
                    borderWidth={1.5}
                    transition={{ ease: 'linear' }}
                  />
                </span>
              </div>
            </div>
          </header>
        </div>
      </div>

      <div className={`ss-sheet${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <button
          type="button"
          className="ss-sheet__backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
        <div className="ss-sheet__panel" role="dialog" aria-label="Campus menu">
          <div className="ss-sheet__top">
            <p className="ss-sheet__title">Shanti Sarovar</p>
            <button
              type="button"
              className="ss-sheet__close"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="ss-sheet__nav">
            {SS_NAV.map((item) => {
              if (item.children?.length) {
                return (
                  <div key={item.label} className="ss-sheet__group">
                    <button
                      type="button"
                      className="ss-sheet__link ss-sheet__link--toggle"
                      aria-expanded={aboutOpen}
                      onClick={() => setAboutOpen((v) => !v)}
                    >
                      {item.label}
                      <ChevronDown
                        className={`ss-sheet__chev${aboutOpen ? ' is-open' : ''}`}
                        aria-hidden
                      />
                    </button>
                    {aboutOpen ? (
                      <div className="ss-sheet__subnav">
                        {item.children.map((child) =>
                          child.external ? (
                            <a
                              key={child.href}
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ss-sheet__sublink"
                              onClick={() => setOpen(false)}
                            >
                              {child.label}
                              <ExternalLink className="w-3.5 h-3.5 opacity-50" aria-hidden />
                            </a>
                          ) : (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="ss-sheet__sublink"
                              onClick={() => setOpen(false)}
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
                  className="ss-sheet__link"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={SS_CONTACT_HREF}
              className="ss-sheet__link"
              onClick={() => setOpen(false)}
            >
              Contact
            </Link>
          </nav>
          <div className="ss-sheet__theme">
            <span className="ss-sheet__theme-label">Appearance</span>
            <ThemeToggle />
          </div>
          <Link
            href={SS_CONTACT_HREF}
            className="ss-btn ss-btn--primary ss-sheet__cta"
            onClick={() => setOpen(false)}
          >
            Enquire
          </Link>
          <a href="/centers" className="ss-sheet__sub" onClick={() => setOpen(false)}>
            Find a Center
          </a>
        </div>
      </div>
    </>
  );
}
