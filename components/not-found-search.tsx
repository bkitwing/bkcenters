"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { NAVIGATION } from "@/components/unified-header/navigation-config";

interface SearchEntry {
  href: string;
  label: string;
  group: string;
}

function addEntry(map: Map<string, SearchEntry>, href: string, label: string, group: string) {
  const key = href.trim();
  if (!key || map.has(key)) return;
  map.set(key, { href: key, label, group });
}

function buildSearchIndex(): SearchEntry[] {
  const map = new Map<string, SearchEntry>();
  for (const section of NAVIGATION) {
    addEntry(map, section.href, section.label, "Menu");
    for (const item of section.subItems) {
      addEntry(map, item.href, item.label, section.label);
      for (const child of item.children ?? []) {
        addEntry(map, child.href, child.label, section.label);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

const SEARCH_INDEX = buildSearchIndex();

function matchesQuery(entry: SearchEntry, q: string): boolean {
  const hay = `${entry.label} ${entry.group} ${entry.href}`.toLowerCase();
  return q.split(/\s+/).filter(Boolean).every((token) => hay.includes(token));
}

export function NotFoundSearch() {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const results = useMemo(() => {
    if (!deferredQuery) return [];
    return SEARCH_INDEX.filter((entry) => matchesQuery(entry, deferredQuery)).slice(0, 8);
  }, [deferredQuery]);

  return (
    <div className="mx-auto mt-6 w-full max-w-lg text-left">
      <label htmlFor={inputId} className="sr-only">Search pages from the site menu</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a page…"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          className="w-full rounded-full border border-neutral-200 bg-white/70 py-3 pl-10 pr-4 text-sm font-medium text-neutral-900 shadow-sm outline-none backdrop-blur-xl placeholder:text-neutral-400 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-100"
        />
      </div>
      {deferredQuery ? (
        <ul id={listId} role="listbox" aria-label="Search results" className="mt-2 max-h-60 overflow-auto rounded-2xl border border-neutral-200 bg-white/95 p-1.5 shadow-lg backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
          {results.length === 0 ? (
            <li className="px-3 py-3 text-center text-sm text-neutral-500 dark:text-neutral-400">No matching pages. Try “centers”, “meditation”, or “events”.</li>
          ) : (
            results.map((entry) => (
              <li key={entry.href} role="option" aria-selected={false}>
                <a href={entry.href} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-emerald-50 focus-visible:bg-emerald-50 focus-visible:outline-none dark:hover:bg-emerald-950/30 dark:focus-visible:bg-emerald-950/30">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-neutral-900 dark:text-neutral-100">{entry.label}</span>
                    <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">{entry.group} · {entry.href}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
                </a>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
