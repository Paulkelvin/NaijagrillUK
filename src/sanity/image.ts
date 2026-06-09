import createImageUrlBuilder from "@sanity/image-url";
import { sanityClient } from "./client";
import type { SanityImage } from "./types";

type SanityImageSource = SanityImage | string;

const builder = sanityClient
  ? createImageUrlBuilder(sanityClient)
  : null;

export function urlForImage(source: SanityImageSource) {
  if (!builder) return null;
  return builder.image(source).auto("format").fit("max");
}

export function getImageUrl(
  source: SanityImageSource | null | undefined,
  width?: number,
): string | null {
  if (!source || !builder) return null;
  let image = builder.image(source).auto("format").fit("crop");
  if (width) image = image.width(width);
  return image.url();
}
