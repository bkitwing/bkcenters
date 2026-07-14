"use client";

import { useEffect, useState } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    console.error("[centers] global client-side error:", error);
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "exception", { description: `[global] ${error.name}: ${error.message}`, fatal: true, digest: error.digest });
    }
  }, [error]);

  const report = [
    "BK Centers error report",
    `Message: ${error.message || "(no message)"}`,
    error.digest ? `Ref: ${error.digest}` : "",
    typeof window !== "undefined" ? `Page: ${window.location.href}` : "",
    typeof navigator !== "undefined" ? `Device: ${navigator.userAgent}` : "",
    `Time: ${new Date().toISOString()}`,
    error.stack ? `\nStack:\n${error.stack}` : "",
  ].filter(Boolean).join("\n");

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(report); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  const btn: React.CSSProperties = { borderRadius: "9999px", padding: "0.6rem 1.25rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", border: "1px solid #d4d4d4", background: "transparent" };

  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", margin: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", textAlign: "center", fontFamily: "system-ui, sans-serif", color: "#1a1a1a", background: "#fafafa" }}>
        <div style={{ maxWidth: "32rem", width: "100%" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ color: "#666", marginBottom: "1.25rem", fontSize: "0.9rem" }}>The app hit an unexpected problem. You can try again, or copy the details below and send them to us.</p>
          <div style={{ textAlign: "left", background: "#f0f0f0", border: "1px solid #e0e0e0", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.25rem" }}>
            <p style={{ margin: 0, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#888", marginBottom: "0.35rem" }}>Error details</p>
            <p style={{ margin: 0, fontFamily: "ui-monospace, monospace", fontSize: "0.8rem", wordBreak: "break-word", lineHeight: 1.5 }}>{error.message || "An unknown client-side error occurred."}</p>
            {error.digest && <p style={{ margin: "0.5rem 0 0", fontFamily: "ui-monospace, monospace", fontSize: "0.7rem", color: "#888" }}>Ref: {error.digest}</p>}
          </div>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => reset()} style={{ ...btn, background: "#059669", color: "#fff", border: "none" }}>Try again</button>
            <button onClick={handleCopy} style={btn}>{copied ? "Copied" : "Copy details"}</button>
            <button onClick={() => { if (typeof window !== "undefined") window.location.reload(); }} style={btn}>Reload page</button>
          </div>
        </div>
      </body>
    </html>
  );
}
