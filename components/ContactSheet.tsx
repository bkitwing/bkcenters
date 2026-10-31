'use client';

import { ReactNode, useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Mail, MessageCircle, MessageSquareText, Phone, Share2, X } from 'lucide-react';
import { CenterLocatorAnalytics } from './GoogleAnalytics';
import { phoneKind, phoneToTel } from '@/lib/phone';
import { copyText } from '@/lib/copyText';

/**
 * Phone, email and share actions that work everywhere: browsers, desktops and
 * in-app browsers (WhatsApp, Instagram, Facebook, app webviews) that often
 * ignore tel:/mailto: links.
 *
 * A number or address opens a small sheet with:
 *   - the real tel:/mailto: link, tapped by the visitor (webviews honour a real
 *     tap on a link far more often than navigation started from script)
 *   - Copy, which always works, so nobody is left stuck
 *   - for email: Gmail on the web and, on center pages, the question form
 * The triggers are real links too, so they still dial/mail before the page's
 * JavaScript has loaded.
 */

/** Center fields used for analytics labels (kept small: passed from server pages) */
export interface ContactCenterInfo {
  name?: string;
  state?: string;
  district?: string;
}

export type ContactAnalyticsType = 'contact' | 'retreat';

function trackContact(center?: ContactCenterInfo, analyticsType: ContactAnalyticsType = 'contact') {
  if (!center) return;
  if (analyticsType === 'retreat') {
    CenterLocatorAnalytics.retreatInteraction('contact', center.name || 'Unknown');
  } else {
    CenterLocatorAnalytics.contactCenter(center);
  }
}

/** Plain left clicks open the sheet; modified clicks keep the browser's own behaviour */
function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/** Phone or tablet (iPadOS reports itself as a Mac, so touch points tell) */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  );
}

const primaryActionClass =
  'inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-spirit-purple-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-spirit-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spirit-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800 transition-colors';
const secondaryActionClass =
  'inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 text-sm font-semibold text-neutral-800 dark:text-neutral-100 hover:border-spirit-purple-300 hover:text-spirit-purple-700 dark:hover:text-spirit-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spirit-purple-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800 transition-colors';

// ---------------------------------------------------------------------------
// Sheet shell — bottom sheet on phones, centered card on larger screens
// ---------------------------------------------------------------------------

interface ContactSheetProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  /** Short help line under the options */
  hint?: string;
  onClose: () => void;
  children: ReactNode;
}

export function ContactSheet({ title, subtitle, icon, hint, onClose, children }: ContactSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      // No scroll: a link inside the sheet may have just moved the page (e.g. #contact)
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, []);

  return createPortal(
    // React events bubble out of portals to the trigger's parents (often a
    // clickable card), so stop them here
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-md overflow-hidden rounded-t-2xl md:rounded-2xl bg-white dark:bg-neutral-800 shadow-2xl outline-none animate-slide-up md:animate-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600 md:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3 px-5 pt-4 md:pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spirit-purple-100 text-spirit-purple-700 dark:bg-spirit-purple-900/40 dark:text-spirit-purple-300" aria-hidden>
              {icon}
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
                {title}
              </h2>
              {subtitle && <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-5 pb-5 pt-4">
          {children}
          {hint && <p className="mt-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{hint}</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Copy button with a visible (and announced) result
// ---------------------------------------------------------------------------

function CopyButton({
  value,
  what,
  label = 'Copy',
  onCopied,
}: {
  value: string;
  /** Read out after the label for screen readers, e.g. "number" */
  what?: string;
  label?: string;
  onCopied?: () => void;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), 2500);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <button
      type="button"
      onClick={async () => {
        const copied = await copyText(value);
        setState(copied ? 'copied' : 'failed');
        if (copied) onCopied?.();
      }}
      className={secondaryActionClass}
    >
      {state === 'copied' ? <Check className="h-4 w-4 text-green-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      <span aria-live="polite">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Press & hold to copy' : label}
      </span>
      {what && <span className="sr-only"> {what}</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sheet contents
// ---------------------------------------------------------------------------

export const PHONE_HINT = "If calling doesn't open (some in-app browsers block it), copy the number and dial it.";

export function PhoneOptions({
  numbers,
  region,
  center,
  analyticsType,
}: {
  numbers: string[];
  region?: string | null;
  center?: ContactCenterInfo;
  analyticsType?: ContactAnalyticsType;
}) {
  const track = () => trackContact(center, analyticsType);
  return (
    <ul className="space-y-2.5">
      {numbers.map((number) => {
        const tel = phoneToTel(number, region);
        const kind = phoneKind(number, region);
        return (
          <li
            key={number}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/40 p-3"
          >
            <div className="min-w-0">
              <p className="select-all text-base font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{number}</p>
              {kind && <p className="text-xs text-neutral-500 dark:text-neutral-400">{kind}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* Copy the exact number the Call button dials */}
              <CopyButton value={tel.slice('tel:'.length)} what="number" onCopied={track} />
              <a href={tel} onClick={track} className={primaryActionClass}>
                <Phone className="h-4 w-4" aria-hidden />
                Call
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function EmailOptions({
  email,
  formHref,
  onFormLink,
  center,
  analyticsType,
}: {
  email: string;
  /** In-page question form (e.g. "#contact") — works without any email app */
  formHref?: string;
  onFormLink?: () => void;
  center?: ContactCenterInfo;
  analyticsType?: ContactAnalyticsType;
}) {
  const track = () => trackContact(center, analyticsType);
  // Phones open their mail app (often Gmail) from mailto:, while the Gmail
  // website asks them to sign in again in the browser. Desktops often have no
  // mail app set up, so they get Gmail on the web instead.
  const [mobile] = useState(isMobileDevice);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
  return (
    <div className="space-y-3">
      <p className="select-all break-all rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/40 p-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {email}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {mobile ? (
          <a href={`mailto:${email}`} onClick={track} className={`${primaryActionClass} whitespace-nowrap`}>
            <Mail className="h-4 w-4" aria-hidden />
            Email app
          </a>
        ) : (
          <a href={gmailUrl} target="_blank" rel="noopener noreferrer" onClick={track} className={`${primaryActionClass} whitespace-nowrap`}>
            <Mail className="h-4 w-4" aria-hidden />
            Open Gmail
          </a>
        )}
        <CopyButton value={email} what="email address" onCopied={track} />
      </div>
      <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        {mobile
          ? "If your email app doesn't open, copy the address."
          : 'Gmail opens in a new tab. Using another email service? Copy the address.'}
      </p>
      {formHref && (
        <a
          href={formHref}
          onClick={() => {
            onFormLink?.();
            // Same hash already in the URL: no hashchange fires, so announce it
            if (formHref.startsWith('#') && window.location.hash === formHref) {
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            }
          }}
          className="flex items-center gap-3 rounded-xl border border-dashed border-spirit-purple-300 dark:border-spirit-purple-700 p-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-spirit-purple-50 dark:hover:bg-neutral-700/50 transition-colors"
        >
          <MessageSquareText className="h-5 w-5 shrink-0 text-spirit-purple-600 dark:text-spirit-purple-400" aria-hidden />
          <span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">Or write to us on this page</span>
            <span className="block text-xs text-neutral-500 dark:text-neutral-400">No email app needed — we&apos;ll pass your message to the center.</span>
          </span>
        </a>
      )}
    </div>
  );
}

/**
 * Share: WhatsApp or Copy message, with a preview of exactly what will be sent.
 * WhatsApp goes through api.whatsapp.com/send: the wa.me short link's redirect
 * turns emoji into "�", which also made WhatsApp send only the link.
 */
export function ShareOptions({
  message,
  onShared,
}: {
  message: string;
  /** Called with how it was shared, for analytics */
  onShared?: (method: 'whatsapp' | 'copy-message') => void;
}) {
  return (
    <div className="space-y-3">
      <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/40 p-3 font-sans text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 select-all">
        {message}
      </pre>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onShared?.('whatsapp')}
          className={primaryActionClass}
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          WhatsApp
        </a>
        <CopyButton value={message} label="Copy message" onCopied={() => onShared?.('copy-message')} />
      </div>
    </div>
  );
}

/** Share sheet: preview + WhatsApp + Copy message, used by every Share button */
export function ShareSheet({
  title = 'Share',
  subtitle,
  message,
  onShared,
  onClose,
}: {
  title?: string;
  subtitle?: string;
  message: string;
  onShared?: (method: 'whatsapp' | 'copy-message') => void;
  onClose: () => void;
}) {
  return (
    <ContactSheet
      title={title}
      subtitle={subtitle}
      icon={<Share2 className="h-5 w-5" />}
      hint="Copy message works in every app — paste it wherever you like."
      onClose={onClose}
    >
      <ShareOptions message={message} onShared={onShared} />
    </ContactSheet>
  );
}

// ---------------------------------------------------------------------------
// Link triggers: a real tel:/mailto: link that opens the sheet when clicked
// ---------------------------------------------------------------------------

interface PhoneLinkProps {
  number: string;
  region?: string | null;
  center?: ContactCenterInfo;
  analyticsType?: ContactAnalyticsType;
  className?: string;
  children: ReactNode;
}

export function PhoneLink({ number, region, center, analyticsType, className, children }: PhoneLinkProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a
        href={phoneToTel(number, region)}
        aria-haspopup="dialog"
        className={className}
        onClick={(event) => {
          if (!isPlainClick(event)) return;
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </a>
      {open && (
        <ContactSheet
          title="Call the center"
          subtitle={center?.name}
          icon={<Phone className="h-5 w-5" />}
          hint={PHONE_HINT}
          onClose={() => setOpen(false)}
        >
          <PhoneOptions numbers={[number]} region={region} center={center} analyticsType={analyticsType} />
        </ContactSheet>
      )}
    </>
  );
}

interface EmailLinkProps {
  email: string;
  formHref?: string;
  center?: ContactCenterInfo;
  analyticsType?: ContactAnalyticsType;
  className?: string;
  children: ReactNode;
}

export function EmailLink({ email, formHref, center, analyticsType, className, children }: EmailLinkProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a
        href={`mailto:${email}`}
        aria-haspopup="dialog"
        className={className}
        onClick={(event) => {
          if (!isPlainClick(event)) return;
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </a>
      {open && (
        <ContactSheet
          title="Email the center"
          subtitle={center?.name}
          icon={<Mail className="h-5 w-5" />}
          onClose={() => setOpen(false)}
        >
          <EmailOptions
            email={email}
            formHref={formHref}
            onFormLink={() => setOpen(false)}
            center={center}
            analyticsType={analyticsType}
          />
        </ContactSheet>
      )}
    </>
  );
}
