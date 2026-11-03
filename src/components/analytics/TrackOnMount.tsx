"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

type TrackOnMountProps = {
  event: "reservation_submit" | "contact_submit" | "event_inquiry_submit";
};

export function TrackOnMount({ event }: TrackOnMountProps) {
  useEffect(() => {
    trackEvent(event);
  }, [event]);

  return null;
}
