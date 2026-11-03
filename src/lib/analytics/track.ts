type ConversionName =
  | "phone_click"
  | "whatsapp_click"
  | "uber_eats_click"
  | "reservation_submit"
  | "contact_submit"
  | "event_inquiry_submit";

// Google Ads conversion labels (the part after the slash in "AW-123/abc").
// Read statically so Next can inline them at build time.
const ADS_LABELS: Record<ConversionName, string | undefined> = {
  phone_click: process.env.NEXT_PUBLIC_GADS_LABEL_PHONE,
  whatsapp_click: process.env.NEXT_PUBLIC_GADS_LABEL_WHATSAPP,
  uber_eats_click: process.env.NEXT_PUBLIC_GADS_LABEL_UBER_EATS,
  reservation_submit: process.env.NEXT_PUBLIC_GADS_LABEL_RESERVATION,
  contact_submit: process.env.NEXT_PUBLIC_GADS_LABEL_CONTACT,
  event_inquiry_submit: process.env.NEXT_PUBLIC_GADS_LABEL_EVENT_INQUIRY,
};

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

type GtagFn = (
  command: "event",
  eventName: string,
  params?: Record<string, string | number | boolean>,
) => void;

/** Fires the Google Ads conversion for `name`, if its label is configured. */
export function trackAdsConversion(name: ConversionName) {
  const label = ADS_LABELS[name];
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (!gtag || !ADS_ID || !label) return;
  gtag("event", "conversion", { send_to: `${ADS_ID}/${label}` });
}

/** Fires a GA4 event plus the matching Google Ads conversion. */
export function trackEvent(name: ConversionName) {
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  gtag?.("event", name);
  trackAdsConversion(name);
}
