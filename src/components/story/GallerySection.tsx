"use client";

import { useRef } from "react";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { GalleryImageData } from "@/sanity/types";

export function GallerySection({ images }: { images: GalleryImageData[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!images.length) return null;

  const scroll = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const amount = scroller.clientWidth * 0.85 * direction;
    scroller.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="bg-cream px-6 py-16 md:px-12 md:py-20 lg:px-16">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.9fr_1fr] lg:items-end">
          <div>
            <p className="editorial-caption mb-4 text-gold">Gallery</p>
            <h2 className="editorial-display text-balance text-[clamp(2.45rem,4vw,4.8rem)] font-light leading-[0.98] text-charcoal">
              Glimpses of fire, food, and full tables.
            </h2>
          </div>
          <div className="flex items-end justify-between gap-6 lg:flex-col lg:items-end">
            <p className="max-w-xl text-sm leading-[1.65] text-stone md:text-base">
              Slide through the details around the dining room: hands at work,
              plates moving, the glow of service, and the warmth guests remember.
            </p>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => scroll(-1)}
                aria-label="Previous images"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-charcoal/20 text-charcoal transition-colors hover:border-gold hover:bg-gold hover:text-charcoal"
              >
                <span aria-hidden className="text-lg">&#8592;</span>
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                aria-label="Next images"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-charcoal/20 text-charcoal transition-colors hover:border-gold hover:bg-gold hover:text-charcoal"
              >
                <span aria-hidden className="text-lg">&#8594;</span>
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
        >
          {images.map((item) => (
            <figure
              key={item._id}
              className="group relative aspect-[4/5] w-[78%] shrink-0 snap-start overflow-hidden rounded-[1.8rem] bg-charcoal shadow-[0_20px_70px_rgba(22,15,11,0.1)] sm:w-[46%] lg:w-[31%]"
            >
              <EditorialImage
                src={item.image}
                alt={item.alt ?? item.title}
                sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 31vw"
                className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
              {item.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 p-5 text-sm leading-[1.5] text-ivory/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                  {item.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
