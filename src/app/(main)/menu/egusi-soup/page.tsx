import Link from "next/link";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { BUSINESS } from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/structured-data";
import type { FaqItem } from "@/sanity/types";

const path = "/menu/egusi-soup";

const faqs: FaqItem[] = [
  {
    question: "What do you eat egusi soup with?",
    answer:
      "Swallow — pounded yam, poundo, eba, or amala. At NaijaGrill it's served as Poundo with Egusi or Egusi & Pounded Yam. You pull pieces of the swallow and dip them into the soup.",
  },
  {
    question: "Is egusi soup spicy?",
    answer:
      "It has pepper in the base, so yes — there's heat. It's a warm, rounded spice from scotch bonnet rather than a sharp burn.",
  },
  {
    question: "Can I order egusi soup on Uber Eats?",
    answer:
      "Yes. Order Poundo with Egusi or Egusi & Pounded Yam through Uber Eats for delivery across Birmingham.",
  },
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Egusi Soup Birmingham | Poundo with Egusi at NaijaGrill",
    description:
      "NaijaGrill serves Egusi & Pounded Yam and Poundo with Egusi from the kitchen in Handsworth, Birmingham. Order on Uber Eats or reserve a table. Open daily 2pm.",
    path,
    keywords: [
      "egusi soup Birmingham",
      "egusi soup near me",
      "pounded yam egusi Birmingham",
      "Nigerian egusi Handsworth",
    ],
  });
}

export default function EgusiSoupPage() {
  return (
    <div className="overflow-hidden bg-ivory">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Menu", path: "/menu" },
            { name: "Egusi Soup", path },
          ]),
          faqSchema(faqs)!,
        ]}
      />

      <PageHero
        eyebrow="Egusi Soup — NaijaGrill Birmingham"
        title="Ground melon seeds. Palm oil. The kind of soup that eats like a meal."
        description="NaijaGrill serves Egusi & Pounded Yam and Poundo with Egusi from the kitchen in Handsworth. Rich, nutty, deeply savoury — one of the great combinations in Nigerian cooking."
        image="https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=2400&q=85"
        imageAlt="Egusi soup with pounded yam at NaijaGrill Birmingham"
        heightClassName="min-h-[65vh]"
      >
        <div className="flex flex-wrap gap-4">
          <UberEatsLink
            label="Egusi dish page hero"
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
          One of the most beloved soups in Nigerian cooking.
        </h2>
        <div className="grid gap-5 text-base leading-[1.75] text-stone lg:grid-cols-2">
          <div className="grid gap-5">
            <p>
              Egusi soup is made from ground melon seeds — the seeds of a
              gourd-like plant related to watermelon, dried and milled into a
              pale, oily flour. Cooked in palm oil with a tomato and pepper
              base, leafy greens, stockfish, and your protein of choice, the
              ground seeds form a thick, deeply savoury stew. The flavour is
              nutty, slightly bitter from the greens, rich from the palm oil —
              it's not like anything else on the menu. It's a Yoruba and Igbo
              staple, eaten across the country, and every family has their own
              version of what goes in and how much pepper it needs.
            </p>
            <p>
              The way you eat it matters. Egusi is not a soup you serve with
              rice. It goes with swallow — pounded yam, poundo, eba, or amala.
              Swallow is the collective term for the starchy, dough-like
              accompaniment that you eat alongside Nigerian soups. You pull a
              small piece of the swallow with your hand or a spoon, shape it
              slightly, and dip it into the soup. The swallow carries the egusi
              into your mouth, and the two work together in a way that doesn't
              translate to a fork-and-plate setup. It's filling in a different
              way from rice — heavier, more grounding.
            </p>
          </div>
          <div className="grid gap-5">
            <p>
              At NaijaGrill, egusi soup is served two ways: Egusi &amp; Pounded
              Yam (traditional pounded yam, smooth and stretchy) and Poundo with
              Egusi (poundo is a processed version — consistent texture, milder
              flavour, slightly lighter). The soup itself is built with greens,
              stockfish, and tender meat. It's the version you eat when you want
              something proper — something that takes time to make right and
              tastes like it.
            </p>
            <p>
              Order Poundo with Egusi or Egusi &amp; Pounded Yam through Uber
              Eats for delivery. Or reserve a table and eat it in the dining
              room on Rookery Road — the kind of meal that deserves a table, not
              a takeaway box. Book at{" "}
              <Link href="/reservations#reserve" className="text-charcoal underline decoration-gold/50 underline-offset-4">
                naijagrillandspice.co.uk/reservations
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-16 md:px-12 md:pb-20 lg:px-16">
        <p className="editorial-caption mb-4 text-gold">FAQ</p>
        <h2 className="editorial-display text-4xl font-light leading-[0.95] text-charcoal md:text-5xl">
          Questions about egusi.
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
        <p className="editorial-caption mb-4 text-gold">Order now</p>
        <h2 className="mx-auto max-w-2xl font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] md:text-6xl">
          Egusi &amp; Pounded Yam. Delivered or dine-in from {BUSINESS.address.area}.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <UberEatsLink
            label="Egusi dish page CTA"
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
