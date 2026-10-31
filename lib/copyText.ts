/**
 * Copy text to the clipboard. Uses the Clipboard API where allowed and falls
 * back to a hidden textarea + execCommand, which still works in many in-app
 * browsers (webviews) and non-HTTPS pages that block the Clipboard API.
 * Resolves to false if neither works, so the caller can say so.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Blocked (permissions policy, webview) — try the fallback below
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length); // iOS needs an explicit range
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
}
