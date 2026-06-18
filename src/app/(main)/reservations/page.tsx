import { ReservationForm } from "@/components/forms/ReservationForm";
import { ReviewProof } from "@/components/reviews/ReviewProof";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { SmoothScrollToHash } from "@/components/util/SmoothScrollToHash";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import Link from "next/link";
import { getContactInfo } from "@/sanity/fetch";

export async function generateMetadata() {
  return buildMetadata({
    title: "Book a Table | NaijaGrill Nigerian Restaurant, Birmingham",
    description:
      "Reserve a table at NaijaGrill on Rookery Road, Handsworth, Birmingham — authentic Nigerian food for dinner, lunch, and group bookings.",
    path: "/reservations",
    keywords: [
      "book Nigerian restaurant Birmingham",
      "Nigerian restaurant table booking Handsworth",
      "reserve African restaurant Birmingham",
    ],
  });
}

export default async function ReservationsPage() {
  const contact = await getContactInfo();

  return (
    <div className="bg-ivory">
      <SmoothScrollToHash targetId="reserve" />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Reservations", path: "/reservations" },
        ])}
      />
      <PageHero
        eyebrow="Reservations"
        title="Book the table. Bring the people."
        description="Reserve for dinner, birthdays, family meals, and the kind of gathering that deserves fire, flavour, and a warm room."
        image="/images/Naija-grill-reservation-hero.JPG"
        imageAlt="Elegant restaurant table set for dinner"
        heightClassName="min-h-[62vh]"
      />

      <section
        id="reserve"
        className="mx-auto max-w-[1300px] scroll-mt-24 px-6 py-14 md:px-12 md:py-18 lg:px-16"
      >
        <div className="grid gap-8 rounded-[2rem] bg-cream/75 p-5 shadow-[0_24px_70px_rgba(22,15,11,0.08)] md:p-8 lg:grid-cols-[0.75fr_1fr] lg:p-10">
          <aside className="order-2 lg:order-1">
            <p className="editorial-caption mb-3 text-gold">
              Your reservation journey
            </p>
            <h2 className="editorial-display text-4xl font-light leading-[1] text-charcoal md:text-5xl">
              Request. Confirm. Arrive.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-[1.58] text-stone">
              Tell us the date, party size, and occasion. We will confirm the
              table and help shape the right pace for your evening.
            </p>

            <div className="mt-8 grid gap-3">
            {[
              ["01", "Request", "Choose your preferred date and group size."],
              ["02", "Confirm", "We reply once your table is secured."],
              ["03", "Arrive", "Come ready for smoke, spice, and a warm welcome."],
            ].map(([number, title, body]) => (
              <div
                key={title}
                className="flex gap-4 rounded-[1.25rem] bg-ivory/75 p-4"
              >
                <p className="editorial-display text-3xl leading-none text-gold">
                  {number}
                </p>
                <div>
                  <h3 className="text-sm uppercase tracking-[0.2em] text-charcoal">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-[1.5] text-stone">{body}</p>
                </div>
              </div>
            ))}
            </div>

            <p className="mt-8 text-sm leading-relaxed text-stone">
              Planning a birthday, anniversary, graduation, baby shower, wedding
              or catering order?{" "}
              <Link
                href="/events-catering#enquiry"
                className="text-charcoal underline decoration-gold/50 underline-offset-4"
              >
                Use Events & Catering
              </Link>
              .
            </p>

            <p className="mt-4 text-sm leading-relaxed text-stone">
              Prefer to speak with us?{" "}
              <Link
                href={`mailto:${contact.email}`}
                className="text-charcoal underline decoration-gold/50 underline-offset-4"
              >
                {contact.email}
              </Link>
            </p>

            <ReviewProof className="mt-8 rounded-[1.25rem] bg-ivory/75 p-5" />
          </aside>

          <div className="order-1 rounded-[1.5rem] bg-ivory p-5 lg:order-2 md:p-7">
            <p className="editorial-caption mb-3 text-gold">Reservation form</p>
            <h2 className="editorial-display text-3xl font-light leading-[1] text-charcoal md:text-4xl">
              Tell us when to expect you.
            </h2>
            <ReservationForm />
          </div>
        </div>
      </section>
    </div>
  );
}
