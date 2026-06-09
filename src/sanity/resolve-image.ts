import { getImageUrl } from "./image";
import type { SanityImage } from "./types";

export function resolveImageSrc(
  source: SanityImage | string | null | undefined,
  width?: number,
): string | null {
  if (!source) return null;
  if (typeof source === "string") return source;
  return getImageUrl(source, width);
}
