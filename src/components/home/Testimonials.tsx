"use client";

import { useRef } from "react";
import Image from "next/image";
import type { TestimonialData } from "@/sanity/types";

const portraits = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=500&q=80",
];

const atmosphereImages = [
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=85",
];

function QuoteCard({
  item,
  index,
}: {
  item: TestimonialData;
  index: number;
}) {
  return (
    <figure
      className="flex min-h-[360px] w-[82vw] shrink-0 snap-start flex-col justify-between rounded-[1.9rem] border border-charcoal/10 bg-cream/90 p-6 shadow-[0_28px_90px_rgba(22,15,11,0.12)] md:w-[410px] lg:w-[455px]"
    >
      <div>
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="editorial-caption text-gold">Guest note</p>
          <p className="text-xs font-black tracking-[0.24em] text-burgundy">
            5.0
          </p>
        </div>
        <blockquote className="editorial-display text-[1.5rem] font-light leading-[1.28] text-charcoal md:text-[1.78rem]">
          &ldquo;{item.quote}&rdquo;
        </blockquote>
      </div>
      <figcaption className="mt-8 flex items-center gap-4 border-t border-charcoal/10 pt-5">
        <div className="relative aspect-square w-14 overflow-hidden rounded-full bg-charcoal/10 ring-4 ring-ivory/70">
          <Image
            src={portraits[index % portraits.length]}
            alt=""
            fill
            sizes="56px"
            className="object-cover contrast-105"
          />
        </div>
        <div>
          <p className="text-sm font-black text-charcoal">{item.author}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
            {item.context}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

export function Testimonials({ items }: { items: TestimonialData[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: "previous" | "next") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction === "next" ? 520 : -520,
      behavior: "smooth",
    });
  };

  return (
    <section className="overflow-hidden bg-ivory">
      <div className="mx-auto max-w-[1500px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <div className="mb-9 flex flex-col gap-6 border-t border-charcoal/10 pt-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="editorial-caption mb-3 text-gold">Guest Notes</p>
            <h2 className="editorial-display max-w-3xl text-5xl font-light leading-[0.92] text-charcoal md:text-7xl">
              The kind of table guests talk about later.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-[1.75] text-stone md:text-base">
              Warm service, serious pepper, generous plates, and enough rhythm in
              the room to make a quick meal turn into an evening.
            </p>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              aria-label="Show previous testimonial"
              onClick={() => scrollByCard("previous")}
              className="grid h-12 w-12 place-items-center rounded-full border border-charcoal/15 text-charcoal transition-colors hover:border-gold hover:text-gold"
            >
              <span aria-hidden>&larr;</span>
            </button>
            <button
              type="button"
              aria-label="Show next testimonial"
              onClick={() => scrollByCard("next")}
              className="grid h-12 w-12 place-items-center rounded-full border border-charcoal/15 text-charcoal transition-colors hover:border-gold hover:text-gold"
            >
              <span aria-hidden>&rarr;</span>
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="no-scrollbar flex snap-x gap-5 overflow-x-auto scroll-smooth pb-6 pr-10"
          aria-label="Guest notes carousel"
        >
          {items[0] && <QuoteCard item={items[0]} index={0} />}
          <article className="relative min-h-[360px] w-[82vw] shrink-0 snap-start overflow-hidden rounded-[1.9rem] bg-charcoal shadow-[0_28px_90px_rgba(22,15,11,0.16)] md:w-[360px]">
            <Image
              src={atmosphereImages[0]}
              alt="Dinner service atmosphere at NaijaGrill"
              fill
              sizes="(max-width: 768px) 82vw, 340px"
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="editorial-caption mb-3 text-gold">In the room</p>
              <p className="editorial-display text-4xl font-light leading-[0.92] text-ivory">
                Low light, smoke, and plates passed across the table.
              </p>
            </div>
          </article>
          {items.slice(1).map((item, index) => (
            <QuoteCard key={item._id} item={item} index={index + 1} />
          ))}
          <article className="flex min-h-[360px] w-[82vw] shrink-0 snap-start flex-col justify-between rounded-[1.9rem] border border-gold/25 bg-charcoal p-6 text-ivory shadow-[0_28px_90px_rgba(22,15,11,0.16)] md:w-[380px]">
            <div>
              <p className="editorial-caption mb-5 text-gold">
                Private dining
              </p>
              <p className="editorial-display text-[2.35rem] font-light leading-[0.92]">
                The best guest notes often start with a full table.
              </p>
            </div>
            <div className="flex items-center gap-4 border-t border-ivory/10 pt-4">
              <div className="relative aspect-[3/4] w-14 overflow-hidden rounded-[0.9rem]">
                <Image
                  src={atmosphereImages[1]}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover contrast-105"
                />
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-ivory/62">
                Events and celebrations
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
