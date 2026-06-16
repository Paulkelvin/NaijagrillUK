import { EventInquiryForm } from "@/components/forms/EventInquiryForm";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { PageHero } from "@/components/ui/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { SmoothScrollToHash } from "@/components/util/SmoothScrollToHash";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  cateringServiceSchema,
} from "@/lib/seo/structured-data";

const eventBooking = [
  {
    title: "Mini birthday parties",
    body: "Warm, relaxed birthdays with Nigerian food, music, and a room that feels personal.",
  },
  {
    title: "Romantic anniversaries",
    body: "A softer dinner setup for couples celebrating love, milestones, and quiet moments.",
  },
  {
    title: "Graduation celebrations",
    body: "Joyful meals for families marking achievement with generous sharing plates.",
  },
  {
    title: "Baby showers",
    body: "Beautiful baby shower gatherings with thoughtful pacing and celebratory food.",
  },
  {
    title: "Family get-togethers",
    body: "Casual tables for family, friends, and everyone who wants to eat well together.",
  },
];

const cateringServices = [
  "Weddings",
  "Engagements",
  "Naming ceremonies",
  "Corporate trays",
  "Family celebrations",
  "Church and community events",
];

export async function generateMetadata() {
  return buildMetadata({
    title: "Events & Catering",
    description:
      "Event booking and Nigerian catering services from NaijaGrill, Handsworth, Birmingham.",
    path: "/events-catering",
  });
}

export default function EventsCateringPage() {
  return (
    <div className="bg-charcoal text-ivory">
      <SmoothScrollToHash targetId="enquiry" />
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Events & Catering", path: "/events-catering" },
          ]),
          cateringServiceSchema(),
        ]}
      />
      <PageHero
        eyebrow="Events & Catering"
        title="Bring NaijaGrill to the moments that matter."
        description="Book intimate celebrations in the restaurant or enquire about Nigerian catering for weddings, engagements, naming ceremonies, and family events."
        image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2400&q=85"
        imageAlt="Celebration table with warm restaurant atmosphere"
        heightClassName="min-h-[64vh]"
      />

      <section className="mx-auto max-w-[1500px] px-6 py-16 md:px-12 md:py-20 lg:px-16">
        <div className="mb-10 grid gap-8 lg:grid-cols-[0.45fr_1fr] lg:items-end">
          <div>
            <p className="editorial-caption mb-3 text-gold">
              What we can host
            </p>
            <h2 className="editorial-display text-4xl font-light leading-[1] md:text-5xl">
              Event booking inside the NaijaGrill room.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-[1.6] text-ivory/72">
            From a small birthday party to a romantic anniversary dinner, we
            shape the food, timing, and feel around the occasion instead of
            forcing every celebration into the same package.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {eventBooking.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.5rem] bg-ivory/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.12)]"
            >
              <span className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-gold">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M12 2 9.6 7.2 4 8l4.1 4-1 5.7L12 15l4.9 2.7-1-5.7L20 8l-5.6-.8L12 2Z" />
                </svg>
              </span>
              <h3 className="editorial-display text-3xl font-light leading-[1]">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-[1.55] text-ivory/68">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ivory px-6 py-16 text-charcoal md:px-12 md:py-20 lg:px-16">
        <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="image-vignette relative min-h-[380px] overflow-hidden rounded-[2rem] sm:row-span-2">
              <EditorialImage
                src="/images/menu/naijagrill-assorted-spread.jpg"
                alt="An assorted spread of Nigerian dishes for a catered event"
                sizes="(max-width: 1024px) 100vw, 36vw"
              />
            </div>
            <div className="image-vignette-side relative min-h-[180px] overflow-hidden rounded-[1.5rem]">
              <EditorialImage
                src="/images/menu/naijagrill-beef-suya.jpg"
                alt="Beef suya grilled over charcoal for catering"
                sizes="(max-width: 1024px) 100vw, 22vw"
              />
            </div>
            <div className="image-vignette-side relative min-h-[180px] overflow-hidden rounded-[1.5rem]">
              <EditorialImage
                src="/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg"
                alt="Party jollof rice with plantain and assorted meat for events"
                sizes="(max-width: 1024px) 100vw, 22vw"
              />
            </div>
          </div>

          <div>
            <p className="editorial-caption mb-3 text-gold">
              Catering services
            </p>
            <h2 className="editorial-display text-4xl font-light leading-[1] md:text-5xl">
              Nigerian food for weddings, engagements, naming ceremonies and more.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-[1.6] text-stone">
              Bring NaijaGrill flavour to your venue. Tell us the occasion,
              guest count, date, and service style, and the team will follow up
              with options.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {cateringServices.map((service) => (
                <div
                  key={service}
                  className="rounded-full bg-cream px-5 py-3 text-sm text-charcoal"
                >
                  {service}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="enquiry" className="scroll-mt-24 border-t border-ivory/10">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-16 md:px-12 md:py-20 lg:grid-cols-[0.55fr_1fr] lg:px-16">
          <div>
            <p className="editorial-caption mb-4 text-gold">
              Enquire
            </p>
            <h2 className="editorial-display text-4xl font-light leading-[1] md:text-5xl">
              Tell us what you are planning.
            </h2>
            <p className="mt-5 text-sm leading-[1.6] text-ivory/70">
              Use this for event booking and catering services. Include your
              date, guest estimate, occasion, and whether you want restaurant
              hosting or catering at another venue.
            </p>
          </div>

          <div className="rounded-[2rem] bg-ivory/[0.06] p-6 md:p-8 lg:p-10">
            <p className="editorial-caption mb-4 text-ivory/60">
              Event & catering enquiry
            </p>
            <h3 className="editorial-display text-3xl font-light leading-[1]">
              We will help shape the right service.
            </h3>
            <EventInquiryForm variant="dark" />
          </div>
        </div>
      </section>
    </div>
  );
}
