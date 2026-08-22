"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

let lastSentPath = "";
let lastPageLocation = "";

function currentPagePath(): string {
  return window.location.pathname + window.location.search;
}

function sendPageView(gaId: string, pagePath: string) {
  if (pagePath === lastSentPath) return () => {};

  const payload = {
    send_to: gaId,
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
    page_referrer: lastPageLocation || document.referrer,
  };

  const attempt = () => {
    if (typeof window.gtag !== "function") return false;
    lastSentPath = pagePath;
    lastPageLocation = payload.page_location;
    window.gtag("event", "page_view", payload);
    return true;
  };

  if (attempt()) return () => {};

  const started = Date.now();
  const id = window.setInterval(() => {
    if (attempt() || Date.now() - started > 8000) window.clearInterval(id);
  }, 50);

  return () => window.clearInterval(id);
}

/**
 * GA4 for the whole App Router tree:
 * - skip `next dev` so local reloads do not pollute production reports
 * - load gtag once after hydration
 * - config with send_page_view: false (no automatic first hit)
 * - emit a page_view on every route, including the first
 * - pass page_referrer so SPA clicks still form a path in reports
 */
function PageViews({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelInterval: (() => void) | undefined;
    const timer = window.setTimeout(() => {
      cancelInterval = sendPageView(gaId, currentPagePath());
    }, 0);
    return () => {
      window.clearTimeout(timer);
      cancelInterval?.();
    };
  }, [pathname, searchParams, gaId]);

  return null;
}

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  if (!gaId || process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViews gaId={gaId} />
      </Suspense>
    </>
  );
}

export function gaEvent(
  action: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") window.gtag("event", action, params);
}

function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  const params: Record<string, string | number | boolean> = {
    event_category: category,
  };
  if (label !== undefined) params.event_label = label;
  if (value !== undefined) params.value = value;
  gaEvent(action, params);
}

/** Existing center-locator events — kept; no new click streams. */
export const CenterLocatorAnalytics = {
  searchCenters: (
    query: string,
    resultsCount: number,
    searchType: "text" | "location" = "text"
  ) => {
    trackEvent(
      "search_centers",
      "user_interaction",
      `${searchType}: ${query}`,
      resultsCount
    );
  },

  viewCenter: (center: {
    name?: string;
    state?: string;
    district?: string;
    branch_code?: string;
  }) => {
    const centerLabel = `${center.name || "Unknown"} - ${center.district}, ${center.state}`;
    trackEvent("view_center_details", "center_interaction", centerLabel);
  },

  getDirections: (center: {
    name?: string;
    state?: string;
    district?: string;
  }) => {
    const centerLabel = `${center.name || "Unknown"} - ${center.district}, ${center.state}`;
    trackEvent("get_directions", "center_interaction", centerLabel);
  },

  contactCenter: (center: {
    name?: string;
    state?: string;
    district?: string;
  }) => {
    const centerLabel = `${center.name || "Unknown"} - ${center.district}, ${center.state}`;
    trackEvent("contact_center", "center_interaction", centerLabel);
  },

  shareCenter: (
    center: { name?: string; state?: string; district?: string },
    method: string
  ) => {
    const centerLabel = `${center.name || "Unknown"} - ${center.district}, ${center.state}`;
    trackEvent(
      "share_center",
      "center_interaction",
      `${centerLabel} via ${method}`
    );
  },

  mapInteraction: (
    action:
      | "zoom_in"
      | "zoom_out"
      | "pan"
      | "marker_click"
      | "info_window_open"
      | "distance_start_point"
      | "distance_measured"
      | "distance_mode_on"
      | "distance_mode_off",
    centerName?: string
  ) => {
    trackEvent(
      "map_interaction",
      "map_usage",
      centerName ? `${action} - ${centerName}` : action
    );
  },

  useFilter: (
    filterType:
      | "region"
      | "state"
      | "district"
      | "sort"
      | "contact_type"
      | "distance",
    filterValue: string
  ) => {
    trackEvent("use_filter", "navigation", `${filterType}: ${filterValue}`);
  },

  locationPermission: (granted: boolean) => {
    trackEvent(
      "location_permission",
      "user_interaction",
      granted ? "granted" : "denied"
    );
  },

  retreatInteraction: (
    action: "view" | "contact" | "directions",
    centerName: string
  ) => {
    trackEvent(
      "retreat_center",
      "retreat_interaction",
      `${action} - ${centerName}`
    );
  },
};

export default GoogleAnalytics;
