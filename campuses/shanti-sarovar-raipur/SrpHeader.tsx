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
  SRP_NAV,
  SRP_CONTACT_HREF,
  SRP_HOME_HREF,
  type SrpNavItem,
} from './nav';

/** Match UnifiedHeader hover feel. */
const HOVER_DELAY_IN = 80;
const HOVER_DELAY_OUT = 200;

function useSyncHeaderHeight(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    const root = document.querySelector<HTMLElement>('.srp-oasis');
    if (!el || !root) return;

    const update = () => {
      const pill = el.querySelector<HTMLElement>('.srp-pill-header');
      const wrapTop = el.getBoundingClientRect().top;
      const bottom = pill
        ? pill.getBoundingClientRect().bottom
        : el.getBoundingClientRect().bottom;
      root.style.setProperty('--srp-header-h', `${Math.ceil(bottom - wrapTop)}px`);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const pill = el.querySelector<HTMLElement>('.srp-pill-header');
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
  if (base === SRP_HOME_HREF) return pathname === SRP_HOME_HREF;
  return pathname === base || pathname.startsWith(`${base}/`);
}

function NavLink({
  item,
  onNavigate,
}: {
  item: SrpNavItem;
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
        className={`srp-pill-nav__item${isHome ? ' srp-pill-nav__item--icon' : ''}${
          active && !hashOnly ? ' is-active' : ''
        }`}
        aria-current={active && !hashOnly ? 'page' : undefined}
        aria-label={isHome ? 'Home' : undefined}
        onClick={onNavigate}
      >
        {isHome ? (
          <Home className="srp-pill-nav__icon" aria-hidden />
        ) : (
          <span>{item.label}</span>
        )}
      </Link>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`srp-pill-nav__drop${open ? ' is-open' : ''}${active ? ' is-active' : ''}`}
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <button
        type="button"
        className={`srp-pill-nav__item srp-pill-nav__item--drop${open || active ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          clearHoverTimeout();
          setOpen((v) => !v);
        }}
      >
        <span>{item.label}</span>
        <ChevronDown className="srp-pill-nav__chev" aria-hidden />
      </button>
      {open ? (
        <div className="srp-pill-nav__menu" role="menu">
          <div className="srp-pill-nav__menu-head">
            <span className="srp-pill-nav__menu-icon" aria-hidden>
              <Info className="w-4 h-4" />
            </span>
            <span>
              <span className="srp-pill-nav__menu-title">About</span>
            </span>
          </div>
          <div className="srp-pill-nav__menu-list">
            {item.children!.map((child) =>
              child.external ? (
                <a
                  key={child.href}
                  href={child.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  className="srp-pill-nav__menu-item"
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                >
                  {child.label}
                  <ExternalLink className="srp-pill-nav__ext" aria-hidden />
                </a>
              ) : (
                <Link
                  key={child.href}
                  href={child.href}
                  role="menuitem"
                  className="srp-pill-nav__menu-item"
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

export function SrpHeader({
  logoSrc,
  logoAlt = 'Shanti Sarovar, Raipur',
}: {
  logoSrc?: string | null;
  logoAlt?: string;
}) {
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
        className="srp-header-wrap"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="srp-container">
          <header className="srp-pill-header">
            <div className="srp-pill-header__fx" aria-hidden>
              <BorderBeam
                size={90}
                duration={16}
                colorFrom="rgba(255, 247, 239,0.55)"
                colorTo="rgba(242,198,109,0.95)"
                borderWidth={1.5}
                transition={{ ease: 'linear' }}
              />
            </div>

            <div className="srp-pill-header__inner">
              <Link
                href={SRP_HOME_HREF}
                className="srp-pill-header__brand"
                aria-label="Shanti Sarovar Raipur home"
              >
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt={logoAlt}
                    width={300}
                    height={100}
                    className="srp-pill-header__logo"
                    fetchPriority="high"
                  />
                ) : (
                  <span className="srp-wordmark">
                    <span className="srp-wordmark__mark" aria-hidden>
                      SS
                    </span>
                    <span className="srp-wordmark__text">
                      <strong>Shanti</strong>
                      <span>Sarovar</span>
                    </span>
                  </span>
                )}
              </Link>

              <nav className="srp-pill-nav" aria-label="Campus navigation">
                {SRP_NAV.map((item) => (
                  <NavLink key={item.label} item={item} />
                ))}
              </nav>

              <div className="srp-pill-header__controls">
                <Link href={SRP_CONTACT_HREF} className="srp-btn srp-btn--header srp-pill-header__cta-mobile">
                  Contact
                </Link>

                <button
                  type="button"
                  className="srp-pill-header__menu-btn"
                  onClick={() => setOpen(true)}
                  aria-label="Open menu"
                  aria-haspopup="dialog"
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </button>

                <span className="srp-pill-header__cta-desktop">
                  <Link href={SRP_CONTACT_HREF} className="srp-btn srp-btn--header">
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    Contact
                  </Link>
                  <BorderBeam
                    size={30}
                    duration={9}
                    colorFrom="rgba(255,255,255,0.9)"
                    colorTo="rgba(242,198,109,0.55)"
                    borderWidth={1.5}
                    transition={{ ease: 'linear' }}
                  />
                </span>
              </div>
            </div>
          </header>
        </div>
      </div>

      <div className={`srp-sheet${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <button
          type="button"
          className="srp-sheet__backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
        <div className="srp-sheet__panel" role="dialog" aria-label="Campus menu">
          <div className="srp-sheet__top">
            <p className="srp-sheet__title">Shanti Sarovar</p>
            <button
              type="button"
              className="srp-sheet__close"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="srp-sheet__nav">
            {SRP_NAV.map((item) => {
              if (item.children?.length) {
                return (
                  <div key={item.label} className="srp-sheet__group">
                    <button
                      type="button"
                      className="srp-sheet__link srp-sheet__link--toggle"
                      aria-expanded={aboutOpen}
                      onClick={() => setAboutOpen((v) => !v)}
                    >
                      {item.label}
                      <ChevronDown
                        className={`srp-sheet__chev${aboutOpen ? ' is-open' : ''}`}
                        aria-hidden
                      />
                    </button>
                    {aboutOpen ? (
                      <div className="srp-sheet__subnav">
                        {item.children.map((child) =>
                          child.external ? (
                            <a
                              key={child.href}
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="srp-sheet__sublink"
                              onClick={() => setOpen(false)}
                            >
                              {child.label}
                              <ExternalLink className="w-3.5 h-3.5 opacity-50" aria-hidden />
                            </a>
                          ) : (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="srp-sheet__sublink"
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
                  className="srp-sheet__link"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={SRP_CONTACT_HREF}
              className="srp-sheet__link"
              onClick={() => setOpen(false)}
            >
              Contact
            </Link>
          </nav>
          <div className="srp-sheet__theme">
            <span className="srp-sheet__theme-label">Appearance</span>
            <ThemeToggle />
          </div>
          <Link
            href={SRP_CONTACT_HREF}
            className="srp-btn srp-btn--primary srp-sheet__cta"
            onClick={() => setOpen(false)}
          >
            Enquire
          </Link>
          <a href="/centers" className="srp-sheet__sub" onClick={() => setOpen(false)}>
            Find a Center
          </a>
        </div>
      </div>
    </>
  );
}
