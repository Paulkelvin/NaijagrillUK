import Link from "next/link";
import { ContactForm } from "@/components/forms/ContactForm";
import { OpeningHours } from "@/components/local/OpeningHours";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { googleMapsEmbedQuery } from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { getContactInfo, getOpeningHours } from "@/sanity/fetch";

const contactCards = [
  {
    title: "Reserve a table",
    body: "Best for lunch, dinner, family meals, and group tables in the restaurant.",
    href: "/reservations",
    label: "Book online",
    icon: "M7 2v2H5a2 2 0 0 0-2 2v13h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 8H5v7h14v-7Z",
  },
  {
    title: "Events & catering",
    body: "Planning a birthday, baby shower, wedding, naming ceremony, or catered celebration?",
    href: "/private-dining",
    label: "Plan an event",
    icon: "M12 3 2 8l10 5 10-5-10-5Zm-7 8v5l7 4 7-4v-5l-7 3.5L5 11Z",
  },
  {
    title: "Speak to us",
    body: "For press, partnerships, and direct questions before you visit.",
    href: "mailto:hello@naijagrill.co.uk",
    label: "Email the team",
    icon: "M3 5h18v14H3V5Zm2 3.2V17h14V8.2l-7 4.4-7-4.4Zm14-1.1H5l7 4.4 7-4.4Z",
  },
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Contact",
    description:
      "Contact NaijaGrill at 77B Rookery Road, Handsworth, Birmingham B21 9QU.",
    path: "/contact",
  });
}

export default async function ContactPage() {
  const [contact, hours] = await Promise.all([
    getContactInfo(),
    getOpeningHours(),
  ]);

  return (
    <div className="bg-ivory">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <PageHero
        eyebrow="Contact"
        title="Come for the food. Stay for the room."
        description="Find us on Rookery Road, reserve your table, or send a message to the NaijaGrill team."
        image="https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=2400&q=85"
        imageAlt="Warm restaurant entrance and bar details"
        heightClassName="min-h-[62vh]"
      />

      <section className="mx-auto max-w-[1500px] px-6 py-14 md:px-12 md:py-20 lg:px-16">
        <div className="grid gap-5 md:grid-cols-3">
          {contactCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-[1.75rem] bg-cream/75 p-7 shadow-[0_18px_50px_rgba(22,15,11,0.07)] transition-transform duration-500 hover:-translate-y-1"
            >
              <span className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-gold">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d={card.icon} />
                </svg>
              </span>
              <h2 className="editorial-display text-3xl font-light leading-[1] text-charcoal">
                {card.title}
              </h2>
              <p className="mt-4 text-sm leading-[1.55] text-stone">
                {card.body}
              </p>
              <span className="mt-6 inline-block text-[0.6875rem] uppercase tracking-[0.18em] text-charcoal transition-colors group-hover:text-gold">
                {card.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-10 px-6 pb-16 md:px-12 md:pb-20 lg:grid-cols-[0.82fr_1.18fr] lg:px-16">
        <aside className="rounded-[2rem] bg-charcoal p-8 text-ivory shadow-[0_24px_80px_rgba(22,15,11,0.18)] md:p-10">
          <p className="editorial-caption mb-4 text-gold">Visit us</p>
          <h2 className="editorial-display text-4xl font-light leading-[1] md:text-5xl">
            77B Rookery Road, Handsworth.
          </h2>
          <p className="mt-6 max-w-lg text-sm leading-[1.65] text-ivory/72">
            {contact.locationNote ??
              "Premium Nigerian dining in one of Birmingham's most vibrant neighbourhoods."}
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-[1.25rem] bg-ivory/10 p-5">
              <p className="editorial-caption mb-3 text-ivory/55">Email</p>
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-ivory transition-colors hover:text-gold"
              >
                {contact.email}
              </a>
            </div>
            {contact.phone && (
              <div className="rounded-[1.25rem] bg-ivory/10 p-5">
                <p className="editorial-caption mb-3 text-ivory/55">Phone</p>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="text-sm text-ivory transition-colors hover:text-gold"
                >
                  {contact.phone}
                </a>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-[1.5rem] bg-ivory p-6 text-charcoal">
            <p className="editorial-caption mb-5 text-gold">Opening hours</p>
            <OpeningHours hours={hours} variant="detailed" />
          </div>
        </aside>

        <div className="rounded-[2rem] bg-cream/75 p-6 shadow-[0_24px_70px_rgba(22,15,11,0.08)] md:p-10 lg:p-12">
          <p className="editorial-caption mb-4 text-gold">Message us</p>
          <h2 className="editorial-display text-4xl font-light leading-[1] text-charcoal md:text-5xl">
            Tell us what you need.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-[1.58] text-stone">
            Send a note for questions, collaborations, press, or anything that
            needs a proper reply from the team.
          </p>
          <ContactForm />
        </div>
      </section>

      <section className="px-6 pb-20 md:px-12 lg:px-16">
        <div className="mx-auto overflow-hidden rounded-[2rem] bg-cream shadow-[0_24px_70px_rgba(22,15,11,0.08)] lg:grid lg:max-w-[1500px] lg:grid-cols-[0.36fr_1fr]">
          <div className="p-8 md:p-10">
            <p className="editorial-caption mb-4 text-gold">Directions</p>
            <h2 className="editorial-display text-4xl font-light leading-[1] text-charcoal">
              Arrive ready to settle in.
            </h2>
            <p className="mt-5 text-sm leading-[1.58] text-stone">
              Use the map for directions, parking context, and arrival planning
              before service.
            </p>
          </div>
          <div className="min-h-[360px] overflow-hidden bg-ivory">
            <iframe
              title="NaijaGrill location map"
              src={`https://www.google.com/maps?q=${googleMapsEmbedQuery}&output=embed`}
              className="h-full min-h-[360px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
