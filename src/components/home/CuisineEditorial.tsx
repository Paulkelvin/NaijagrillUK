import Link from "next/link";
import { EditorialFrame } from "@/components/ui/EditorialFrame";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { HomepageData } from "@/sanity/types";

const localCuisineImages: Record<string, string> = {
  jollof: "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
  "jollof rice": "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
  "white rice with ofada stew": "/images/menu/naijagrill-white-rice-ofada-stew.jpg",
  "white rice with ayamase": "/images/menu/naijagrill-white-rice-ayamase-stew.jpg",
  "fried rice": "/images/menu/naijagrill-fried-rice-peppered-hake-plantain.jpg",
  "poundo with egusi": "/images/menu/naijagrill-poundo-egusi-soup.jpg",
  "egusi soup": "/images/menu/naijagrill-poundo-egusi-soup.jpg",
  "efo riro": "/images/menu/naijagrill-efo-riro-soup.jpg",
  "assorted meat pepper soup":
    "/images/menu/naijagrill-assorted-meat-pepper-soup.jpg",
  "grilled tilapia": "/images/menu/naijagrill-grilled-tilapia-plantain-chips.jpg",
};

function imageForCuisineFeature(feature: HomepageData["cuisineFeatures"][number]) {
  return localCuisineImages[feature.title.toLowerCase()] ?? feature.image;
}

export function CuisineEditorial({ data }: { data: HomepageData }) {
  // Repeat the features so each half of the marquee track is wide enough to
  // overflow the viewport, then duplicate for a seamless -50% loop.
  const base = data.cuisineFeatures;
  const repeat = Math.max(1, Math.ceil(4 / Math.max(1, base.length)));
  const half = Array.from({ length: repeat }).flatMap(() => base);
  const movingFeatures = [...half, ...half];

  return (
    <section className="bg-cream">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-6 py-14 md:px-12 md:py-16 lg:grid-cols-[0.34fr_1fr] lg:px-16">
        <div className="lg:pt-4">
          <p className="editorial-eyebrow-rule editorial-caption">
            {data.cuisineEyebrow}
          </p>
          <h2 className="editorial-display text-[clamp(2.25rem,4vw,3.75rem)] font-light leading-[0.96] text-charcoal">
            {data.cuisineHeadline}
          </h2>
          <div className="mt-10">
            <Link href="/menu" className="editorial-link">
              Explore the full menu
            </Link>
          </div>
        </div>

        <div className="kitchen-marquee overflow-hidden">
          <div className="kitchen-marquee-track flex w-max gap-6 pr-6">
            {movingFeatures.map((feature, index) => (
              <article
                key={`${feature.title}-${index}`}
                className="group w-[78vw] shrink-0 select-none rounded-[1.65rem] border border-charcoal/10 bg-ivory/70 p-4 md:w-[420px] lg:w-[430px]"
              >
                <div className="relative">
                  <EditorialFrame>
                    <div className="image-vignette-side relative aspect-[16/10] overflow-hidden rounded-[1.35rem]">
                      <EditorialImage
                        src={imageForCuisineFeature(feature)}
                        alt={feature.title}
                        sizes="(max-width: 1024px) 92vw, 28vw"
                        className="pointer-events-none object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    </div>
                  </EditorialFrame>
                  <span className="editorial-caption absolute left-5 top-5 rounded-full bg-charcoal/75 px-3 py-2 text-ivory/75 backdrop-blur">
                    0{(index % data.cuisineFeatures.length) + 1}
                  </span>
                </div>

                <div className="px-2 pb-1 pt-4">
                  <p className="editorial-caption mb-2">{feature.subtitle}</p>
                  <h3 className="editorial-display text-3xl font-light leading-[0.98] text-charcoal md:text-4xl">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-[1.55] text-stone">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
