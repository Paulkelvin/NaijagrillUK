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
