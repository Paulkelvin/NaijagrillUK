import type { NextConfig } from "next";

// Baseline security headers. Applied to every route.
//
// Deliberately NOT including a Content-Security-Policy: this site loads
// Google Analytics, Google Ads and Microsoft Clarity via next/script with
// *inline* init blocks (see src/components/analytics/Analytics.tsx), so any
// CSP strict enough to be worth having would need 'unsafe-inline' (which
// guts its value) or a nonce-based setup threaded through those scripts.
// That's a real change needing real browser verification, not a config
// one-liner — left out on purpose rather than shipped broken or shipped
// toothless. The headers below are the ones that are genuinely safe to add
// blind.
const securityHeaders = [
  // Force HTTPS for a year, including subdomains. Safe here: the site is
  // already HTTPS-only behind Vercel.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Clickjacking: stop the site being framed by anyone else.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop browsers guessing (and mis-executing) a response's content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the full URL to same-origin, only the origin cross-origin — so
  // outbound clicks (Uber Eats, WhatsApp) don't leak full paths.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing on this site uses these; deny them outright.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/studio/studio",
        destination: "/studio",
        permanent: false,
      },
      {
        source: "/studio/studio/:path*",
        destination: "/studio/:path*",
        permanent: false,
      },
      {
        source: "/private-dining",
        destination: "/events-catering",
        permanent: true,
      },
      {
        source: "/explore-nigerian-cuisine",
        destination: "/menu",
        permanent: true,
      },
      {
        // The old commercial-intent blog post was cannibalizing the
        // homepage for "nigerian restaurant birmingham"-type keywords —
        // same pitch, same intent, no differentiation (Milestone 16
        // cannibalization review). Rewritten in Sanity as a genuinely
        // different, informational article (jollof rice origin story) at
        // a new slug; this redirect carries over whatever the old URL had
        // rather than letting it 404.
        source: "/blog/best-nigerian-restaurant-in-handsworth-birmingham",
        destination: "/blog/jollof-rice-origin-story",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
