import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import type { PortableTextBlock } from "@portabletext/types";
import { resolveImageSrc } from "@/sanity/resolve-image";
import type { SanityImage } from "@/sanity/types";
import { extractHeadings } from "@/lib/blog/utils";

const components: PortableTextComponents = {
  block: {
    h2: ({ children, value }) => {
      const headings = extractHeadings([value as PortableTextBlock]);
      const id = headings[0]?.id;
      return (
        <h2
          id={id}
          className="editorial-display mt-16 scroll-mt-32 text-4xl font-light text-charcoal md:text-5xl"
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, value }) => {
      const headings = extractHeadings([value as PortableTextBlock]);
      const id = headings[0]?.id;
      return (
        <h3
          id={id}
          className="editorial-display mt-12 scroll-mt-32 text-3xl font-light text-charcoal"
        >
          {children}
        </h3>
      );
    },
    normal: ({ children }) => (
      <p className="mt-6 text-base leading-[1.9] text-stone md:text-lg">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="editorial-display my-10 border-l border-gold pl-8 text-2xl font-light text-charcoal md:text-3xl">
        {children}
      </blockquote>
    ),
  },
  types: {
    image: ({ value }) => {
      const src = resolveImageSrc(value as SanityImage, 1400);
      if (!src) return null;
      return (
        <figure className="my-12">
          <div className="relative aspect-[16/10]">
            <Image
              src={src}
              alt={value.alt ?? ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
          {value.caption && (
            <figcaption className="editorial-caption mt-4">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        className="text-charcoal underline decoration-gold/50 underline-offset-4 transition-colors hover:text-gold"
      >
        {children}
      </a>
    ),
  },
};

export function PortableTextContent({
  value,
}: {
  value: PortableTextBlock[];
}) {
  return <PortableText value={value} components={components} />;
}
