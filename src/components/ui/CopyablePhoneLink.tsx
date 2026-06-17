"use client";

import { useState } from "react";

type Props = {
  phone: string;
  href: string;
  linkClassName?: string;
};

export function CopyablePhoneLink({ phone, href, linkClassName = "" }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(phone).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <a href={href} className={linkClassName}>
        {phone}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? "Copied!" : "Copy number"}
        aria-label={copied ? "Copied!" : "Copy phone number"}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded opacity-50 transition-opacity hover:opacity-100"
      >
        {copied ? (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
            <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
            <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z" />
          </svg>
        )}
      </button>
    </span>
  );
}
