import { SectionDivider } from "@/components/ui/SectionDivider";
import type { TestimonialData } from "@/sanity/types";

export function Testimonials({ items }: { items: TestimonialData[] }) {
  const [featured, ...rest] = items;

  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-[1600px] px-6 py-28 md:px-12 md:py-36 lg:px-16">
        <SectionDivider className="mb-16" />
        <p className="editorial-caption mb-16 text-center">Guest Notes</p>

        {featured && (
          <figure className="mx-auto mb-24 max-w-4xl text-center">
            <blockquote className="editorial-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-light leading-snug text-charcoal">
              &ldquo;{featured.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-10">
              <p className="text-sm text-charcoal">{featured.author}</p>
              <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.22em] text-stone">
                {featured.context}
              </p>
            </figcaption>
          </figure>
        )}

        {rest.length > 0 && (
          <div className="grid gap-16 border-t border-charcoal/10 pt-16 md:grid-cols-2">
            {rest.map((item) => (
              <figure key={item._id} className="flex flex-col">
                <blockquote className="editorial-display flex-1 text-2xl font-light leading-snug text-charcoal">
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
        )}
      </div>
    </section>
  );
}
