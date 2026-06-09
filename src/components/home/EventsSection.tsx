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
    <section className="bg-ivory">
      <JsonLd
        data={upcoming.map((event) =>
          eventSchema(event, resolveImageSrc(event.featuredImage, 1200)),
        )}
      />
      <div className="mx-auto max-w-[1600px] px-6 py-28 md:px-12 md:py-36 lg:px-16">
        <div className="mb-20 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="editorial-caption mb-8">Upcoming</p>
            <h2 className="editorial-display text-[clamp(2.25rem,4vw,3.75rem)] font-light leading-tight text-charcoal">
              Evenings worth reserving.
            </h2>
          </div>
          <Link href="/private-dining" className="editorial-link shrink-0">
            Private dining enquiries
          </Link>
        </div>

        <div className="divide-y divide-charcoal/10">
          {upcoming.map((event, index) => (
            <article
              key={event._id}
              className="grid gap-10 py-16 lg:grid-cols-12 lg:gap-8 lg:py-20"
            >
              <div
                className={`relative aspect-[5/4] lg:col-span-5 ${
                  index % 2 === 1 ? "lg:col-start-8" : ""
                }`}
              >
                <EditorialImage
                  src={event.featuredImage}
                  alt={event.title}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>

              <div
                className={`flex flex-col justify-center lg:col-span-5 ${
                  index % 2 === 1
                    ? "lg:col-start-2 lg:row-start-1"
                    : "lg:col-start-7"
                }`}
              >
                <p className="editorial-caption mb-4">
                  {formatDate(event.eventDate)} &middot; {event.location}
                </p>
                <h3 className="editorial-display text-4xl font-light text-charcoal md:text-5xl">
                  {event.title}
                </h3>
                <p className="mt-6 text-base leading-[1.8] text-stone md:text-lg">
                  {event.excerpt}
                </p>
                <Link
                  href="/reservations"
                  className="editorial-link mt-10"
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
