import Link from "next/link";
import { OfferCards } from "@/components/offers/OfferCards";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { BUSINESS } from "@/lib/business";
import { getPromotionState, PROMOTION } from "@/lib/offers";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";

export async function generateMetadata() {
  return buildMetadata({
    title: "Dine-in Offers | NaijaGrill Nigerian Restaurant Birmingham",
    description:
      "20% off soups and stews, buy one get one free on jollof or fried rice with peppered meat, and free puff puff on orders over £30 at NaijaGrill, Handsworth.",
    path: "/offers",
  });
}

export default function OffersPage() {
  const state = getPromotionState();
  const promotion = state === "ended" ? null : PROMOTION;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Offers", path: "/offers" },
        ])}
      />
      <PageHero
        eyebrow={
          promotion
            ? state === "upcoming"
              ? "Starts 22 November"
              : `Ends ${promotion.endsLabel}`
            : "Offers"
        }
        title={promotion ? "Eat well. Save more." : "No offers right now"}
        description={
          promotion
            ? "Dine in or collect at NaijaGrill in Handsworth and enjoy our limited-time offers."
            : "Our current offers have ended. Check back soon, or explore the menu."
        }
        image="/images/menu/naijagrill-assorted-spread.jpg"
        imageAlt="An assorted spread of Nigerian dishes at NaijaGrill"
        heightClassName="min-h-[60vh]"
      />

      {promotion ? (
        <section className="bg-charcoal px-6 py-16 text-ivory md:px-12 md:py-24 lg:px-16">
          <div className="mx-auto max-w-[1500px]">
            <OfferCards cards={promotion.cards} />

            <div className="mx-auto mt-16 grid max-w-5xl gap-12 md:grid-cols-2">
              <div>
                <p className="editorial-caption-light">20% off applies to</p>
                <ul className="mt-5 space-y-2.5 text-base text-ivory/85">
                  {promotion.twentyOffDishes.map((dish) => (
                    <li key={dish} className="flex gap-3">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {dish}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="editorial-caption-light">Good to know</p>
                <ul className="mt-5 space-y-2.5 text-sm leading-[1.6] text-ivory/70">
                  {promotion.terms.map((term) => (
                    <li key={term} className="flex gap-3">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ivory/40" />
                      {term}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/reservations#reserve"
                className="inline-flex rounded-full bg-gold px-8 py-4 text-[0.6875rem] font-black uppercase tracking-[0.22em] text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:bg-ivory"
              >
                Book a table
              </Link>
              <a
                href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}
                className="inline-flex rounded-full border border-ivory/25 px-8 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
              >
                Call {BUSINESS.phoneDisplay}
              </a>
              <a
                href={BUSINESS.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full border border-ivory/25 px-8 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
              >
                WhatsApp us
              </a>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-cream px-6 py-20 text-center md:px-12">
          <Link href="/menu" className="editorial-button">
            See the menu
          </Link>
        </section>
      )}
    </>
  );
}
