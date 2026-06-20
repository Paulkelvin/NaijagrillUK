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

const path = "/perry-barr";

const faqs: FaqItem[] = [
  {
    question: "How far is NaijaGrill from Perry Barr?",
    answer:
      "About ten minutes by car or bus. Perry Barr is B42, NaijaGrill is on Rookery Road in Handsworth, B21. The 74 and 79 bus routes connect the two areas directly.",
  },
  {
    question: "Can I get Nigerian food delivered to Perry Barr from NaijaGrill?",
    answer:
      "Yes. Order through Uber Eats for delivery to Perry Barr. For collection, call or WhatsApp 07438 757560.",
  },
  {
    question: "Does NaijaGrill cater for events in Perry Barr?",
    answer:
      "Yes. We cater off-site for any number of guests — celebrations, community dinners, corporate trays. Send an event enquiry through the website and we'll come back to you.",
  },
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Nigerian Food Perry Barr | NaijaGrill — 10 Minutes Away",
    description:
      "Looking for Nigerian food near Perry Barr? NaijaGrill on Rookery Road is a ten-minute drive from B42 — jollof rice, suya, grilled fish, and Nigerian catering.",
    path,
    keywords: [
      "Nigerian food Perry Barr",
      "Nigerian restaurant Perry Barr Birmingham",
      "African food near Perry Barr",
      "Nigerian takeaway Perry Barr",
    ],
  });
}

export default async function PerryBarrPage() {
  const hours = await getOpeningHours();

  return (
    <div className="overflow-hidden bg-ivory">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Nigerian Food Perry Barr", path },
          ]),
          faqSchema(faqs)!,
          localBusinessSchema(),
        ]}
      />

      <PageHero
        eyebrow="Nigerian Food Near Perry Barr"
        title="Ten minutes from Perry Barr. Nigerian food worth the trip."
        description="NaijaGrill on Rookery Road serves Perry Barr with jollof rice, suya, grilled fish, and proper Nigerian cooking — dine-in, delivery, and catering."
        image="https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=2400&q=85"
        imageAlt="Nigerian food at NaijaGrill near Perry Barr"
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
            label="Perry Barr hero"
            className="inline-flex rounded-full border border-ivory/25 bg-ivory/10 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory backdrop-blur transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Order on Uber Eats
          </UberEatsLink>
        </div>
      </PageHero>

      <section className="mx-auto max-w-[1100px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <p className="editorial-caption mb-4 text-gold">Perry Barr, Birmingham</p>
        <h2 className="editorial-display mb-8 text-5xl font-light leading-[0.95] text-charcoal md:text-6xl">
          Nigerian cooking on Rookery Road, a short ride from B42.
        </h2>
        <div className="grid gap-5 text-base leading-[1.75] text-stone lg:grid-cols-2">
          <div className="grid gap-5">
            <p>
              Perry Barr is a busy, mixed part of Birmingham — commuter routes,
              One Stop, the athletics stadium — and the Nigerian food options
              nearby are limited. NaijaGrill is on Rookery Road in Handsworth,
              ten minutes away by car or bus. B42 to B21. Close enough that
              delivery gets to you hot, close enough that coming in for the
              evening makes sense.
            </p>
            <p>
              The jollof rice here is the Party Jollof — cooked in a pot over
              fire the way it's meant to be, with the smoky bottom crust that
              comes from letting it catch properly. It's a full meal on its own,
              better with plantain alongside it. The Beef Suya is thin-cut and
              grilled over charcoal, dressed with yaji spice and raw onion — the
              kind of thing you finish before you've decided whether you wanted
              more.
            </p>
          </div>
          <div className="grid gap-5">
            <p>
              The Grilled Fish comes whole, over flame, with a pepper sauce that
              does a lot of the work. Fried yam and sweet plantain on the side.
              For something lighter to start — or to share round the table — the
              Small Chops Platter covers puff puff, samosas, spring rolls, and
              chicken. It's the thing you order when you're not sure what
              everyone wants, and it always lands well.
            </p>
            <p>
              Order through Uber Eats for delivery. Call or WhatsApp{" "}
              <a href={`tel:${BUSINESS.phone}`} className="text-charcoal underline decoration-gold/50 underline-offset-4">
                07438 757560
              </a>{" "}
              to arrange collection. Or book a table and come in — we're open
              from 2pm every day.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream px-6 py-16 md:px-12 md:py-20 lg:px-16">
        <div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="editorial-caption mb-4 text-gold">Location &amp; Hours</p>
            <h2 className="editorial-display text-4xl font-light leading-[0.95] text-charcoal md:text-5xl">
              Find us on Rookery Road.
            </h2>
            <p className="mt-5 text-base leading-[1.75] text-stone">{formattedAddress}</p>
            <p className="mt-3 text-sm leading-[1.7] text-stone">
              From Perry Barr take the A34 south toward Handsworth — about ten
              minutes. Street parking available on Rookery Road and surrounding
              streets.
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
          Questions from Perry Barr.
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
        <p className="editorial-caption mb-4 text-gold">Ready to eat?</p>
        <h2 className="mx-auto max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] md:text-7xl">
          Book a table or order NaijaGrill to Perry Barr.
        </h2>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link
            href="/reservations#reserve"
            className="inline-flex rounded-full bg-gold px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-charcoal"
          >
            Reserve a table
          </Link>
          <UberEatsLink
            label="Perry Barr final CTA"
            className="inline-flex rounded-full border border-ivory/20 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Order on Uber Eats
          </UberEatsLink>
        </div>
      </section>
    </div>
  );
}
