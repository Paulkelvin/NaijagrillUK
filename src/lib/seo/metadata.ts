import type { Metadata } from "next";
import { BUSINESS } from "@/lib/business";
import { resolveImageSrc } from "@/sanity/resolve-image";
import type { SeoMetadata } from "@/sanity/types";

const siteUrl = BUSINESS.website;

// Optional Facebook App ID (clears the "Missing fb:app_id" debugger warning and
// unlocks share analytics). Set NEXT_PUBLIC_FB_APP_ID in the environment.
const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;

// Site-wide base keywords (head + medium terms). Pages append their own
// long-tail terms via the `keywords` option. Meta keywords carry little weight
// with Google, but the same terms are mirrored across titles, descriptions,
// headings, and JSON-LD where they actually count.
const BASE_KEYWORDS = [
  "Nigerian restaurant Birmingham",
  "African restaurant Birmingham",
  "Nigerian food Birmingham",
  "Nigerian food Handsworth",
  "West African food Birmingham",
  "jollof rice Birmingham",
  "suya Birmingham",
  "Nigerian catering Birmingham",
  "Nigerian takeaway Birmingham",
  "Naija Grill & Spice Kitchen",
  "Naija Grill",
  "NaijaGrill",
  "Naija Grill and Spice",
  "Naija Grill and Spice Kitchen",
  "Naija Grill Birmingham",
  "Naija Grill Handsworth",
  "naijagrillandspice",
];

type BuildMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  seo?: SeoMetadata;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  noIndex?: boolean;
  keywords?: string[];
};

export function buildMetadata({
  title,
  description,
  path = "",
  seo,
  image,
  type = "website",
  publishedTime,
  noIndex,
  keywords = [],
}: BuildMetadataOptions): Metadata {
  const resolvedTitle = seo?.title ?? title ?? BUSINESS.legalName;
  const resolvedDescription =
    seo?.description ?? description ?? BUSINESS.description;
  const canonical = `${siteUrl}${path}`;
  // Priority: a share image set in Studio (SEO → Open Graph Image) wins, then
  // the page's own image (hero/featured), then the site-wide storefront image.
  const ogImage =
    resolveImageSrc(seo?.ogImage, 1200) ?? image ?? `${siteUrl}/og-image.jpg`;
  const shouldNoIndex = noIndex ?? seo?.noIndex ?? false;
  // Page-specific keywords first, then the shared base, de-duplicated.
  const resolvedKeywords = Array.from(new Set([...keywords, ...BASE_KEYWORDS]));

  return {
    metadataBase: new URL(siteUrl),
    title: resolvedTitle,
    description: resolvedDescription,
    applicationName: BUSINESS.legalName,
    authors: [{ name: BUSINESS.legalName, url: siteUrl }],
    creator: BUSINESS.legalName,
    publisher: BUSINESS.legalName,
    keywords: resolvedKeywords,
    alternates: { canonical },
    ...(fbAppId ? { facebook: { appId: fbAppId } } : {}),
    robots: shouldNoIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonical,
      siteName: BUSINESS.legalName,
      locale: "en_GB",
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: resolvedTitle }],
      ...(publishedTime && type === "article"
        ? { publishedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [ogImage],
    },
  };
}
