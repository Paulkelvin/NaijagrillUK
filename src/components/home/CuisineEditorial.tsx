import Link from "next/link";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { HomepageData } from "@/sanity/types";

export function CuisineEditorial({ data }: { data: HomepageData }) {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1600px] px-6 py-28 md:px-12 md:py-36 lg:px-16">
        <div className="mb-20 max-w-2xl">
          <p className="editorial-caption mb-8">{data.cuisineEyebrow}</p>
          <h2 className="editorial-display text-[clamp(2.25rem,4vw,3.75rem)] font-light leading-tight text-charcoal">
            {data.cuisineHeadline}
          </h2>
        </div>

        <div className="space-y-32 md:space-y-44">
          {data.cuisineFeatures.map((feature) => (
            <article
              key={feature.title}
              className={`grid items-center gap-12 lg:grid-cols-12 lg:gap-8 ${
                feature.align === "right" ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className="relative aspect-[5/4] lg:col-span-7">
                <EditorialImage
                  src={feature.image}
                  alt={feature.title}
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
              </div>

              <div
                className={`lg:col-span-4 ${
                  feature.align === "left"
                    ? "lg:col-start-9 lg:pl-8"
                    : "lg:col-start-2 lg:pr-8"
                }`}
              >
                <p className="editorial-caption mb-4">{feature.subtitle}</p>
                <h3 className="editorial-display text-5xl font-light text-charcoal md:text-6xl">
                  {feature.title}
                </h3>
                <p className="mt-6 text-base leading-[1.8] text-stone md:text-lg">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-24 text-center">
          <Link href="/menu" className="editorial-link">
            Explore the full menu
          </Link>
        </div>
      </div>
    </section>
  );
}
