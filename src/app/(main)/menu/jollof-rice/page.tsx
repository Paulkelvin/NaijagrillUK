import Link from "next/link";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { BUSINESS } from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/structured-data";
import type { FaqItem } from "@/sanity/types";

const path = "/menu/jollof-rice";

const faqs: FaqItem[] = [
  {
    question: "Is jollof rice spicy?",
    answer:
      "NaijaGrill's jollof has heat from scotch bonnet peppers — noticeable but not overwhelming. If you're sensitive to spice, ask about the level when you order.",
  },
  {
    question: "Is jollof rice a full meal or a side?",
    answer:
      "At NaijaGrill it's a full meal. It comes with fried plantain and your choice of protein — chicken, beef, or fish. It can also work as a side alongside suya or grilled fish.",
  },
  {
    question: "Can I order jollof rice on Uber Eats?",
    answer:
      "Yes. NaijaGrill's Jollof Rice and Party Jollof are both available through Uber Eats for delivery across Birmingham.",
  },
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Jollof Rice Birmingham | Party Jollof at NaijaGrill Handsworth",
    description:
      "NaijaGrill's Party Jollof — smoky Nigerian tomato rice cooked over fire in Handsworth, Birmingham. Order on Uber Eats or reserve a table. Open daily 2pm–11pm.",
    path,
    keywords: [
      "jollof rice Birmingham",
      "jollof rice Handsworth",
      "Nigerian jollof rice Birmingham",
      "party jollof Birmingham",
    ],
  });
}

export default function JollofRicePage() {
  return (
    <div className="overflow-hidden bg-ivory">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Menu", path: "/menu" },
            { name: "Jollof Rice", path },
          ]),
          faqSchema(faqs)!,
        ]}
      />

      <PageHero
        eyebrow="Jollof Rice — Handsworth, Birmingham"
        title="Smoky. Tomato-rich. Built over fire."
        description="NaijaGrill's Party Jollof is cooked in the pot, open flame underneath, until the rice takes on the smoke and the bottom catches just enough. This is what jollof is supposed to taste like."
        image="https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=2400&q=85"
        imageAlt="Party Jollof Rice at NaijaGrill Birmingham"
        heightClassName="min-h-[65vh]"
      >
        <div className="flex flex-wrap gap-4">
          <UberEatsLink
            label="Jollof Rice dish page hero"
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
          What jollof rice actually is.
        </h2>
        <div className="grid gap-5 text-base leading-[1.75] text-stone lg:grid-cols-2">
          <div className="grid gap-5">
            <p>
              Jollof rice is a West African rice dish cooked in a tomato and
              pepper base — onions, scotch bonnet, tomato paste, stock — until
              the liquid is absorbed and the rice has taken on the colour and
              flavour of everything it cooked in. It's one of the most eaten
              dishes across Nigeria, Ghana, Senegal, and the rest of the region,
              which is why the debate about which country makes it best has been
              running for decades and shows no sign of ending. (Nigeria wins, for
              the record. This is not a neutral opinion.)
            </p>
            <p>
              Party Jollof is the version that gets made for celebrations —
              cooked in a large pot over an open flame, outside, with wood smoke
              contributing its own flavour to the rice as it cooks. The bottom of
              the pot catches and forms a crust — called the party bottom — and
              when the pot is stirred and served, that smoky crust gets folded
              through the rest of the rice. It's the thing that separates Party
              Jollof from the everyday version.
            </p>
          </div>
          <div className="grid gap-5">
            <p>
              At NaijaGrill, the Jollof Rice and Party Jollof are both on the
              menu. The Party Jollof carries that fire-kissed depth — tomato,
              pepper, smoke — and it's served with fried plantain and your
              choice of protein. The plantain is ripe and sweet, which works
              against the heat and the savouriness of the rice in a way that
              makes complete sense once you've tried it.
            </p>
            <p>
              It has heat — scotch bonnet is in the base — but it's not the
              punch-you-in-the-face spice level of some Nigerian cooking. If
              you're nervous about chilli, mention it when you order. If you can
              handle it, eat it as it comes.
            </p>
            <p>
              Order on Uber Eats for delivery to Birmingham, or come in and eat
              it fresh from the kitchen. Reserve a table at{" "}
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
          Questions about jollof rice at NaijaGrill.
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
          Party Jollof. Delivered or dine-in.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base leading-[1.7] text-ivory/80">
          Open daily from 2pm. {BUSINESS.address.street}, Handsworth, Birmingham.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <UberEatsLink
            label="Jollof Rice dish page CTA"
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
