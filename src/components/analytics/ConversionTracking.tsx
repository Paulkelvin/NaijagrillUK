"use client";

import { useEffect } from "react";
import { trackAdsConversion, trackEvent } from "@/lib/analytics/track";

const BUSINESS_WHATSAPP = "wa.me/447438757560";

export function ConversionTracking() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";

      if (href.startsWith("tel:")) {
        trackEvent("phone_click");
      } else if (href.includes(BUSINESS_WHATSAPP)) {
        trackEvent("whatsapp_click");
      } else if (anchor.dataset.analytics === "uber_eats_click") {
        // TrackedOutboundLink already sends the GA event; only add the Ads conversion.
        trackAdsConversion("uber_eats_click");
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
