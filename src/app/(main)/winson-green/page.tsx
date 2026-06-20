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

const path = "/winson-green";

const faqs: FaqItem[] = [
  {
    question: "How far is NaijaGrill from Winson Green?",
    answer:
      "About ten to fifteen minutes by car. Winson Green is B18, NaijaGrill is on Rookery Road in Handsworth, B21. Uber Eats delivers if you'd rather not make the journey.",
  },
  {
    question: "Can NaijaGrill cater for events in Winson Green?",
    answer:
      "Yes. We cater off-site for community dinners, celebrations, and gatherings of any size. Send an event enquiry through the website and the team will come back to you with a quote.",
  },
  {
    question: "What Nigerian food does NaijaGrill serve?",
    answer:
      "Jollof rice, suya, grilled fish, egusi, amala, efo riro, pepper soup, small chops, and more. See the full menu at naijagrillandspice.co.uk/menu.",
  },
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Nigerian Food Winson Green | NaijaGrill — 10 Minutes Away",
    description:
      "NaijaGrill is 10–15 minutes from Winson Green (B18) on Rookery Road, Handsworth. Party jollof, peppered hake, efo riro, Nigerian catering. Open daily 2pm–11pm.",
    path,
    keywords: [
      "Nigerian food Winson Green",
      "Nigerian restaurant Winson Green Birmingham",
      "African food near Winson Green",
      "Nigerian catering Winson Green",
    ],
  });
}

export default async function WinsonGreenPage() {
  const hours = await getOpeningHours();

  return (
    <div className="overflow-hidden bg-ivory">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Nigerian Food Winson Green", path },
          ]),
          faqSchema(faqs)!,
          localBusinessSchema(),
        ]}
      />

      <PageHero
        eyebrow="Nigerian Food Near Winson Green"
        title="Proper Nigerian cooking — ten minutes from Winson Green."
        description="NaijaGrill on Rookery Road, Handsworth is the nearest proper Nigerian restaurant to Winson Green. Party jollof, efo riro, peppered fish, and Nigerian catering."
        image="https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=2400&q=85"
        imageAlt="Nigerian food at NaijaGrill near Winson Green"
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
            label="Winson Green hero"
            className="inline-flex rounded-full border border-ivory/25 bg-ivory/10 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory backdrop-blur transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Order on Uber Eats
          </UberEatsLink>
        </div>
      </PageHero>

      <section className="mx-auto max-w-[1100px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <p className="editorial-caption mb-4 text-gold">Winson Green, B18</p>
        <h2 className="editorial-display mb-8 text-5xl font-light leading-[0.95] text-charcoal md:text-6xl">
          Nigerian food worth the short trip from B18.
        </h2>
        <div className="grid gap-5 text-base leading-[1.75] text-stone lg:grid-cols-2">
          <div className="grid gap-5">
            <p>
              Winson Green is a dense, diverse part of Birmingham — a community
              with real texture and people who take food seriously. NaijaGrill is
              the nearest proper Nigerian restaurant: on Rookery Road in
              Handsworth, about ten to fifteen minutes up the road. The short
              trip is worth it, and Uber Eats covers Winson Green if you'd
              rather eat at home.
            </p>
            <p>
              The Party Jollof is the version of jollof rice that gets served at
              Nigerian parties and celebrations — cooked in a large pot, open
              flame underneath, with the tomato base building over time and the
              bottom catching slightly against the heat. That smoky crust, folded
              through the rest of the pot when you serve it, is what separates
              Party Jollof from every other version. It's the dish most Nigerians
              in Birmingham are thinking of when they say they want jollof.
            </p>
          </div>
          <div className="grid gap-5">
            <p>
              The Peppered Hake Fish is whole fish, slow-cooked in a thick
              pepper sauce — hot, rich, deeply flavoured. The Efo Riro is a Yoruba
              spinach stew, built on a pepper base with stockfish and assorted
              meat, and it has a depth that rewards eating slowly. The Suya
              Chicken Wings are charcoal-grilled and yaji-spiced — order them to
              share at the table before the mains.
            </p>
            <p>
              Winson Green has a strong tradition of community events and
              gatherings, and NaijaGrill caters off-site for exactly those
              occasions — dinners, celebrations, corporate trays. Send an enquiry
              through the{" "}
              <Link href="/events-catering#enquiry" className="text-charcoal underline decoration-gold/50 underline-offset-4">
                events and catering page
              </Link>{" "}
              and the team will come back to you. Or call{" "}
              <a href={`tel:${BUSINESS.phone}`} className="text-charcoal underline decoration-gold/50 underline-offset-4">
                07438 757560
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream px-6 py-16 md:px-12 md:py-20 lg:px-16">
        <div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="editorial-caption mb-4 text-gold">Location &amp; Hours</p>
            <h2 className="editorial-display text-4xl font-light leading-[0.95] text-charcoal md:text-5xl">
              Rookery Road, Handsworth — ten minutes from Winson Green.
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
          Common questions from Winson Green.
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
        <p className="editorial-caption mb-4 text-gold">Ready when you are.</p>
        <h2 className="mx-auto max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] md:text-7xl">
          Order Nigerian food to Winson Green or book a table.
        </h2>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link
            href="/reservations#reserve"
            className="inline-flex rounded-full bg-gold px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-charcoal"
          >
            Reserve a table
          </Link>
          <UberEatsLink
            label="Winson Green final CTA"
            className="inline-flex rounded-full border border-ivory/20 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Order on Uber Eats
          </UberEatsLink>
        </div>
      </section>
    </div>
  );
}
