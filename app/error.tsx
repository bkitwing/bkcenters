"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Copy, Check, Share2, RotateCw } from "lucide-react";

function buildReport(error: Error & { digest?: string }): string {
  const lines = [
    "BK Centers error report",
    "-----------------------",
    `Message: ${error.message || "(no message)"}`,
    error.name ? `Type: ${error.name}` : "",
    error.digest ? `Ref: ${error.digest}` : "",
    typeof window !== "undefined" ? `Page: ${window.location.href}` : "",
    typeof navigator !== "undefined" ? `Device: ${navigator.userAgent}` : "",
    `Time: ${new Date().toISOString()}`,
    error.stack ? `\nStack:\n${error.stack}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("[centers] client-side page error:", error);
    const isChunkError =
      error.name === "ChunkLoadError" ||
      /Loading chunk [\d]+ failed|dynamically imported module|Failed to fetch/i.test(error.message);
    if (isChunkError && typeof window !== "undefined") {
      const KEY = "centers-chunk-reloaded";
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, "1");
        window.location.reload();
        return;
      }
    }
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "exception", { description: `${error.name}: ${error.message}`, fatal: true, digest: error.digest });
    }
  }, [error]);

  const report = buildReport(error);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(report); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* visible */ }
  };
  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "BK Centers error", text: report }); } catch { /* cancelled */ }
    } else { handleCopy(); }
  };

  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
        <AlertTriangle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h1 className="mb-2 font-serif text-2xl font-bold">Something went wrong</h1>
      <p className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">The page hit an unexpected problem. You can try again, or copy the details below and send them to us so we can fix it.</p>
      <div className="mb-5 w-full rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 text-left dark:border-neutral-800 dark:bg-neutral-900/50">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Error details</p>
        <p className="break-words font-mono text-[13px] leading-relaxed text-neutral-900 dark:text-neutral-100">{error.message || "An unknown client-side error occurred."}</p>
        {error.digest && <p className="mt-2 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">Ref: {error.digest}</p>}
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <button onClick={() => reset()} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"><RotateCw className="h-4 w-4" />Try again</button>
        <button onClick={handleCopy} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800">{copied ? <><Check className="h-4 w-4 text-green-600" />Copied</> : <><Copy className="h-4 w-4" />Copy details</>}</button>
        <button onClick={handleShare} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"><Share2 className="h-4 w-4" />Share</button>
      </div>
    </div>
  );
}
