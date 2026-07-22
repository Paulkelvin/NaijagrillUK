import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
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
