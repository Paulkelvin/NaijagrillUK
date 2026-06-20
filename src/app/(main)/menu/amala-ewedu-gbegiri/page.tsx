import Link from "next/link";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { BUSINESS } from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/structured-data";
import type { FaqItem } from "@/sanity/types";

const path = "/menu/amala-ewedu-gbegiri";

const faqs: FaqItem[] = [
  {
    question: "What is Abula?",
    answer:
      "Abula is the Yoruba name for the combination of amala, ewedu, and gbegiri served together — sometimes with pepper stew and meat poured over. It's one of the definitive Yoruba meals.",
  },
  {
    question: "What does amala taste like?",
    answer:
      "Amala has an earthy, slightly bitter flavour and a dark brownish colour — made from dried and ground yam flour. The taste is distinct and satisfying, not neutral like poundo.",
  },
  {
    question: "Can I order amala on Uber Eats from NaijaGrill?",
    answer:
      "Yes. Amala, Ewedu & Gbegiri is available on NaijaGrill's Uber Eats menu for delivery across Birmingham.",
  },
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Amala Birmingham | Amala Ewedu Gbegiri (Abula) at NaijaGrill",
    description:
      "NaijaGrill serves Amala, Ewedu & Gbegiri (Abula) from Handsworth, Birmingham. Proper Yoruba cooking. Order on Uber Eats or reserve a table. Open daily 2pm.",
    path,
    keywords: [
      "amala Birmingham",
      "abula Birmingham",
      "amala ewedu gbegiri Birmingham",
      "Yoruba food Birmingham",
    ],
  });
}

export default function AmalaPage() {
  return (
    <div className="overflow-hidden bg-ivory">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Menu", path: "/menu" },
            { name: "Amala, Ewedu & Gbegiri", path },
          ]),
          faqSchema(faqs)!,
        ]}
      />

      <PageHero
        eyebrow="Amala, Ewedu & Gbegiri — NaijaGrill Birmingham"
        title="Three components. One combination that Yoruba cooking built its reputation on."
        description="NaijaGrill serves Amala, Ewedu & Gbegiri — the classic Abula combination — from the kitchen in Handsworth. For those who grew up eating it, there's nothing quite like it."
        image="https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=2400&q=85"
        imageAlt="Amala ewedu gbegiri abula at NaijaGrill Birmingham"
        heightClassName="min-h-[65vh]"
      >
        <div className="flex flex-wrap gap-4">
          <UberEatsLink
            label="Amala dish page hero"
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
          Abula — the Yoruba combination that works like nothing else.
        </h2>
        <div className="grid gap-5 text-base leading-[1.75] text-stone lg:grid-cols-2">
          <div className="grid gap-5">
            <p>
              Amala is dark — almost chocolate-brown — made from dried yam flour
              mixed with boiling water until it forms a smooth, dense swallow. It
              has an earthy, slightly bitter flavour that is completely its own.
              It's not neutral like poundo. It has a character. People who grew
              up eating amala have strong opinions about it, and those opinions
              are usually very positive.
            </p>
            <p>
              Ewedu is a soup made from jute leaves — silky, light, with a
              slightly mucilaginous texture that coats the amala and carries it.
              It's mild on its own, which is part of the point: it acts as a
              bridge between the dense swallow and the heavier soups that
              accompany it. Gbegiri is made from blended cooked beans —
              creamy, mild, slightly sweet, a counterpoint to the bitterness of
              the amala and the earthiness of the ewedu.
            </p>
          </div>
          <div className="grid gap-5">
            <p>
              Together — amala, ewedu, gbegiri, pepper stew, and assorted meat
              poured over the top — this is Abula. It's one of the great
              combinations in Yoruba cooking and one that has a loyal following
              wherever Nigerians have settled. In Birmingham, people come
              specifically for it. For those who haven't tried it before: the
              flavours are deep and savoury, the textures are varied and
              satisfying, and the meal sits differently from rice — more
              grounding, more filling. It's the kind of thing you eat slowly,
              not quickly.
            </p>
            <p>
              NaijaGrill serves Amala, Ewedu &amp; Gbegiri from the kitchen on
              Rookery Road. Order through Uber Eats for delivery, or come in and
              eat it at the table. Reserve at{" "}
              <Link href="/reservations#reserve" className="text-charcoal underline decoration-gold/50 underline-offset-4">
                naijagrillandspice.co.uk/reservations
              </Link>{" "}
              — open daily from 2pm to 11pm.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-16 md:px-12 md:pb-20 lg:px-16">
        <p className="editorial-caption mb-4 text-gold">FAQ</p>
        <h2 className="editorial-display text-4xl font-light leading-[0.95] text-charcoal md:text-5xl">
          Questions about amala and Abula.
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
          Amala, Ewedu &amp; Gbegiri. From {BUSINESS.address.area}, delivered or dine-in.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <UberEatsLink
            label="Amala dish page CTA"
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
