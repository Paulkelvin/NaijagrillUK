import Image from "next/image";
import { resolveImageSrc } from "@/sanity/resolve-image";
import type { SanityImage } from "@/sanity/types";

type EditorialImageProps = {
  src?: SanityImage | string | null;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  aspectClassName?: string;
};

export function EditorialImage({
  src,
  alt,
  fill = true,
  priority = false,
  className = "object-cover",
  sizes = "100vw",
  aspectClassName,
}: EditorialImageProps) {
  const resolved = resolveImageSrc(src, 2400);
  if (!resolved) return null;

  // Prefer alt text managed in Sanity (on the image object); fall back to the
  // alt passed by the component.
  const resolvedAlt =
    src && typeof src === "object" && src.alt ? src.alt : alt;

  const image = (
    <Image
      src={resolved}
      alt={resolvedAlt}
      fill={fill}
      priority={priority}
      className={className}
      sizes={sizes}
    />
  );

  if (aspectClassName) {
    return <div className={`relative ${aspectClassName}`}>{image}</div>;
  }

  return image;
}
