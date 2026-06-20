import Link from "next/link";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { BUSINESS } from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";

const path = "/menu/suya";

export async function generateMetadata() {
  return buildMetadata({
    title: "Suya Birmingham | Beef Suya & Chicken Suya at NaijaGrill",
    description:
      "NaijaGrill's beef suya — thin-cut, charcoal-grilled, yaji-spiced Nigerian street food in Handsworth, Birmingham. Also available: Chicken Suya and Suya Chicken Wings.",
    path,
    keywords: [
      "suya Birmingham",
      "beef suya Birmingham",
      "Nigerian suya Handsworth",
      "suya near me Birmingham",
    ],
  });
}

export default function SuyaPage() {
  return (
    <div className="overflow-hidden bg-ivory">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Menu", path: "/menu" },
            { name: "Suya", path },
          ]),
        ]}
      />

      <PageHero
        eyebrow="Suya — NaijaGrill Birmingham"
        title="Charcoal. Yaji. The smell of a proper Nigerian grill."
        description="Beef Suya at NaijaGrill is thin-cut, spiced with yaji, and grilled over charcoal until the edges catch. Also available as Chicken Suya and Suya Chicken Wings."
        image="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=2400&q=85"
        imageAlt="Beef Suya grilled over charcoal at NaijaGrill Birmingham"
        heightClassName="min-h-[65vh]"
      >
        <div className="flex flex-wrap gap-4">
          <UberEatsLink
            label="Suya dish page hero"
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
          Street food from northern Nigeria, now on Rookery Road.
        </h2>
        <div className="grid gap-5 text-base leading-[1.75] text-stone lg:grid-cols-2">
          <div className="grid gap-5">
            <p>
              Suya started as street food in northern Nigeria — Hausa vendors
              grilling spiced meat on open skewers, selling it by the roadside
              at night. It spread south through the country and became something
              everyone claims now: Lagos street corners, Lagos Island bars,
              parties in Birmingham living rooms with the foil on the table and
              the newspaper underneath. Suya is that dish.
            </p>
            <p>
              The spice rub is yaji — a dry blend built on ground roasted
              peanuts, ginger, paprika, chilli flakes, and a mix of other spices
              that varies by the cook. The peanut base is what distinguishes it
              from other spiced grilled meats: it forms a crust on the outside of
              the meat as it cooks, charring at the edges where the heat is
              highest. The flavour is savoury and layered — warm from the ginger
              and chilli, but not the sharp, immediate heat of fresh pepper. It
              builds as you eat.
            </p>
          </div>
          <div className="grid gap-5">
            <p>
              At NaijaGrill, the Beef Suya is thin-cut beef, coated in yaji and
              cooked over charcoal. It comes off the grill with a char on the
              outside, still tender inside, and it's finished with raw sliced
              onion and a little fresh chilli. The smoke from the charcoal is
              part of the flavour — you can taste it in the meat. That's not
              something you get from a gas grill or an oven.
            </p>
            <p>
              The Chicken Suya uses the same yaji spice on chicken pieces. The
              Suya Chicken Wings are the version for sharing — charcoal-grilled,
              sticky at the edges, good as a starter or to pass around the table.
              Suya works as a snack, a starter, or alongside jollof rice and
              fried plantain as part of a bigger meal.
            </p>
            <p>
              Order on Uber Eats for delivery, or come to {BUSINESS.address.street}{" "}
              and eat it fresh. Table reservations at{" "}
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
          Beef Suya, Chicken Suya, Suya Wings. Delivered or dine-in.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <UberEatsLink
            label="Suya dish page CTA"
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
