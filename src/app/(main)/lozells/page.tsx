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

const path = "/lozells";

const faqs: FaqItem[] = [
  {
    question: "Is NaijaGrill close to Lozells?",
    answer:
      "Very close. Lozells and Handsworth are neighbouring areas — NaijaGrill on Rookery Road is a short walk or a two-minute drive from most of Lozells.",
  },
  {
    question: "Can I get Nigerian food delivered to Lozells?",
    answer:
      "Yes — order through Uber Eats. Or call and WhatsApp 07438 757560 for collection. We're open from 2pm to 11pm every day.",
  },
  {
    question: "Does NaijaGrill serve Nigerian swallow dishes?",
    answer:
      "Yes. Amala, Ewedu & Gbegiri, Egusi & Pounded Yam, Poundo with Egusi, and Efo Riro are all on the menu.",
  },
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Nigerian Food Lozells | NaijaGrill — Next Door in Handsworth",
    description:
      "NaijaGrill is practically next door to Lozells — Nigerian food on Rookery Road, Handsworth. Amala, okro seafood soup, asun, and more. Open daily from 2pm.",
    path,
    keywords: [
      "Nigerian food Lozells",
      "Nigerian restaurant Lozells Birmingham",
      "African food near Lozells",
      "Nigerian restaurant near Lozells",
    ],
  });
}

export default async function LozellsPage() {
  const hours = await getOpeningHours();

  return (
    <div className="overflow-hidden bg-ivory">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Nigerian Food Lozells", path },
          ]),
          faqSchema(faqs)!,
          localBusinessSchema(),
        ]}
      />

      <PageHero
        eyebrow="Nigerian Food Near Lozells"
        title="Handsworth is next door. The Nigerian food is right here."
        description="NaijaGrill on Rookery Road sits right on the edge of Handsworth and Lozells — amala, okro seafood soup, asun, and Nigerian cooking served from 2pm daily."
        image="https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=2400&q=85"
        imageAlt="Nigerian food at NaijaGrill near Lozells Birmingham"
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
            label="Lozells hero"
            className="inline-flex rounded-full border border-ivory/25 bg-ivory/10 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory backdrop-blur transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Order on Uber Eats
          </UberEatsLink>
        </div>
      </PageHero>

      <section className="mx-auto max-w-[1100px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <p className="editorial-caption mb-4 text-gold">Lozells, Birmingham</p>
        <h2 className="editorial-display mb-8 text-5xl font-light leading-[0.95] text-charcoal md:text-6xl">
          Nigerian cooking for a neighbourhood that already knows its food.
        </h2>
        <div className="grid gap-5 text-base leading-[1.75] text-stone lg:grid-cols-2">
          <div className="grid gap-5">
            <p>
              Lozells has deep roots in West African and Nigerian community life,
              and the people here don't need convincing that Nigerian food is
              worth eating. They know. NaijaGrill is a short walk from most of
              Lozells — Rookery Road runs right along the boundary between the
              two neighbourhoods. You're practically already here.
            </p>
            <p>
              The Amala, Ewedu &amp; Gbegiri is the dish to know. Amala is dark,
              smooth, earthy — made from dried yam flour. The ewedu is silky,
              slightly slimy in the way that tells you it's made properly, and
              the gbegiri is blended beans, mild and creamy. Together with pepper
              stew and assorted meat poured over, it's one of the most complete
              meals on the menu. For those who grew up on it, there's nothing
              quite like it. For those who haven't tried it, it's a genuine
              revelation.
            </p>
          </div>
          <div className="grid gap-5">
            <p>
              The Okro Seafood Soup is rich and thick, built on seafood and okra
              that gives it that characteristic draw — it coats the swallow
              rather than sliding off it. The Asun is peppered goat — slow-cooked
              and chargrilled, cut small, highly seasoned. Order it as a starter or alongside rice.
            </p>
            <p>
              Delivery to Lozells is on Uber Eats. For collection, call or
              WhatsApp on{" "}
              <a href={`tel:${BUSINESS.phone}`} className="text-charcoal underline decoration-gold/50 underline-offset-4">
                07438 757560
              </a>
              . For dine-in, book a table — we're open from 2pm to 11pm, seven
              days a week.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream px-6 py-16 md:px-12 md:py-20 lg:px-16">
        <div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="editorial-caption mb-4 text-gold">Location &amp; Hours</p>
            <h2 className="editorial-display text-4xl font-light leading-[0.95] text-charcoal md:text-5xl">
              Rookery Road, Handsworth — right next to Lozells.
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
          A few answers.
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
        <p className="editorial-caption mb-4 text-gold">You&apos;re close.</p>
        <h2 className="mx-auto max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] md:text-7xl">
          Book a table or order Nigerian food to Lozells.
        </h2>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link
            href="/reservations#reserve"
            className="inline-flex rounded-full bg-gold px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-charcoal"
          >
            Reserve a table
          </Link>
          <UberEatsLink
            label="Lozells final CTA"
            className="inline-flex rounded-full border border-ivory/20 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-ivory hover:text-charcoal"
          >
            Order on Uber Eats
          </UberEatsLink>
        </div>
      </section>
    </div>
  );
}
