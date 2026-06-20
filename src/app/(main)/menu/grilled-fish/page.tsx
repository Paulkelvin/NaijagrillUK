import Link from "next/link";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { BUSINESS } from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";

const path = "/menu/grilled-fish";

export async function generateMetadata() {
  return buildMetadata({
    title: "Grilled Fish Birmingham | Nigerian Grilled Fish at NaijaGrill",
    description:
      "NaijaGrill's Grilled Fish — whole fish, charred over flame, served in pepper sauce with fried yam and sweet plantain. Handsworth, Birmingham. Open daily 2pm.",
    path,
    keywords: [
      "grilled fish Birmingham",
      "Nigerian grilled fish Birmingham",
      "whole grilled fish Handsworth",
      "Nigerian fish near me Birmingham",
    ],
  });
}

export default function GrilledFishPage() {
  return (
    <div className="overflow-hidden bg-ivory">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Menu", path: "/menu" },
            { name: "Grilled Fish", path },
          ]),
        ]}
      />

      <PageHero
        eyebrow="Grilled Fish — NaijaGrill Birmingham"
        title="Whole fish. Open flame. Pepper sauce that earns it."
        description="NaijaGrill's Grilled Fish is charred over fire and served in a thick Nigerian pepper sauce with fried yam and sweet plantain — the combination that makes this dish what it is."
        image="https://images.unsplash.com/photo-1519984388953-d2406bc725e1?auto=format&fit=crop&w=2400&q=85"
        imageAlt="Grilled fish in pepper sauce at NaijaGrill Birmingham"
        heightClassName="min-h-[65vh]"
      >
        <div className="flex flex-wrap gap-4">
          <UberEatsLink
            label="Grilled Fish dish page hero"
            className="inline-flex rounded-full bg-gold px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-charcoal transition-transform hover:-translate-y-0.5"
          >
            Order on Uber Eats
          </UberEatsLink>
          <Link
            href="/reservations#reserve"
            className="inline-flex rounded-full border border-ivory/25 bg-ivory/10 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory backdrop-blur transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Dine in
          </Link>
        </div>
      </PageHero>

      <section className="mx-auto max-w-[1100px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <p className="editorial-caption mb-4 text-gold">The dish</p>
        <h2 className="editorial-display mb-8 text-5xl font-light leading-[0.95] text-charcoal md:text-6xl">
          The best thing about a whole fish is the skin.
        </h2>
        <div className="grid gap-5 text-base leading-[1.75] text-stone lg:grid-cols-2">
          <div className="grid gap-5">
            <p>
              The Grilled Fish at NaijaGrill comes out whole — skin charred and
              pulling back from the flesh at the edges, the outside dark where
              the grill ran hottest. Underneath the char, the fish is moist. The
              pepper sauce it sits in is thick and deeply coloured — built on
              tomatoes, scotch bonnet, onions, and spices that have cooked down
              together until the rawness is completely gone and what's left is
              something concentrated and intense.
            </p>
            <p>
              The sauce is where the heat lives. It's not a garnish — it's part
              of the dish, and the fish needs it. You eat through the charred
              exterior and into the flaking flesh with the sauce coating
              everything, and the combination of the smoke from the grill and the
              pepper from the sauce is the point of the whole thing.
            </p>
          </div>
          <div className="grid gap-5">
            <p>
              Fried yam and sweet plantain come alongside. The fried yam has
              a slight crisp on the outside, starchy and filling within. The
              plantain is ripe — soft, caramelised, sweet — and it does exactly
              what you want it to do against the heat of the sauce. This is
              why these three things are always served together. They balance
              each other.
            </p>
            <p>
              NaijaGrill also serves Peppered Hake Fish — a different
              preparation, whole hake slow-cooked in the pepper sauce rather
              than grilled — for those who want the sauce as the primary event
              rather than the char.
            </p>
            <p>
              Order on Uber Eats for delivery, or come to{" "}
              {BUSINESS.address.street} and eat it at the table. Open from 2pm.
              Reserve at{" "}
              <Link href="/reservations#reserve" className="text-charcoal underline decoration-gold/50 underline-offset-4">
                naijagrillandspice.co.uk/reservations
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-burgundy px-6 py-16 text-center text-ivory md:px-12 md:py-20">
        <p className="editorial-caption mb-4 text-gold">Order now</p>
        <h2 className="mx-auto max-w-2xl font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] md:text-6xl">
          Grilled Fish. Handsworth, Birmingham — delivered or dine-in.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <UberEatsLink
            label="Grilled Fish dish page CTA"
            className="inline-flex rounded-full bg-gold px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-charcoal"
          >
            Order on Uber Eats
          </UberEatsLink>
          <Link
            href="/reservations#reserve"
            className="inline-flex rounded-full border border-ivory/20 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Book a table
          </Link>
        </div>
      </section>
    </div>
  );
}
