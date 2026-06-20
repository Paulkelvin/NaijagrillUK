import Link from "next/link";
import { OpeningHours } from "@/components/local/OpeningHours";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import {
  BUSINESS,
  formattedAddress,
  googleMapsDirectionsUrl,
} from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqSchema,
  localBusinessSchema,
} from "@/lib/seo/structured-data";
import { getOpeningHours } from "@/sanity/fetch";
import type { FaqItem } from "@/sanity/types";

const path = "/handsworth-wood";

const faqs: FaqItem[] = [
  {
    question: "Is NaijaGrill in Handsworth Wood?",
    answer:
      "NaijaGrill is on Rookery Road in Handsworth — B21 — which shares its border with Handsworth Wood (B20). The two areas meet along Rookery Road itself, so it's genuinely your local restaurant.",
  },
  {
    question: "Can I book a table for a group from Handsworth Wood?",
    answer:
      "Yes. The dining room seats around 25. Reserve at naijagrillandspice.co.uk/reservations or call 07438 757560 to discuss your group.",
  },
  {
    question: "Do you deliver to Handsworth Wood?",
    answer:
      "Yes — order on Uber Eats for delivery. Given how close you are, collection is also worth considering. Call or WhatsApp 07438 757560.",
  },
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Nigerian Restaurant Handsworth Wood | NaijaGrill — On Your Doorstep",
    description:
      "NaijaGrill is on Rookery Road — the boundary between Handsworth and Handsworth Wood. Nigerian food for B20: egusi, chicken suya, ayamase, and more. Open daily 2pm–11pm.",
    path,
    keywords: [
      "Nigerian restaurant Handsworth Wood",
      "Nigerian food Handsworth Wood",
      "African restaurant B20 Birmingham",
      "Nigerian food near Handsworth Wood",
    ],
  });
}

export default async function HandsworthWoodPage() {
  const hours = await getOpeningHours();

  return (
    <div className="overflow-hidden bg-ivory">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Nigerian Restaurant Handsworth Wood", path },
          ]),
          faqSchema(faqs)!,
          localBusinessSchema(),
        ]}
      />

      <PageHero
        eyebrow="Nigerian Food in Handsworth Wood"
        title="Rookery Road is your boundary. NaijaGrill is on it."
        description="B20 meets B21 on Rookery Road. NaijaGrill is right there — Nigerian cooking on your doorstep. Dine in, collect, or order on Uber Eats."
        image="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=2400&q=85"
        imageAlt="Nigerian food at NaijaGrill Handsworth Wood"
        heightClassName="min-h-[70vh]"
      >
        <div className="flex flex-wrap gap-4">
          <Link
            href="/reservations#reserve"
            className="inline-flex rounded-full bg-gold px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-charcoal transition-transform hover:-translate-y-0.5"
          >
            Reserve a table
          </Link>
          <UberEatsLink
            label="Handsworth Wood hero"
            className="inline-flex rounded-full border border-ivory/25 bg-ivory/10 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory backdrop-blur transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Order on Uber Eats
          </UberEatsLink>
        </div>
      </PageHero>

      <section className="mx-auto max-w-[1100px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <p className="editorial-caption mb-4 text-gold">Handsworth Wood, B20</p>
        <h2 className="editorial-display mb-8 text-5xl font-light leading-[0.95] text-charcoal md:text-6xl">
          Your local Nigerian restaurant — no journey needed.
        </h2>
        <div className="grid gap-5 text-base leading-[1.75] text-stone lg:grid-cols-2">
          <div className="grid gap-5">
            <p>
              Handsworth Wood (B20) and Handsworth (B21) share Rookery Road.
              NaijaGrill sits at 77B, which means for most of Handsworth Wood,
              this is genuinely the nearest Nigerian restaurant — not the nearest
              after a drive, just the nearest. That's worth knowing.
            </p>
            <p>
              The Egusi &amp; Pounded Yam is one of the dishes that brings people
              back. Egusi is made from ground melon seeds, cooked slowly in palm
              oil with leafy greens, stockfish, and protein — it builds a deep,
              nutty richness that sits in the soup long after the first spoonful.
              Pounded yam has a stretch and a weight to it that makes it the
              natural partner: you pull a piece, roll it in the palm of your hand
              and dip it straight into the soup. No cutlery required if you don't
              want it.
            </p>
          </div>
          <div className="grid gap-5">
            <p>
              The Chicken Suya — wings marinated in yaji spice and grilled over
              charcoal — is one for the table to share. The White Rice with
              Ayamase is for those who like their sauce to have heat and
              character: ayamase is a green pepper stew, slow-cooked until it
              darkens and concentrates, with assorted offal and meat cooked into
              it. It's not subtle, and it's not meant to be.
            </p>
            <p>
              Dine-in is the primary option when you're this close. Reserve a
              table at{" "}
              <Link href="/reservations#reserve" className="text-charcoal underline decoration-gold/50 underline-offset-4">
                naijagrillandspice.co.uk/reservations
              </Link>
              . Call or WhatsApp on{" "}
              <a href={`tel:${BUSINESS.phone}`} className="text-charcoal underline decoration-gold/50 underline-offset-4">
                07438 757560
              </a>{" "}
              for collection. Uber Eats delivers if you'd rather not leave the house.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream px-6 py-16 md:px-12 md:py-20 lg:px-16">
        <div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="editorial-caption mb-4 text-gold">Location &amp; Hours</p>
            <h2 className="editorial-display text-4xl font-light leading-[0.95] text-charcoal md:text-5xl">
              77B Rookery Road — the Handsworth Wood border.
            </h2>
            <p className="mt-5 text-base leading-[1.75] text-stone">{formattedAddress}</p>
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
                href="/reservations#reserve"
                className="inline-flex rounded-full bg-charcoal px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-burgundy"
              >
                Book a table
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] bg-ivory p-6 shadow-[0_22px_70px_rgba(22,15,11,0.08)]">
            <p className="editorial-caption mb-5 text-gold">Opening hours</p>
            <OpeningHours hours={hours} variant="detailed" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 py-16 md:px-12 md:py-20 lg:px-16">
        <p className="editorial-caption mb-4 text-gold">FAQ</p>
        <h2 className="editorial-display text-4xl font-light leading-[0.95] text-charcoal md:text-5xl">
          What Handsworth Wood asks us.
        </h2>
        <div className="mt-10 grid gap-4">
          {faqs.map((faq) => (
            <details key={faq.question} className="rounded-[1.5rem] bg-cream p-6">
              <summary className="cursor-pointer text-lg font-black text-charcoal">
                {faq.question}
              </summary>
              <p className="mt-4 text-sm leading-[1.7] text-stone">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-burgundy px-6 py-16 text-center text-ivory md:px-12 md:py-20">
        <p className="editorial-caption mb-4 text-gold">You&apos;re local.</p>
        <h2 className="mx-auto max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] md:text-7xl">
          Reserve a table at your neighbourhood Nigerian restaurant.
        </h2>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link
            href="/reservations#reserve"
            className="inline-flex rounded-full bg-gold px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-charcoal"
          >
            Reserve a table
          </Link>
          <UberEatsLink
            label="Handsworth Wood final CTA"
            className="inline-flex rounded-full border border-ivory/20 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Order on Uber Eats
          </UberEatsLink>
        </div>
      </section>
    </div>
  );
}
