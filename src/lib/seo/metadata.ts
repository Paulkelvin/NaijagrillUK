import type { Metadata } from "next";
import { BUSINESS } from "@/lib/business";
import { resolveImageSrc } from "@/sanity/resolve-image";
import type { SeoMetadata } from "@/sanity/types";

const siteUrl = BUSINESS.website;

type BuildMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  seo?: SeoMetadata;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  noIndex?: boolean;
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

  return {
    metadataBase: new URL(siteUrl),
    title: resolvedTitle,
    description: resolvedDescription,
    applicationName: BUSINESS.legalName,
    authors: [{ name: BUSINESS.legalName, url: siteUrl }],
    creator: BUSINESS.legalName,
    publisher: BUSINESS.legalName,
    alternates: { canonical },
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
