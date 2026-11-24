"use client";

/*
 * Light / dark switch for the shared brahmakumaris.com pill header.
 * Keep this file identical across the apps that use the header
 * (wisdom, about/contact/initiatives, news, events, centers) so the
 * header looks and behaves the same on every site.
 *
 * The shared storage key and cross-subdomain cookie live in lib/theme-key.ts,
 * so a choice on one site carries to the others.
 */

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { writeThemeCookie } from "../../lib/theme-key";

type Mode = "light" | "dark";

// false on the server and during hydration, true after: no icon mismatch
function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useMode(onChange?: (mode: Mode) => void) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const mode: Mode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const set = (next: Mode) => {
    setTheme(next);
    onChange?.(next);
  };
  return { mode, mounted, set };
}

/** Desktop: icon button in the pill's controls, same size as its neighbours. */
export function HeaderThemeButton({ onChange }: { onChange?: (mode: Mode) => void }) {
  const { mode, mounted, set } = useMode(onChange);

  // Mirror whatever theme is showing (from any toggle) to the cross-subdomain cookie
  useEffect(() => {
    if (mounted) writeThemeCookie(mode);
  }, [mounted, mode]);
  const isDark = mode === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => set(isDark ? "light" : "dark")}
      title={label}
      aria-label={label}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-all duration-200 hover:bg-amber-50/60 hover:text-amber-600 dark:text-neutral-500 dark:hover:bg-amber-950/25 dark:hover:text-amber-300"
    >
      <Sun
        aria-hidden="true"
        className={`absolute h-4 w-4 transition-all duration-300 motion-reduce:transition-none ${
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
        }`}
      />
      <Moon
        aria-hidden="true"
        className={`absolute h-4 w-4 transition-all duration-300 motion-reduce:transition-none ${
          isDark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      />
    </button>
  );
}

/** Mobile drawer: first row of the menu, a two-option Light / Dark switch. */
export function DrawerThemeSwitch({ onChange }: { onChange?: (mode: Mode) => void }) {
  const { mode, mounted, set } = useMode(onChange);

  const option = (value: Mode, Icon: typeof Sun, text: string) => {
    const active = mounted && mode === value;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={active}
        onClick={() => set(value)}
        className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-all duration-200 ${
          active
            ? "bg-white text-neutral-900 shadow-sm ring-1 ring-black/5 dark:bg-neutral-700 dark:text-white dark:ring-white/10"
            : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {text}
      </button>
    );
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-1">
      <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
        Appearance
      </span>
      <div
        role="radiogroup"
        aria-label="Colour theme"
        className="flex items-center gap-0.5 rounded-full bg-neutral-100 p-0.5 dark:bg-neutral-800/80"
      >
        {option("light", Sun, "Light")}
        {option("dark", Moon, "Dark")}
      </div>
    </div>
  );
}
