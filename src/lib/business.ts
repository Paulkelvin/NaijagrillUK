export const BUSINESS = {
  name: "NaijaGrill",
  legalName: "Naija Grill UK",
  tagline: "Where Birmingham meets the hearth of Nigeria.",
  description:
    "Premium Nigerian cuisine in Handsworth, Birmingham. An editorial dining experience rooted in heritage, fire, and flavour.",
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
  website: process.env.NEXT_PUBLIC_SITE_URL ?? "https://naijagrillandspice.co.uk",
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
    rating: undefined as number | undefined,
    reviewCount: undefined as number | undefined,
    readReviewsUrl:
      "https://www.google.com/search?q=NaijaGrill%2077B%20Rookery%20Road%20reviews",
    leaveReviewUrl:
      "https://www.google.com/search?q=NaijaGrill%2077B%20Rookery%20Road%20leave%20a%20review",
  },
} as const;

export const formattedAddress = `${BUSINESS.address.street}, ${BUSINESS.address.area}, ${BUSINESS.address.city}, ${BUSINESS.address.postcode}, ${BUSINESS.address.country}`;

export const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formattedAddress)}`;

export const googleMapsEmbedQuery = encodeURIComponent(
  `${BUSINESS.name} ${formattedAddress}`,
);
