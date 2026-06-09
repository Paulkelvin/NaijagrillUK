import { ContactForm } from "@/components/forms/ContactForm";
import { ContactDetails } from "@/components/local/ContactDetails";
import { OpeningHours } from "@/components/local/OpeningHours";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { getContactInfo, getOpeningHours } from "@/sanity/fetch";

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
    <div className="bg-ivory pt-32">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <div className="mx-auto max-w-[900px] px-6 py-24 md:px-12 md:py-36">
        <p className="editorial-caption mb-8">Contact</p>
        <h1 className="editorial-display text-[clamp(2.5rem,5vw,4rem)] font-light text-charcoal">
          We&apos;d love to hear from you.
        </h1>

        <ContactDetails contact={contact} showLocationNote className="mt-16" />

        <div className="mt-16">
          <p className="editorial-caption mb-6">Hours</p>
          <OpeningHours hours={hours} variant="detailed" />
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
