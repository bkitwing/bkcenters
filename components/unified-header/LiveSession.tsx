/*
 * Soul Sustenance LIVE (the monthly online conversation) in the shared
 * brahmakumaris.com header: a pulsing LIVE marker for menu items, a pill for
 * desktop menus and a card for the mobile drawer. No dates: it simply invites
 * people to the monthly session on Zoom, so there is nothing to go out of date.
 * Keep this file identical across the apps that use the header.
 */

import { ArrowRight, Radio } from "lucide-react";

export const SS_LIVE_HREF = "/wisdom/soul-sustenance/live";

/** Red dot with a soft ring pulsing out of it. */
export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-flex h-2 w-2 shrink-0 ${className}`} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60 motion-reduce:animate-none" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
    </span>
  );
}

/** Compact pill for desktop menus: "● LIVE · Monthly on Zoom". */
export function LiveSessionPill() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-[12px] font-semibold text-neutral-800 shadow-sm ring-1 ring-rose-500/20 transition-colors hover:bg-white dark:bg-neutral-800/85 dark:text-neutral-100 dark:ring-rose-400/25">
      <LiveDot />
      <span className="text-red-600 dark:text-red-400">LIVE</span>
      <span className="font-medium text-neutral-500 dark:text-neutral-400">Monthly on Zoom</span>
      <ArrowRight className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
    </span>
  );
}

/** Card for the mobile drawer (and anywhere a fuller invitation fits). */
export function LiveSessionCard() {
  return (
    <span className="flex items-center gap-3.5 rounded-2xl bg-gradient-to-r from-rose-500/12 via-orange-400/10 to-amber-400/12 p-3.5 ring-1 ring-rose-500/15 dark:from-rose-500/20 dark:via-orange-400/12 dark:to-amber-400/15 dark:ring-rose-400/20">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm dark:bg-neutral-800 dark:text-rose-300">
        <Radio className="h-5 w-5" aria-hidden="true" />
        <LiveDot className="absolute -right-0.5 -top-0.5" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-red-500 px-1.5 py-px text-[10px] font-bold tracking-wider text-white">LIVE</span>
          <span className="text-[15px] font-semibold leading-tight text-neutral-900 dark:text-neutral-100">Soul Sustenance LIVE</span>
        </span>
        <span className="mt-0.5 block text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
          Monthly conversation on Zoom · Hindi & English
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
    </span>
  );
}
