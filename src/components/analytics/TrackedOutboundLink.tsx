"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

type Gtag = (
  command: "event",
  eventName: string,
  params?: Record<string, string | number | boolean>,
) => void;

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

type TrackedOutboundLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "target" | "rel" | "onClick"
> & {
  href: string;
  eventName: string;
  eventLabel: string;
  children: ReactNode;
};

export function TrackedOutboundLink({
  href,
  eventName,
  eventLabel,
  children,
  ...props
}: TrackedOutboundLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      data-analytics={eventName}
      data-analytics-label={eventLabel}
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent("naijagrill:outbound-click", {
            detail: { eventName, eventLabel, href },
          }),
        );
        window.gtag?.("event", eventName, {
          event_category: "outbound",
          event_label: eventLabel,
          link_url: href,
        });
      }}
      {...props}
    >
      {children}
    </a>
  );
}
