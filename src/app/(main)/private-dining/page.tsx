import { EventInquiryForm } from "@/components/forms/EventInquiryForm";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";

export async function generateMetadata() {
  return buildMetadata({
    title: "Private Dining & Events",
    description:
      "Private dining and event enquiries at NaijaGrill, Handsworth, Birmingham.",
    path: "/private-dining",
  });
}

export default function PrivateDiningPage() {
  return (
    <div className="bg-charcoal pt-32 text-ivory">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Private Dining", path: "/private-dining" },
        ])}
      />
      <div className="relative h-[55vh] min-h-[420px]">
        <EditorialImage
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2400&q=85"
          alt="Private dining room"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-charcoal/55" />
        <div className="relative mx-auto flex h-full max-w-[1600px] items-end px-6 pb-16 md:px-12 lg:px-16">
          <div>
            <p className="editorial-caption mb-4 text-ivory/70">
              Private Dining
            </p>
            <h1 className="editorial-display text-[clamp(2.5rem,6vw,5rem)] font-light text-ivory">
              Gatherings, curated.
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-6 py-24 md:px-12 md:py-32">
        <p className="text-lg leading-[1.9] text-ivory/75">
          Our private dining room accommodates celebrations, corporate evenings,
          and occasions that call for a more intimate pace. Menus are tailored in
          conversation with our kitchen team.
        </p>

        <div className="mt-20 text-ivory">
          <p className="editorial-caption mb-8 text-ivory/60">Event Enquiry</p>
          <EventInquiryForm variant="dark" />
        </div>
      </div>
    </div>
  );
}
