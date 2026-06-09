import { ReservationForm } from "@/components/forms/ReservationForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import Link from "next/link";
import { getContactInfo } from "@/sanity/fetch";

export async function generateMetadata() {
  return buildMetadata({
    title: "Reservations",
    description:
      "Reserve a table at NaijaGrill, Handsworth, Birmingham. Premium Nigerian dining on Rookery Road.",
    path: "/reservations",
  });
}

export default async function ReservationsPage() {
  const contact = await getContactInfo();

  return (
    <div className="bg-ivory pt-32">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Reservations", path: "/reservations" },
        ])}
      />
      <div className="mx-auto max-w-[900px] px-6 py-24 md:px-12 md:py-36">
        <p className="editorial-caption mb-8">Reservations</p>
        <h1 className="editorial-display text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-tight text-charcoal">
          Book your evening.
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-[1.8] text-stone">
          We hold tables for parties of two to ten at our Handsworth dining room.
          For larger gatherings or private dining, please enquire separately.
        </p>

        <ReservationForm />

        <p className="mt-16 text-sm leading-relaxed text-stone">
          Prefer to speak with us?{" "}
          <Link
            href={`mailto:${contact.email}`}
            className="text-charcoal underline decoration-gold/50 underline-offset-4"
          >
            {contact.email}
          </Link>
        </p>
      </div>
    </div>
  );
}
