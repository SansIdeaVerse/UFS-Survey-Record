// Clipboard helper with a textarea fallback for older / restricted contexts.

/**
 * Copy `text` to the clipboard. Returns true on success.
 * Uses the async Clipboard API when available, falls back to a hidden
 * textarea + document.execCommand("copy") for iOS Safari and other
 * environments where the Clipboard API is blocked.
 */
export async function copyText(text: string): Promise<boolean> {
  // Preferred: async Clipboard API (requires a secure context).
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy method
  }

  // Fallback: hidden textarea + execCommand.
  try {
    if (typeof document === "undefined") return false;
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length); // iOS Safari
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
