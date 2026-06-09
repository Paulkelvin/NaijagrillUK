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
  email: "hello@naijagrill.co.uk",
  phone: "+441212345678",
  website: process.env.NEXT_PUBLIC_SITE_URL ?? "https://naijagrill.co.uk",
  cuisine: "Nigerian",
  priceRange: "£££",
  social: {
    instagram: "https://instagram.com/naijagrill",
  },
} as const;

export const formattedAddress = `${BUSINESS.address.street}, ${BUSINESS.address.area}, ${BUSINESS.address.city}, ${BUSINESS.address.postcode}, ${BUSINESS.address.country}`;

export const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formattedAddress)}`;

export const googleMapsEmbedQuery = encodeURIComponent(
  `${BUSINESS.name} ${formattedAddress}`,
);
