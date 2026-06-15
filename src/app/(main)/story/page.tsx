import Link from "next/link";
import { GallerySection } from "@/components/story/GallerySection";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { PageHero } from "@/components/ui/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import type { GalleryImageData } from "@/sanity/types";

const galleryImages: GalleryImageData[] = [
  ["/images/Naija-grill-and-spice-front.webp", "The NaijaGrill storefront on Rookery Road"],
  ["/images/naija-grill-and-spice-room2.jpg", "The NaijaGrill dining room"],
  ["/images/menu/naijagrill-jollof-rice-assorted-meat-egg.jpg", "Party jollof rice with assorted meat and egg"],
  ["/images/menu/naijagrill-beef-suya.jpg", "Beef suya"],
  ["/images/menu/naijagrill-okro-seafood-soup.jpg", "Okro soup with seafood"],
  ["/images/naija-grill-and-spice-table.jpg", "A table set for service"],
  ["/images/menu/jollof-rice.jpeg", "Smoky party jollof rice"],
  ["/images/menu/naijagrill-pounded-yam-efo-riro.jpg", "Pounded yam with efo riro"],
  ["/images/menu/naijagrill-grilled-fish-yam-plantain.jpg", "Grilled fish with fried yam and plantain"],
  ["/images/menu/naijagrill-jollof-rice-chicken-wings.jpg", "Jollof rice with chicken wings"],
  ["/images/menu/naijagrill-peppered-beef.jpg", "Peppered beef with green peppers"],
  ["/images/naija-grill-and-spice-room1.jpg", "Booth seating in the dining room"],
  ["/images/menu/naijagrill-assorted-spread.jpg", "An assorted spread of Nigerian dishes"],
  ["/images/menu/naijagrill-poundo-egusi-soup.jpg", "Poundo with egusi soup"],
  ["/images/menu/naijagrill-amala-ewedu-gbegiri.jpg", "Amala with ewedu and gbegiri"],
  ["/images/menu/naijagrill-white-rice-ayamase-stew.jpg", "White rice with ayamase stew"],
  ["/images/menu/naijagrill-white-rice-ofada-stew.jpg", "White rice with ofada stew"],
  ["/images/menu/naijagrill-fried-rice-peppered-hake-plantain.jpg", "Fried rice with peppered hake and plantain"],
  ["/images/menu/naijagrill-efo-riro-soup.jpg", "Efo riro"],
  ["/images/menu/naijagrill-puff-puff.jpg", "Golden puff puff"],
  ["/images/menu/naijagrill-small-chops-platter.jpg", "Small chops platter"],
  ["/images/menu/naijagrill-beans-plantain-pepper-sauce.jpg", "Beans and plantain with pepper sauce"],
  ["/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg", "Jollof rice with plantain and assorted meat"],
  ["/images/naija-grill-and-spice-hero.jpg", "A spread of NaijaGrill dishes"],
  ["/images/Naija-grill-reservation-hero.JPG", "The NaijaGrill dining room ready for guests"],
  ["/images/naija-grill-and-spice-logo.jpg", "Naija Grill & Spice Kitchen sign"],
].map(([image, alt], index) => ({
  _id: `story-gallery-${index}`,
  title: alt,
  image,
  alt,
  order: index + 1,
}));

const originNotes = [
  {
    label: "Fire",
    title: "Charcoal at the centre",
    body: "Smoke, flame, and slow heat give our suya, grills, and sauces their depth.",
  },
  {
    label: "Spice",
    title: "Flavour with memory",
    body: "Pepper, iru, ginger, stock, and herbs are layered for warmth before heat.",
  },
  {
    label: "Welcome",
    title: "Hospitality that lingers",
    body: "The room is polished, but the feeling stays generous, lively, and familiar.",
  },
];

const serviceNotes = [
  "A table set for unhurried evenings.",
  "Food served with the pace of conversation.",
  "A Birmingham room with Nigerian soul.",
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Our Story",
    description:
      "The story of NaijaGrill — premium Nigerian cuisine in Handsworth, Birmingham.",
    path: "/story",
  });
}

export default async function StoryPage() {
  const heroImage =
    "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=2400&q=85";

  return (
    <div className="bg-ivory">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Our Story", path: "/story" },
        ])}
      />
      <PageHero
        eyebrow="Our Story"
        title="Built on memory, refined for Birmingham."
        description="NaijaGrill is a dining room shaped by Nigerian generosity, open-fire cooking, and the belief that heritage deserves a premium stage."
        image={heroImage}
        imageAlt="Hands preparing ingredients in a professional kitchen"
      >
        <div className="grid max-w-2xl gap-4 text-left sm:grid-cols-3">
          {["Family kitchens", "Charcoal fire", "Handsworth"].map((item) => (
            <span
              key={item}
              className="border-t border-ivory/30 pt-4 text-[0.6875rem] uppercase tracking-[0.22em] text-ivory/70"
            >
              {item}
            </span>
          ))}
        </div>
      </PageHero>

      <main className="bg-ivory">
        <section className="mx-auto grid max-w-[1500px] gap-10 px-6 py-12 md:px-12 md:py-14 lg:grid-cols-[0.86fr_1.14fr] lg:px-16">
          <div className="self-center">
            <p className="editorial-caption mb-4 text-gold">The welcome</p>
            <h2 className="editorial-display text-balance text-[clamp(2.1rem,3.6vw,3.6rem)] font-light leading-[0.98] text-charcoal">
              A Nigerian dining room with Birmingham in its rhythm.
            </h2>
            <div className="mt-5 max-w-xl space-y-4 text-base leading-[1.6] text-stone">
              <p>
                NaijaGrill began with the kind of cooking that fills a home
                before anyone reaches the table: stock warming slowly, pepper
                blooming in oil, smoke settling into meat, and someone always
                making room for one more guest.
              </p>
              <p>
                Today, that spirit lives on Rookery Road in a room made for
                celebration. The food is generous, the service is attentive,
                and every detail is shaped to let Nigerian flavour stand tall.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/menu" className="editorial-button">
                Explore menu
              </Link>
              <Link href="/reservations#reserve" className="editorial-button-dark bg-charcoal">
                Reserve a table
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1.1fr_0.78fr]">
            <div className="image-vignette-side relative min-h-[320px] overflow-hidden rounded-[2.3rem] bg-charcoal shadow-[0_28px_80px_rgba(22,15,11,0.14)]">
              <EditorialImage
                src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1500&q=85"
                alt="Grilled food served with warm restaurant lighting"
                sizes="(max-width: 768px) 100vw, 46vw"
              />
              <div className="absolute bottom-6 left-6 max-w-[15rem] rounded-[1.4rem] bg-ivory/92 p-5 shadow-[0_18px_50px_rgba(22,15,11,0.18)] backdrop-blur">
                <p className="editorial-caption mb-2 text-gold">From the fire</p>
                <p className="text-sm leading-[1.55] text-charcoal">
                  Smoke, spice, and service brought together for evenings that
                  feel full.
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="image-vignette-side relative min-h-[150px] overflow-hidden rounded-[1.8rem] bg-charcoal">
                <EditorialImage
                  src="/images/Naija-grill-and-spice-front.webp"
                  alt="The NaijaGrill storefront on Rookery Road, Handsworth"
                  sizes="(max-width: 768px) 100vw, 24vw"
                />
              </div>
              <div className="rounded-[1.8rem] bg-cream p-7 shadow-[0_20px_60px_rgba(22,15,11,0.08)]">
                <p className="editorial-display text-5xl font-light leading-none text-charcoal">
                  77B
                </p>
                <p className="mt-4 text-sm uppercase tracking-[0.18em] text-gold">
                  Rookery Road
                </p>
                <p className="mt-5 text-sm leading-[1.58] text-stone">
                  A Handsworth address for grilled Nigerian food, cocktails,
                  family tables, and late conversations.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1500px] px-6 pb-16 md:px-12 md:pb-20 lg:px-16">
          <div className="grid gap-5 md:grid-cols-3">
            {originNotes.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.75rem] bg-cream/85 p-7 shadow-[0_18px_60px_rgba(22,15,11,0.07)]"
              >
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-[0.65rem] uppercase tracking-[0.18em] text-gold">
                  {item.label.slice(0, 2)}
                </div>
                <h3 className="editorial-display text-3xl font-light leading-[1.02] text-charcoal">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-[1.62] text-stone">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-charcoal px-6 py-16 text-ivory md:px-12 md:py-20 lg:px-16">
          <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="relative order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
              <div className="image-vignette relative min-h-[360px] overflow-hidden rounded-[2rem] bg-burgundy sm:translate-y-8">
                <EditorialImage
                  src="/images/naija-grill-and-spice-room1.jpg"
                  alt="The NaijaGrill dining room set for service"
                  sizes="(max-width: 1024px) 100vw, 28vw"
                />
              </div>
              <div className="image-vignette-side relative min-h-[360px] overflow-hidden rounded-[2rem] bg-charcoal">
                <EditorialImage
                  src="/images/naija-grill-and-spice-table.jpg"
                  alt="A NaijaGrill dining table set for service"
                  sizes="(max-width: 1024px) 100vw, 28vw"
                />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <p className="editorial-caption mb-5 text-gold">The room</p>
              <h2 className="editorial-display max-w-2xl text-[clamp(2.5rem,5vw,5.2rem)] font-light leading-[0.98] text-ivory">
                Built for food that brings the table closer.
              </h2>
              <p className="mt-7 max-w-xl text-base leading-[1.65] text-ivory/70 md:text-lg">
                We want the restaurant to feel alive before the first plate
                lands. Music low enough for stories, plates generous enough to
                share, and service that knows when to guide and when to let the
                evening unfold.
              </p>
              <div className="mt-10 space-y-4">
                {serviceNotes.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 rounded-full border border-ivory/10 px-5 py-4"
                  >
                    <span className="h-2 w-2 rounded-full bg-gold" />
                    <p className="text-sm uppercase tracking-[0.14em] text-ivory/72">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <GallerySection images={galleryImages} />
      </main>
    </div>
  );
}
