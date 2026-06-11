import Link from "next/link";
import { OpeningHours } from "@/components/local/OpeningHours";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { ReviewProof } from "@/components/reviews/ReviewProof";
import { JsonLd } from "@/components/seo/JsonLd";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { PageHero } from "@/components/ui/PageHero";
import {
  BUSINESS,
  formattedAddress,
  googleMapsDirectionsUrl,
} from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/structured-data";
import { getOpeningHours, getTestimonials } from "@/sanity/fetch";
import type { FaqItem } from "@/sanity/types";

const path = "/nigerian-restaurant-birmingham";

const signatureDishes = [
  {
    name: "Jollof Rice",
    body: "Smoky Nigerian tomato rice with deep pepper flavour and protein options.",
    image:
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Beef Suya",
    body: "Yaji-spiced grilled beef with onions, chilli heat, and fire from the grill.",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Egusi Soup",
    body: "Melon seed soup with greens, stock, and the comfort of a proper swallow plate.",
    image:
      "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=1200&q=85",
  },
];

const faqs: FaqItem[] = [
  {
    question: "Where is NaijaGrill in Birmingham?",
    answer:
      "NaijaGrill is at 77B Rookery Road in Handsworth, Birmingham, B21 9QU.",
  },
  {
    question: "Can I order Nigerian food from NaijaGrill on Uber Eats?",
    answer:
      "Yes. You can order NaijaGrill favourites through the Uber Eats link on this page.",
  },
  {
    question: "Can I reserve a table?",
    answer:
      "Yes. Use the reservations page to request a table for dinner, birthdays, family meals, and gatherings.",
  },
  {
    question: "Does NaijaGrill offer catering in Birmingham?",
    answer:
      "Yes. NaijaGrill offers Nigerian catering enquiries for weddings, family celebrations, community events, and corporate trays.",
  },
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Nigerian Restaurant Birmingham | NaijaGrill Handsworth",
    description:
      "Visit NaijaGrill, a Nigerian restaurant in Handsworth, Birmingham for jollof rice, suya, egusi, reservations, catering, and Uber Eats delivery.",
    path,
  });
}

function localLandingPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Nigerian Restaurant Birmingham",
    description:
      "Local guide to NaijaGrill, a Nigerian restaurant in Handsworth, Birmingham.",
    url: `${BUSINESS.website}${path}`,
    about: {
      "@type": "Restaurant",
      name: BUSINESS.name,
      servesCuisine: BUSINESS.cuisine,
      address: formattedAddress,
      hasMenu: `${BUSINESS.website}/menu`,
      potentialAction: [
        {
          "@type": "ReserveAction",
          target: `${BUSINESS.website}/reservations`,
        },
        {
          "@type": "OrderAction",
          target: BUSINESS.order.uberEatsUrl,
        },
      ],
    },
  };
}

export default async function NigerianRestaurantBirminghamPage() {
  const [hours, testimonials] = await Promise.all([
    getOpeningHours(),
    getTestimonials(),
  ]);

  return (
    <div className="overflow-hidden bg-ivory">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Nigerian Restaurant Birmingham", path },
          ]),
          faqSchema(faqs)!,
          localLandingPageSchema(),
        ]}
      />

      <PageHero
        eyebrow="Nigerian Restaurant Birmingham"
        title="Nigerian food in Handsworth with fire, flavour, and a warm table."
        description="NaijaGrill serves Nigerian cuisine on Rookery Road in Handsworth, Birmingham, with reservations for dine-in meals and Uber Eats for delivery."
        image="https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=2400&q=85"
        imageAlt="Nigerian food served in a Birmingham restaurant"
        heightClassName="min-h-[74vh]"
      >
        <div className="flex flex-wrap gap-4">
          <Link
            href="/reservations"
            className="inline-flex rounded-full bg-gold px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-charcoal transition-transform hover:-translate-y-0.5"
          >
            Reserve a table
          </Link>
          <UberEatsLink
            label="Local SEO hero"
            className="inline-flex rounded-full border border-ivory/25 bg-ivory/10 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory backdrop-blur transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Order on Uber Eats
          </UberEatsLink>
        </div>
        <ReviewProof variant="dark" compact className="mt-8 max-w-xl" />
      </PageHero>

      <section className="mx-auto grid max-w-[1500px] gap-10 px-6 py-16 md:px-12 md:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:px-16">
        <div>
          <p className="editorial-caption mb-4 text-gold">
            Handsworth, Birmingham
          </p>
          <h2 className="editorial-display text-5xl font-light leading-[0.95] text-charcoal md:text-6xl">
            A local Nigerian restaurant for dinner, delivery, and celebrations.
          </h2>
        </div>
        <div className="grid gap-5 text-base leading-[1.75] text-stone">
          <p>
            NaijaGrill brings Nigerian cooking to Birmingham with generous rice
            plates, soups and swallows, suya, grilled fish, pepper soup, and
            small chops. Visit us in Handsworth for a table-led experience or
            order favourites through Uber Eats.
          </p>
          <p>
            Explore the{" "}
            <Link
              href="/menu"
              className="text-charcoal underline decoration-gold/50 underline-offset-4"
            >
              Nigerian food menu
            </Link>
            , learn more about{" "}
            <Link
              href="/explore-nigerian-cuisine"
              className="text-charcoal underline decoration-gold/50 underline-offset-4"
            >
              Nigerian cuisine
            </Link>
            , or ask about{" "}
            <Link
              href="/private-dining"
              className="text-charcoal underline decoration-gold/50 underline-offset-4"
            >
              events and catering
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-charcoal px-6 py-16 text-ivory md:px-12 md:py-24 lg:px-16">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-10 max-w-3xl">
            <p className="editorial-caption mb-4 text-gold">
              Signature dishes
            </p>
            <h2 className="editorial-display text-5xl font-light leading-[0.95] md:text-6xl">
              Birmingham favourites from the NaijaGrill kitchen.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {signatureDishes.map((dish) => (
              <article
                key={dish.name}
                className="overflow-hidden rounded-[2rem] border border-ivory/10 bg-ivory/[0.06]"
              >
                <div className="relative aspect-[4/3]">
                  <EditorialImage
                    src={dish.image}
                    alt={dish.name}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-black">{dish.name}</h3>
                  <p className="mt-3 text-sm leading-[1.7] text-ivory/70">
                    {dish.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-8 px-6 py-16 md:px-12 md:py-24 lg:grid-cols-[0.7fr_1fr] lg:px-16">
        <div>
          <p className="editorial-caption mb-4 text-gold">Reviews</p>
          <h2 className="editorial-display text-5xl font-light leading-[0.95] text-charcoal md:text-6xl">
            Check what guests say before you book.
          </h2>
          <ReviewProof className="mt-7 rounded-[1.5rem] bg-cream p-6" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.slice(0, 2).map((item) => (
            <figure
              key={item._id}
              className="rounded-[1.75rem] bg-cream p-6 shadow-[0_22px_70px_rgba(22,15,11,0.08)]"
            >
              <blockquote className="editorial-display text-3xl font-light leading-[1.15] text-charcoal">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 border-t border-charcoal/10 pt-4 text-sm font-black text-burgundy">
                {item.author}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="bg-cream px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="editorial-caption mb-4 text-gold">Location</p>
            <h2 className="editorial-display text-5xl font-light leading-[0.95] text-charcoal md:text-6xl">
              Find NaijaGrill on Rookery Road.
            </h2>
            <p className="mt-5 text-base leading-[1.75] text-stone">
              {formattedAddress}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-charcoal/15 px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-charcoal transition-colors hover:border-gold hover:text-burgundy"
              >
                Get directions
              </a>
              <Link
                href="/contact"
                className="inline-flex rounded-full bg-charcoal px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-burgundy"
              >
                Contact us
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] bg-ivory p-6 shadow-[0_22px_70px_rgba(22,15,11,0.08)]">
            <p className="editorial-caption mb-5 text-gold">Opening hours</p>
            <OpeningHours hours={hours} variant="detailed" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <p className="editorial-caption mb-4 text-gold">FAQ</p>
        <h2 className="editorial-display text-5xl font-light leading-[0.95] text-charcoal md:text-6xl">
          Questions about visiting NaijaGrill.
        </h2>
        <div className="mt-10 grid gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="rounded-[1.5rem] bg-cream p-6"
            >
              <summary className="cursor-pointer text-lg font-black text-charcoal">
                {faq.question}
              </summary>
              <p className="mt-4 text-sm leading-[1.7] text-stone">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-burgundy px-6 py-16 text-center text-ivory md:px-12 md:py-24">
        <p className="editorial-caption mb-4 text-gold">Ready to eat?</p>
        <h2 className="mx-auto max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] md:text-7xl">
          Book a table in Handsworth or order NaijaGrill at home.
        </h2>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link
            href="/reservations"
            className="inline-flex rounded-full bg-gold px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-charcoal"
          >
            Reserve a table
          </Link>
          <UberEatsLink
            label="Local SEO final CTA"
            className="inline-flex rounded-full border border-ivory/20 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Order on Uber Eats
          </UberEatsLink>
        </div>
      </section>
    </div>
  );
}
