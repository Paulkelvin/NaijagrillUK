import type { TestimonialData } from "@/sanity/types";

export function Testimonials({ items }: { items: TestimonialData[] }) {
  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-[1600px] px-6 py-28 md:px-12 md:py-36 lg:px-16">
        <p className="editorial-caption mb-16 text-center">Guest Notes</p>

        <div className="grid gap-16 md:grid-cols-3 md:gap-12">
          {items.map((item) => (
            <figure key={item._id} className="flex flex-col">
              <blockquote className="editorial-display flex-1 text-2xl font-light leading-snug text-charcoal md:text-[1.75rem]">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-8 border-t border-charcoal/10 pt-6">
                <p className="text-sm text-charcoal">{item.author}</p>
                <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.22em] text-stone">
                  {item.context}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
