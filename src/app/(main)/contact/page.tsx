import Link from "next/link";
import { CopyablePhoneLink } from "@/components/ui/CopyablePhoneLink";
import { ContactForm } from "@/components/forms/ContactForm";
import { OpeningHours } from "@/components/local/OpeningHours";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { BUSINESS, googleMapsEmbedQuery } from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { getContactInfo, getOpeningHours } from "@/sanity/fetch";

const contactCards = [
  {
    title: "Reserve a table",
    body: "Best for lunch, dinner, family meals, and group tables in the restaurant.",
    href: "/reservations#reserve",
    label: "Book online",
    icon: "M7 2v2H5a2 2 0 0 0-2 2v13h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 8H5v7h14v-7Z",
  },
  {
    title: "Events & catering",
    body: "Planning a birthday, baby shower, wedding, naming ceremony, or catered celebration?",
    href: "/events-catering#enquiry",
    label: "Plan an event",
    icon: "M12 3 2 8l10 5 10-5-10-5Zm-7 8v5l7 4 7-4v-5l-7 3.5L5 11Z",
  },
  {
    title: "Speak to us",
    body: "For press, partnerships, and direct questions before you visit.",
    href: `mailto:${BUSINESS.email}`,
    label: "Email the team",
    icon: "M3 5h18v14H3V5Zm2 3.2V17h14V8.2l-7 4.4-7-4.4Zm14-1.1H5l7 4.4 7-4.4Z",
  },
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Contact NaijaGrill | Nigerian Restaurant in Handsworth",
    description:
      "Get in touch with NaijaGrill at 77B Rookery Road, Handsworth, Birmingham B21 9QU — for dine-in, takeaway, reservations, catering, and Uber Eats delivery.",
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
        image="/images/naija-grill-contact-hero.png"
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

      <section className="mx-auto grid max-w-[1500px] gap-10 px-6 pb-16 md:px-12 md:pb-20 lg:grid-cols-[1.18fr_0.82fr] lg:px-16">
        <div className="rounded-[2rem] bg-cream/75 p-6 shadow-[0_24px_70px_rgba(22,15,11,0.08)] md:p-8 lg:p-10">
          <p className="editorial-caption mb-3 text-gold">Message us</p>
          <h2 className="editorial-display text-3xl font-light leading-[1] text-charcoal md:text-4xl">
            Tell us what you need.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-[1.58] text-stone">
            Send a note for questions, collaborations, press, or anything that
            needs a proper reply from the team.
          </p>
          <ContactForm />
        </div>

        <aside className="rounded-[2rem] bg-charcoal p-6 text-ivory shadow-[0_24px_80px_rgba(22,15,11,0.18)] md:p-8">
          <p className="editorial-caption mb-3 text-gold">Visit us</p>
          <h2 className="editorial-display text-3xl font-light leading-[1] md:text-4xl">
            77B Rookery Road, Handsworth.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-[1.65] text-ivory/72">
            {contact.locationNote ??
              "Premium Nigerian dining in one of Birmingham's most vibrant neighbourhoods."}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.25rem] bg-ivory/10 p-4">
              <p className="editorial-caption mb-2 text-ivory/55">Email</p>
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-ivory transition-colors hover:text-gold"
              >
                {contact.email}
              </a>
            </div>
            {contact.phone && (
              <div className="rounded-[1.25rem] bg-ivory/10 p-4">
                <p className="editorial-caption mb-2 text-ivory/55">Mobile</p>
                <CopyablePhoneLink
                  phone={contact.phone}
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  linkClassName="text-sm text-ivory transition-colors hover:text-gold"
                />
              </div>
            )}
            {contact.landline && (
              <div className="rounded-[1.25rem] bg-ivory/10 p-4">
                <p className="editorial-caption mb-2 text-ivory/55">Landline</p>
                <CopyablePhoneLink
                  phone={contact.landline}
                  href={`tel:${contact.landline.replace(/\s/g, "")}`}
                  linkClassName="text-sm text-ivory transition-colors hover:text-gold"
                />
              </div>
            )}
            <div className="rounded-[1.25rem] bg-[#25D366]/20 p-4 sm:col-span-2">
              <p className="editorial-caption mb-2 text-[#25D366]/80">WhatsApp</p>
              <a
                href={BUSINESS.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-ivory transition-colors hover:text-[#25D366]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current shrink-0" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                Message us on WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] bg-ivory p-5 text-charcoal">
            <p className="editorial-caption mb-4 text-gold">Opening hours</p>
            <OpeningHours hours={hours} variant="detailed" />
          </div>
        </aside>
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
