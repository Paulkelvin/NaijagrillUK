import { BUSINESS, formattedAddress } from "@/lib/business";
import type { BlogPostData, EventData, FaqItem } from "@/sanity/types";

export type OpeningHoursSpecification = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string;
  opens: string;
  closes: string;
};

function sameAsLinks() {
  return [
    BUSINESS.social.instagram,
    BUSINESS.reviews.readReviewsUrl,
  ].filter(Boolean);
}

function aggregateRating() {
  const { rating, reviewCount } = BUSINESS.reviews;
  if (typeof rating !== "number" || typeof reviewCount !== "number") {
    return undefined;
  }

  return {
    "@type": "AggregateRating",
    ratingValue: rating,
    reviewCount,
    bestRating: 5,
    worstRating: 1,
  };
}

function commonRestaurantFields(openingHours?: OpeningHoursSpecification[]) {
  return {
    sameAs: sameAsLinks(),
    hasMenu: `${BUSINESS.website}/menu`,
    potentialAction: [
      {
        "@type": "OrderAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: BUSINESS.order.uberEatsUrl,
          actionPlatform: [
            "https://schema.org/DesktopWebPlatform",
            "https://schema.org/MobileWebPlatform",
          ],
        },
      },
      {
        "@type": "ReserveAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BUSINESS.website}/reservations`,
          actionPlatform: [
            "https://schema.org/DesktopWebPlatform",
            "https://schema.org/MobileWebPlatform",
          ],
        },
      },
    ],
    ...(openingHours?.length ? { openingHoursSpecification: openingHours } : {}),
    ...(aggregateRating() ? { aggregateRating: aggregateRating() } : {}),
  };
}

export function restaurantSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: BUSINESS.name,
    description: BUSINESS.description,
    image: `${BUSINESS.website}/opengraph-image`,
    url: BUSINESS.website,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    priceRange: BUSINESS.priceRange,
    servesCuisine: BUSINESS.cuisine,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.street,
      addressLocality: BUSINESS.address.city,
      addressRegion: "West Midlands",
      postalCode: BUSINESS.address.postcode,
      addressCountry: BUSINESS.address.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    },
    areaServed: {
      "@type": "City",
      name: "Birmingham",
    },
    ...commonRestaurantFields(),
  };
}

export function localBusinessSchema(openingHours?: OpeningHoursSpecification[]) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${BUSINESS.website}/#localbusiness`,
    name: BUSINESS.name,
    description: BUSINESS.description,
    url: BUSINESS.website,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    image: `${BUSINESS.website}/opengraph-image`,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.street,
      addressLocality: BUSINESS.address.area,
      addressRegion: "West Midlands",
      postalCode: BUSINESS.address.postcode,
      addressCountry: BUSINESS.address.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    },
    ...commonRestaurantFields(openingHours),
  };
}

export function cateringServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "NaijaGrill Nigerian catering",
    description:
      "Nigerian catering for weddings, engagements, naming ceremonies, corporate trays, family celebrations, and community events in Birmingham.",
    serviceType: "Nigerian catering",
    provider: {
      "@type": "Restaurant",
      name: BUSINESS.name,
      url: BUSINESS.website,
      telephone: BUSINESS.phone,
      address: formattedAddress,
    },
    areaServed: {
      "@type": "City",
      name: "Birmingham",
    },
    url: `${BUSINESS.website}/events-catering`,
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BUSINESS.website}${item.path}`,
    })),
  };
}

export function articleSchema(post: BlogPostData, imageUrl?: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: {
      "@type": "Person",
      name: post.author,
    },
    datePublished: post.publishedAt,
    image: imageUrl ?? `${BUSINESS.website}/opengraph-image`,
    publisher: {
      "@type": "Organization",
      name: BUSINESS.legalName,
      logo: {
        "@type": "ImageObject",
        url: `${BUSINESS.website}/opengraph-image`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BUSINESS.website}/blog/${post.slug}`,
    },
  };
}

export function faqSchema(faqs: FaqItem[]) {
  if (!faqs.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function eventSchema(event: EventData, imageUrl?: string | null) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.excerpt,
    startDate: event.eventDate,
    location: {
      "@type": "Place",
      name: event.location || BUSINESS.name,
      address: formattedAddress,
    },
    image: imageUrl ?? `${BUSINESS.website}/opengraph-image`,
    organizer: {
      "@type": "Organization",
      name: BUSINESS.legalName,
      url: BUSINESS.website,
    },
  };
}

