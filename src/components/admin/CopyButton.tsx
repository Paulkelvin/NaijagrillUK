"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
}

/**
 * A tap target of its own (not just relying on selecting truncated table
 * text) so a real keyword string can get out of this table and into
 * wherever the user actually wants to use it — Google, a content brief,
 * ChatGPT. `navigator.clipboard` needs a secure context, which is what
 * this app is deployed on (Vercel, https) — no fallback needed for that.
 */
export function CopyButton({ text, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied or unavailable — nothing to fall back
      // to that isn't worse than just leaving the button unresponsive.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : `${label} "${text}"`}
      title={copied ? "Copied!" : label}
      className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] p-1.5 text-white/50 transition hover:border-amber-300/40 hover:bg-white/10 hover:text-amber-200"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 013.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0121 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 017.5 16.125V3.375z" />
          <path d="M15 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0017.25 7.5h-1.875A.375.375 0 0115 7.125V5.25zM4.5 6A1.5 1.5 0 003 7.5v12A1.5 1.5 0 004.5 21h9a1.5 1.5 0 001.5-1.5V18h-6.75a3.375 3.375 0 01-3.375-3.375V6z" />
        </svg>
      )}
    </button>
  );
}
