import Link from "next/link";
import { FaqSection } from "@/components/blog/FaqSection";
import { PortableTextContent } from "@/components/blog/PortableTextContent";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { PageHero } from "@/components/ui/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqSchema,
} from "@/lib/seo/structured-data";
import { getExplorePage } from "@/sanity/fetch";
import { resolveImageSrc } from "@/sanity/resolve-image";

const fallbackFoodImages = [
  "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=1200&q=85",
];

const experienceCards = [
  {
    title: "Start with smoke",
    body: "Charcoal, suya spice, pepper and onion build the first impression before the mains arrive.",
    icon: "M12 3c2.5 2.2 4 4.6 4 7.1 0 3.6-2.7 6.4-6 6.4s-6-2.8-6-6.4c0-2.2 1.3-4.3 3.2-6.3-.1 1.8.7 3.1 2 3.9C9.9 5.3 10.8 4.1 12 3Z",
  },
  {
    title: "Share the centre",
    body: "Jollof, stews, grills and sides are designed for the middle of the table, not isolated plates.",
    icon: "M4 8h16v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8Zm2-3h12l2 3H4l2-3Z",
  },
  {
    title: "Finish slowly",
    body: "Settle in with a drink, a sweet finish, and the kind of service that lets the evening breathe.",
    icon: "M8 3h8v6a4 4 0 0 1-3 3.87V19h4v2H7v-2h4v-6.13A4 4 0 0 1 8 9V3Zm2 2v4a2 2 0 1 0 4 0V5h-4Z",
  },
];

export async function generateMetadata() {
  const page = await getExplorePage();
  return buildMetadata({
    title: page.seo?.title ?? page.title,
    description: page.seo?.description ?? page.subtitle,
    path: "/explore-nigerian-cuisine",
    seo: page.seo,
    image: resolveImageSrc(page.heroImage, 1200),
  });
}

export default async function ExploreNigerianCuisinePage() {
  const page = await getExplorePage();
  const faqJsonLd = faqSchema(page.faqs ?? []);
  const featureSections = page.sections.slice(0, 3);

  return (
    <div className="bg-ivory">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            {
              name: "Explore Nigerian Cuisine",
              path: "/explore-nigerian-cuisine",
            },
          ]),
          ...(faqJsonLd ? [faqJsonLd] : []),
        ]}
      />

      <PageHero
        eyebrow="Taste guide"
        title={page.title}
        description={page.subtitle}
        image={
          resolveImageSrc(page.heroImage, 2400) ??
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=2400&q=85"
        }
        imageAlt={page.title}
        heightClassName="min-h-[66vh]"
      />

      <section className="mx-auto grid max-w-[1500px] gap-10 px-6 py-16 md:px-12 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
        <div className="rounded-[2rem] bg-cream/75 p-7 shadow-[0_24px_70px_rgba(22,15,11,0.08)] md:p-10">
          <p className="editorial-caption mb-4 text-gold">First visit</p>
          <h2 className="editorial-display text-4xl font-light leading-[1] text-charcoal md:text-5xl">
            A friendly way into Nigerian flavour.
          </h2>
          <div className="mt-6 text-base leading-[1.62] text-stone">
            <PortableTextContent value={page.introduction} />
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/reservations" className="editorial-button rounded-full">
              Reserve a table
            </Link>
            <Link href="/menu" className="editorial-button rounded-full border-charcoal/20">
              View menu
            </Link>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="image-vignette relative min-h-[320px] overflow-hidden rounded-[2.25rem] sm:row-span-2">
            <EditorialImage
              src={featureSections[0]?.image ?? fallbackFoodImages[0]}
              alt={featureSections[0]?.heading ?? "Nigerian dish at NaijaGrill"}
              sizes="(max-width: 1024px) 100vw, 35vw"
            />
          </div>
          {featureSections.slice(1, 3).map((section, index) => (
            <div
              key={section.heading}
              className="image-vignette-side relative min-h-[150px] overflow-hidden rounded-[1.75rem]"
            >
              <EditorialImage
                src={section.image ?? fallbackFoodImages[index + 1]}
                alt={section.heading}
                sizes="(max-width: 640px) 100vw, 22vw"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cream/55 px-6 py-16 md:px-12 md:py-20 lg:px-16">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="editorial-caption mb-3 text-gold">How to order</p>
              <h2 className="editorial-display max-w-2xl text-4xl font-light leading-[1] text-charcoal md:text-5xl">
                Come hungry. We will guide the rest.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-[1.55] text-stone">
              Whether you know every dish or you are curious about Nigerian
              food for the first time, the room is built to make ordering easy.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {experienceCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[1.75rem] bg-ivory p-7 shadow-[0_18px_50px_rgba(22,15,11,0.07)]"
              >
                <span className="mb-8 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold/20 text-gold">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                    <path d={card.icon} />
                  </svg>
                </span>
                <h3 className="editorial-display text-3xl font-light leading-[1] text-charcoal">
                  {card.title}
                </h3>
                <p className="mt-4 text-sm leading-[1.58] text-stone">
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-16 md:px-12 md:py-20">
        <div className="space-y-8">
          {page.sections.map((section, index) => (
            <article
              key={section.heading}
              className="grid gap-8 rounded-[2rem] bg-ivory p-5 shadow-[0_22px_70px_rgba(22,15,11,0.07)] md:grid-cols-[0.42fr_1fr] md:items-center md:p-6"
            >
              <div className="image-vignette-side relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                <EditorialImage
                  src={section.image ?? fallbackFoodImages[index % fallbackFoodImages.length]}
                  alt={section.heading}
                  sizes="(max-width: 768px) 100vw, 32vw"
                />
              </div>
              <div className="px-2 pb-2 md:px-4">
                <p className="editorial-caption mb-3 text-gold">Taste note</p>
                <h2 className="editorial-display text-3xl font-light leading-[1] text-charcoal md:text-4xl">
                  {section.heading}
                </h2>
                <div className="mt-4 text-sm leading-[1.58] text-stone md:text-base">
                  <PortableTextContent value={section.body} />
                </div>
              </div>
            </article>
          ))}
        </div>

        {page.faqs && <FaqSection faqs={page.faqs} title="Questions before you book" />}
      </section>

      <section className="px-6 pb-20 md:px-12 lg:px-16">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 rounded-[2rem] bg-charcoal p-8 text-ivory shadow-[0_24px_80px_rgba(22,15,11,0.18)] md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <p className="editorial-caption mb-3 text-gold">Taste it here</p>
            <h2 className="editorial-display max-w-2xl text-4xl font-light leading-[1] md:text-5xl">
              Nigerian cuisine makes more sense at the table.
            </h2>
          </div>
          <Link href="/reservations" className="editorial-button-dark shrink-0 rounded-full">
            Reserve your table
          </Link>
        </div>
      </section>
      </div>
  );
}
