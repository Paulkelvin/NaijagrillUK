import Image from "next/image";
import type { TestimonialData } from "@/sanity/types";

const portraits = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=500&q=80",
];

function RatingStars() {
  return (
    <div className="flex items-center gap-1 text-gold" aria-label="5 star review">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          className="h-4 w-4 fill-current"
          aria-hidden="true"
        >
          <path d="M12 2 9.3 8.4 2.4 9l5.2 4.5-1.6 6.8 6-3.6 6 3.6-1.6-6.8L21.6 9l-6.9-.6L12 2Z" />
        </svg>
      ))}
    </div>
  );
}

function QuoteCard({
  item,
  index,
}: {
  item: TestimonialData;
  index: number;
}) {
  return (
    <figure
      className="smooth-card-motion flex min-h-[360px] w-[82vw] shrink-0 snap-start flex-col justify-between rounded-[1.9rem] border border-charcoal/10 bg-ivory p-6 shadow-[0_28px_90px_rgba(22,15,11,0.12)] hover:-translate-y-1 md:w-[410px] lg:w-[455px]"
    >
      <div>
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="editorial-caption text-gold">Guest note</p>
          <RatingStars />
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
  const movingItems = [...items, ...items];

  return (
    <section className="overflow-hidden bg-ivory">
      <div className="mx-auto max-w-[1500px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <div className="mb-9 border-t border-charcoal/10 pt-10">
          <div className="min-w-0 flex-1">
            <p className="editorial-caption mb-3 text-gold">Guest Notes</p>
            <h2 className="editorial-display text-[clamp(2.2rem,9vw,5.25rem)] font-light leading-[0.92] text-charcoal">
              What they say about us
            </h2>
          </div>
        </div>

        <div
          className="testimonial-marquee overflow-hidden pb-6"
          aria-label="Guest notes carousel"
        >
          <div className="testimonial-marquee-track flex w-max gap-5 pr-5">
            {movingItems.map((item, index) => (
              <QuoteCard
                key={`${item._id}-${index}`}
                item={item}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
