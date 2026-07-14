"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin, Sparkles, Flower2 } from "lucide-react";
import { NotFoundSearch } from "@/components/not-found-search";

const PRIMARY_DESTINATIONS = [
  { href: "/", label: "Find a Center", icon: MapPin, primary: true, internal: true },
  { href: "/wisdom/soul-sustenance", label: "Soul Sustenance", icon: Sparkles },
  { href: "/meditation", label: "Rajyoga Meditation", icon: Flower2 },
];

const SECTION_LINKS = [
  { href: "/india", label: "All States" },
  { href: "/retreat", label: "HQ Campuses" },
];

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-neutral-50 via-emerald-50/30 to-neutral-50 px-4 pb-12 pt-8 dark:from-neutral-950 dark:via-emerald-950/10 dark:to-neutral-950 md:pt-12">
      <div className="pointer-events-none absolute -left-24 top-0 -z-10 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />
      <div className="pointer-events-none absolute -right-24 top-24 -z-10 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/10" />

      <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white/70 p-5 text-center shadow-xl shadow-emerald-900/10 backdrop-blur-2xl dark:border-neutral-800 dark:bg-neutral-900/60 md:p-8">
        <div className="mb-4 flex justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-400/20">
            <MapPin className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <p className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text font-serif text-5xl font-bold leading-none text-transparent md:text-6xl">404</p>
        <h1 className="mt-3 font-serif text-xl font-bold text-neutral-900 dark:text-neutral-100 md:text-2xl">Not what you were looking for?</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400 md:text-[15px] md:leading-7">
          You may have taken a wrong turn. Don&apos;t worry — search below or pick a path back to centers.
        </p>

        <NotFoundSearch />

        <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row sm:flex-wrap">
          {PRIMARY_DESTINATIONS.map(({ href, label, icon: Icon, primary, internal }) => {
            const className = primary
              ? "group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              : "inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white/50 px-5 py-2.5 text-sm font-bold text-neutral-900 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-100 dark:hover:bg-neutral-800";
            if (internal) {
              return (
                <Link key={href} href={href} className={className}>
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </Link>
              );
            }
            return (
              <a key={href} href={href} className={className}>
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </a>
            );
          })}
        </div>

        <div className="mt-6 border-t border-neutral-200/70 pt-4 dark:border-neutral-800/70">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">In this section</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SECTION_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="group inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/50 px-3.5 py-1.5 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-100 dark:hover:bg-neutral-800">
                {item.label}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400">
            <ArrowLeft className="h-4 w-4" />
            Go back to previous page
          </button>
        </div>
      </div>
    </div>
  );
}
