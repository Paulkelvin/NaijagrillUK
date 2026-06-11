import Link from "next/link";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatDate } from "@/lib/blog/utils";
import { eventSchema } from "@/lib/seo/structured-data";
import { resolveImageSrc } from "@/sanity/resolve-image";
import type { EventData } from "@/sanity/types";

export function EventsSection({ events }: { events: EventData[] }) {
  if (!events.length) return null;

  const upcoming = events.slice(0, 3);

  return (
    <section className="bg-charcoal text-ivory">
      <JsonLd
        data={upcoming.map((event) =>
          eventSchema(event, resolveImageSrc(event.featuredImage, 1200)),
        )}
      />
      <div className="mx-auto max-w-[1500px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="editorial-caption mb-3 text-gold">Upcoming</p>
            <h2 className="editorial-display max-w-3xl text-[clamp(2.6rem,5vw,5.5rem)] font-light leading-[0.9] text-ivory">
              Supper clubs, celebrations, and room-filling nights.
            </h2>
          </div>
          <Link href="/private-dining" className="luxury-link shrink-0 text-gold">
            Events & catering enquiries
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {upcoming.map((event, index) => (
            <article
              key={event._id}
              className={`group overflow-hidden rounded-[2rem] border border-ivory/10 bg-ivory/[0.06] shadow-[0_28px_90px_rgba(0,0,0,0.24)] ${
                index === 0 ? "lg:col-span-2" : ""
              }`}
            >
              <div
                className={`image-vignette-side relative overflow-hidden ${
                  index === 0 ? "aspect-[16/9]" : "aspect-[4/3]"
                }`}
              >
                <EditorialImage
                  src={event.featuredImage}
                  alt={event.title}
                  sizes={
                    index === 0
                      ? "(max-width: 1024px) 100vw, 62vw"
                      : "(max-width: 1024px) 100vw, 28vw"
                  }
                  className="object-cover transition-[transform,filter] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-hover:saturate-[0.92] group-hover:contrast-[1.06]"
                />
                <div className="absolute left-5 top-5 rounded-full bg-gold px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.16em] text-charcoal">
                  {formatDate(event.eventDate)}
                </div>
              </div>

              <div className="p-6 md:p-8">
                <p className="editorial-caption mb-3 text-gold/85">
                  {event.location}
                </p>
                <h3
                  className={`editorial-display font-light leading-[0.95] text-ivory ${
                    index === 0 ? "text-5xl md:text-6xl" : "text-4xl"
                  }`}
                >
                  {event.title}
                </h3>
                <p className="mt-5 max-w-xl text-sm leading-[1.7] text-ivory/72 md:text-base">
                  {event.excerpt}
                </p>
                <Link
                  href="/reservations"
                  className="mt-8 inline-flex rounded-full border border-gold/45 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-charcoal"
                >
                  Reserve for this evening
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
