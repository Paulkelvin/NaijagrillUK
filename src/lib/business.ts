// Canonical host is the www subdomain (the bare apex 308-redirects to it), so
// force www on every absolute URL — canonical tags, og:image, JSON-LD — to
// avoid redirects that can stop Facebook/social scrapers fetching the image.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.naijagrillandspice.co.uk"
).replace(/^https:\/\/naijagrillandspice\.co\.uk/, "https://www.naijagrillandspice.co.uk");

export const BUSINESS = {
  name: "NaijaGrill",
  legalName: "Naija Grill & Spice Kitchen",
  alternateNames: [
    "NaijaGrill",
    "Naija Grill",
    "Naija Grill and Spice",
    "Naija Grill and Spice Kitchen",
    "Naija Grill & Spice",
    "NaijaGrill and Spice Kitchen",
    "naijagrillandspice",
    "Naija Grill Birmingham",
    "Naija Grill Handsworth",
  ],
  tagline: "Where Birmingham meets the hearth of Nigeria.",
  description:
    "Authentic Nigerian and West African restaurant in Handsworth, Birmingham, serving jollof rice, suya, pepper soup, grilled fish, and small chops for dine-in, takeaway, and delivery.",
  address: {
    street: "77B Rookery Road",
    area: "Handsworth",
    city: "Birmingham",
    postcode: "B21 9QU",
    country: "United Kingdom",
    countryCode: "GB",
  },
  geo: {
    latitude: 52.5124,
    longitude: -1.9342,
  },
  email: "quayumm2008@yahoo.co.uk",
  // E.164 for tel: links and structured data
  phone: "+447438757560",
  // Human-friendly UK national format for display
  phoneDisplay: "07438 757560",
  // Landline (Birmingham) — E.164 and UK national display
  landline: "+441212160249",
  landlineDisplay: "0121 216 0249",
  // WhatsApp — same number as mobile, E.164 without leading +
  whatsappUrl: "https://wa.me/447438757560?text=Hi%20NaijaGrill%2C%20I%27d%20like%20to%20make%20an%20enquiry.",
  website: SITE_URL,
  cuisine: "Nigerian",
  priceRange: "£££",
  social: {
    instagram: "https://www.instagram.com/naijagrill_2025/",
  },
  order: {
    uberEatsUrl:
      "https://www.ubereats.com/store-browse-uuid/ed5cf926-4f43-460d-960b-135912d864fb?diningMode=DELIVERY",
  },
  reviews: {
    provider: "Google",
    rating: 5.0 as number | undefined,
    reviewCount: 4 as number | undefined,
    profileUrl: "https://share.google/95Cf3n8hOcPSL4U4G",
    readReviewsUrl:
      "https://share.google/95Cf3n8hOcPSL4U4G",
    leaveReviewUrl:
      "https://www.google.com/search?q=NaijaGrill%2077B%20Rookery%20Road%20leave%20a%20review",
  },
} as const;

export const formattedAddress = `${BUSINESS.address.street}, ${BUSINESS.address.area}, ${BUSINESS.address.city}, ${BUSINESS.address.postcode}, ${BUSINESS.address.country}`;

export const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formattedAddress)}`;

export const googleMapsEmbedQuery = encodeURIComponent(
  `${BUSINESS.name} ${formattedAddress}`,
);
