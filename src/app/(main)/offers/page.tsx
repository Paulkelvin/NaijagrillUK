import Link from "next/link";
import { OfferCards } from "@/components/offers/OfferCards";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { BUSINESS, googleMapsDirectionsUrl } from "@/lib/business";
import { getActivePromotion, HOW_IT_WORKS, OFFER_FAQS } from "@/lib/offers";
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

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-4 text-[0.6875rem] font-black uppercase tracking-[0.22em] text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:bg-ivory";
const buttonGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-ivory/30 bg-charcoal/35 px-8 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-ivory backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export default function OffersPage() {
  const promotion = getActivePromotion();
  const { rating, reviewCount } = BUSINESS.reviews;
  const phoneHref = `tel:${BUSINESS.phone.replace(/\s/g, "")}`;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Offers", path: "/offers" },
        ])}
      />
      <PageHero
        eyebrow={promotion ? "Offers right now" : "Offers"}
        title={promotion ? "Eat well. Save more." : "No offers right now"}
        description={
          promotion
            ? "20% off soups and stews, buy one get one free on jollof, and free puff puff. Dine in or collect at NaijaGrill, Handsworth."
            : "We have no offers running at the moment. Check back soon, or explore the menu."
        }
        image="/images/menu/naijagrill-assorted-spread.jpg"
        imageAlt="An assorted spread of Nigerian dishes at NaijaGrill"
        heightClassName="min-h-[64vh]"
      >
        {promotion ? (
          <div className="flex flex-wrap gap-3">
            <a
              href={BUSINESS.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonPrimary}
            >
              <WhatsAppIcon />
              Order on WhatsApp
            </a>
            <a href={phoneHref} className={buttonGhost}>
              Call {BUSINESS.phoneDisplay}
            </a>
          </div>
        ) : null}
      </PageHero>

      {promotion ? (
        <>
          {/* Trust strip */}
          <section className="bg-gold px-6 py-4 text-charcoal md:px-12 lg:px-16">
            <ul className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-x-10 gap-y-2 text-[0.6875rem] font-bold uppercase tracking-[0.18em]">
              {rating && reviewCount ? (
                <li>
                  <span aria-hidden>★ </span>
                  {rating} on Google &middot; {reviewCount} reviews
                </li>
              ) : null}
              <li>Handsworth, Birmingham</li>
              <li>Dine-in &amp; in-person collection</li>
              <li>No codes needed</li>
            </ul>
          </section>

          {/* The three offers */}
          <section className="relative overflow-hidden bg-charcoal px-6 py-16 text-ivory md:px-12 md:py-24 lg:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(209,154,58,0.2),transparent_60%)]"
            />
            <div className="relative mx-auto max-w-[1500px]">
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <p className="editorial-caption-light">Three ways to save</p>
                <h2 className="editorial-display mt-4 text-[clamp(2.2rem,4.5vw,3.75rem)] font-light leading-[1]">
                  Pick your <em className="text-gold">favourite</em>
                </h2>
              </div>
              <OfferCards cards={promotion.cards} />
            </div>
          </section>

          {/* How it works */}
          <section className="bg-cream px-6 py-16 text-charcoal md:px-12 md:py-24 lg:px-16">
            <div className="mx-auto max-w-[1100px]">
              <div className="mx-auto max-w-2xl text-center">
                <p className="editorial-caption">How it works</p>
                <h2 className="editorial-display mt-4 text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1]">
                  Simple. No codes.
                </h2>
              </div>
              <ol className="mt-12 grid gap-6 md:grid-cols-3">
                {HOW_IT_WORKS.map((item) => (
                  <li
                    key={item.step}
                    className="relative rounded-[1.5rem] border border-charcoal/10 bg-ivory p-8 shadow-[0_18px_50px_rgba(26,24,20,0.06)]"
                  >
                    <span className="editorial-display [font-variant-numeric:lining-nums] text-6xl font-light leading-none text-gold">
                      {item.step}
                    </span>
                    <h3 className="editorial-display mt-4 text-2xl font-light leading-[1.1]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-[1.6] text-charcoal/70">{item.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* 20% dishes */}
          <section className="bg-ivory px-6 py-16 text-charcoal md:px-12 md:py-24 lg:px-16">
            <div className="mx-auto grid max-w-[1100px] gap-12 md:grid-cols-[1fr_1.2fr] md:items-center">
              <div>
                <p className="editorial-caption">20% off applies to</p>
                <h2 className="editorial-display mt-4 text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1]">
                  Soups, stews <em className="text-gold">&amp; chops</em>
                </h2>
                <p className="mt-5 max-w-md text-base leading-[1.6] text-charcoal/70">
                  Soups, ogbono, okro and seafood okro come with your choice of swallow.
                </p>
                <Link href="/menu" className="editorial-button mt-8">
                  See the full menu
                </Link>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {promotion.twentyOffDishes.map((dish) => (
                  <li
                    key={dish}
                    className="flex items-center gap-3 rounded-2xl border border-charcoal/10 bg-cream/70 px-5 py-4 text-[0.95rem] font-medium"
                  >
                    <span
                      aria-hidden
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold text-[0.6875rem] font-black text-charcoal"
                    >
                      %
                    </span>
                    {dish}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* FAQ */}
          <section className="bg-cream px-6 py-16 text-charcoal md:px-12 md:py-24 lg:px-16">
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <p className="editorial-caption">Good to know</p>
                <h2 className="editorial-display mt-4 text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1]">
                  Quick answers
                </h2>
              </div>
              <div className="mt-10 divide-y divide-charcoal/10 rounded-[1.5rem] border border-charcoal/10 bg-ivory px-6 shadow-[0_18px_50px_rgba(26,24,20,0.06)] md:px-8">
                {OFFER_FAQS.map((item) => (
                  <details key={item.q} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span
                        aria-hidden
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/20 text-lg leading-none text-charcoal transition-transform duration-300 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-[1.7] text-charcoal/70">{item.a}</p>
                  </details>
                ))}
              </div>
              <ul className="mt-8 space-y-2 text-center text-xs leading-[1.6] text-charcoal/55">
                {promotion.terms.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Final CTA */}
          <section className="relative overflow-hidden bg-charcoal px-6 py-16 text-center text-ivory md:px-12 md:py-24 lg:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(209,154,58,0.28),transparent_60%)]"
            />
            <div className="relative mx-auto max-w-5xl">
              <h2 className="editorial-display text-[clamp(2.2rem,5vw,4rem)] font-light leading-[1]">
                Hungry? Come and <em className="text-gold">see us.</em>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-[1.6] text-ivory/75">
                {BUSINESS.address.street}, {BUSINESS.address.area}, {BUSINESS.address.city}{" "}
                {BUSINESS.address.postcode}
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link href="/reservations#reserve" className={buttonPrimary}>
                  Book a table
                </Link>
                <a
                  href={BUSINESS.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonGhost}
                >
                  <WhatsAppIcon />
                  WhatsApp us
                </a>
                <a href={phoneHref} className={buttonGhost}>
                  Call {BUSINESS.phoneDisplay}
                </a>
                <a
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonGhost}
                >
                  Get directions
                </a>
              </div>
            </div>
          </section>
        </>
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
