import Link from "next/link";
import { EditorialFrame } from "@/components/ui/EditorialFrame";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { HomepageData } from "@/sanity/types";

export function CuisineEditorial({ data }: { data: HomepageData }) {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1600px] px-6 py-28 md:px-12 md:py-36 lg:px-16">
        <div className="mb-24 max-w-2xl border-b border-charcoal/10 pb-12">
          <p className="editorial-eyebrow-rule editorial-caption">
            {data.cuisineEyebrow}
          </p>
          <h2 className="editorial-display text-[clamp(2.25rem,4vw,3.75rem)] font-light leading-tight text-charcoal">
            {data.cuisineHeadline}
          </h2>
        </div>

        <div className="space-y-36 md:space-y-48">
          {data.cuisineFeatures.map((feature, index) => (
            <article
              key={feature.title}
              className={`grid items-center gap-12 lg:grid-cols-12 lg:gap-10 ${
                feature.align === "right" ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className="relative lg:col-span-7">
                <EditorialFrame>
                  <div className="image-vignette-side relative aspect-[5/4]">
                    <EditorialImage
                      src={feature.image}
                      alt={feature.title}
                      sizes="(max-width: 1024px) 100vw, 58vw"
                    />
                  </div>
                </EditorialFrame>
                <span className="editorial-caption absolute -top-6 left-0 hidden md:block">
                  0{index + 1}
                </span>
              </div>

              <div
                className={`lg:col-span-4 ${
                  feature.align === "left"
                    ? "lg:col-start-9 lg:pl-6"
                    : "lg:col-start-2 lg:pr-6"
                }`}
              >
                <p className="editorial-caption mb-5">{feature.subtitle}</p>
                <h3 className="editorial-display text-5xl font-light text-charcoal md:text-6xl">
                  {feature.title}
                </h3>
                <p className="mt-8 text-base leading-[1.85] text-stone md:text-lg">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-28 text-center">
          <Link href="/menu" className="editorial-link">
            Explore the full menu
          </Link>
        </div>
      </div>
    </section>
  );
}
