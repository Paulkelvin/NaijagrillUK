import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/business";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio", "/api/", "/admin"],
      },
      {
        // Social link-preview crawlers — explicitly welcomed so shared links
        // (Facebook, WhatsApp, X, LinkedIn, etc.) render a rich card.
        userAgent: [
          "facebookexternalhit",
          "facebookcatalog",
          "Twitterbot",
          "LinkedInBot",
          "WhatsApp",
          "TelegramBot",
          "Slackbot-LinkExpanding",
          "Discordbot",
          "Pinterest",
        ],
        allow: "/",
      },
    ],
    sitemap: `${BUSINESS.website}/sitemap.xml`,
  };
}
