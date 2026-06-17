import Link from "next/link";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { EditorialFrame } from "@/components/ui/EditorialFrame";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { HomepageData } from "@/sanity/types";

// Fallback line-up so the section always shows a generous range of dishes
// even when the CMS only supplies a couple of features.
const KITCHEN_DISHES: HomepageData["cuisineFeatures"] = [
  {
    title: "Jollof Rice",
    subtitle: "The ceremony of the pot",
    description:
      "Smoky party-style tomato rice with assorted meat and sweet plantain.",
    image: "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
    align: "left",
  },
  {
    title: "Beef Suya",
    subtitle: "Street fire, refined",
    description:
      "Yaji-spiced beef grilled over charcoal with onions and real heat.",
    image: "/images/menu/naijagrill-beef-suya.jpg",
    align: "right",
  },
  {
    title: "Poundo & Egusi",
    subtitle: "Soup and swallow",
    description:
      "Soft poundo with rich melon-seed egusi, greens, and tender meat.",
    image: "/images/menu/naijagrill-poundo-egusi-soup.jpg",
    align: "left",
  },
  {
    title: "Amala, Ewedu & Gbegiri",
    subtitle: "Abula, done right",
    description:
      "Smooth amala with ewedu and gbegiri, finished with rich pepper stew and assorted meat.",
    image: "/images/menu/naijagrill-amala-ewedu-gbegiri.jpg",
    align: "right",
  },
  {
    title: "Grilled Fish",
    subtitle: "From the grill",
    description:
      "Whole grilled fish in pepper sauce with fried yam and sweet plantain.",
    image: "/images/menu/naijagrill-grilled-fish-yam-plantain.jpg",
    align: "left",
  },
  {
    title: "Efo Riro",
    subtitle: "Greens, slow-cooked",
    description:
      "Spinach stew with peppers, iru, and your choice of protein.",
    image: "/images/menu/naijagrill-efo-riro-soup.jpg",
    align: "right",
  },
  {
    title: "Small Chops",
    subtitle: "For the table",
    description:
      "Puff puff, samosas, and snackable bites made for sharing.",
    image: "/images/menu/naijagrill-small-chops-platter.jpg",
    align: "left",
  },
  {
    title: "Okro Seafood Soup",
    subtitle: "Coastal comfort",
    description:
      "Silky okro soup with seafood, fish, and a proper swallow.",
    image: "/images/menu/naijagrill-okro-seafood-soup.jpg",
    align: "right",
  },
];

const localCuisineImages: Record<string, string> = {
  jollof: "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
  "jollof rice": "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
  "white rice with ofada stew": "/images/menu/naijagrill-white-rice-ofada-stew.jpg",
  "white rice with ayamase": "/images/menu/naijagrill-white-rice-ayamase-stew.jpg",
  "fried rice": "/images/menu/naijagrill-fried-rice-peppered-hake-plantain.jpg",
  "poundo with egusi": "/images/menu/naijagrill-poundo-egusi-soup.jpg",
  "poundo & egusi": "/images/menu/naijagrill-poundo-egusi-soup.jpg",
  "egusi soup": "/images/menu/naijagrill-poundo-egusi-soup.jpg",
  "efo riro": "/images/menu/naijagrill-efo-riro-soup.jpg",
  "amala, ewedu & gbegiri": "/images/menu/naijagrill-amala-ewedu-gbegiri.jpg",
  "grilled fish": "/images/menu/naijagrill-grilled-fish-yam-plantain.jpg",
  "beef suya": "/images/menu/naijagrill-beef-suya.jpg",
  "small chops": "/images/menu/naijagrill-small-chops-platter.jpg",
  "okro seafood soup": "/images/menu/naijagrill-okro-seafood-soup.jpg",
  "beans with plantain": "/images/menu/naijagrill-beans-plantain-pepper-sauce.jpg",
  "puff puff": "/images/menu/naijagrill-puff-puff.jpg",
  "chicken suya": "/images/menu/naijagrill-beef-suya.jpg",
};

function imageForCuisineFeature(feature: HomepageData["cuisineFeatures"][number]) {
  return localCuisineImages[feature.title.toLowerCase()] ?? feature.image;
}

export function CuisineEditorial({ data }: { data: HomepageData }) {
  // Use the CMS features when there are enough, otherwise show the fuller
  // in-house line-up so the section never looks sparse.
  const features =
    data.cuisineFeatures.length >= 6 ? data.cuisineFeatures : KITCHEN_DISHES;
  // Repeat so each half of the marquee track overflows the viewport, then
  // duplicate for a seamless -50% loop.
  const repeat = Math.max(1, Math.ceil(4 / Math.max(1, features.length)));
  const half = Array.from({ length: repeat }).flatMap(() => features);
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
          <div className="mt-10 flex flex-col items-start gap-6">
            <Link
              href="/menu"
              className="group inline-flex items-center gap-2.5 rounded-full border border-charcoal/25 px-6 py-3.5 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-charcoal"
            >
              Explore the full menu
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <UberEatsLink
              label="Homepage kitchen"
              className="inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 text-[0.6875rem] font-black uppercase tracking-[0.22em] text-charcoal transition-transform hover:-translate-y-0.5"
            >
              <span className="rounded-full bg-charcoal px-2.5 py-1 text-[0.6rem] tracking-[0.12em] text-ivory">
                Uber Eats
              </span>
              Order on Uber Eats
            </UberEatsLink>
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
                    0{(index % features.length) + 1}
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
