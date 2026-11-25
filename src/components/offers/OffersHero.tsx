import { EditorialImage } from "@/components/ui/EditorialImage";
import { BUSINESS } from "@/lib/business";
import { FESTIVE } from "@/lib/offers";

const quickOffers = [
  {
    big: "Bulk",
    title: "Festive bulk orders",
    sub: "Jollof, stews and peppered meats by the litre",
    href: "#festive",
    featured: true,
  },
  {
    big: "20%",
    title: "Off soups, stews & chops",
    sub: "Dine in or collect at the restaurant",
    href: "#dine-in",
  },
  {
    big: "1+1",
    title: "Buy one, get one free",
    sub: "Jollof or fried rice with peppered meat",
    href: "#dine-in",
  },
  {
    big: "Free",
    title: "Puff puff on orders over £30",
    sub: "Added to your dine-in order",
    href: "#dine-in",
  },
] as const;

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-4 text-[0.6875rem] font-black uppercase tracking-[0.16em] sm:px-7 sm:tracking-[0.2em] text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:bg-ivory";
const buttonGhost =
  "inline-flex items-center justify-center rounded-full border border-ivory/30 px-5 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.16em] sm:px-7 sm:tracking-[0.2em] text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold";

export function OffersHero() {
  return (
    <section className="relative overflow-hidden bg-charcoal pt-[8rem] text-ivory md:pt-40">
      <div className="absolute inset-0">
        <EditorialImage
          src="/images/menu/naijagrill-assorted-spread.jpg"
          alt="An assorted spread of Nigerian party food at NaijaGrill"
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(209,154,58,0.3),transparent_45%),linear-gradient(180deg,rgba(22,15,11,0.55),rgba(22,15,11,0.92))]" />

      <div className="relative mx-auto grid max-w-[1500px] gap-8 px-6 pb-10 md:grid-cols-[1.05fr_1fr] md:items-end md:gap-14 md:px-12 md:pb-16 lg:px-16">
        <div className="animate-rise">
          <p className="editorial-caption-light">
            <span aria-hidden className="text-gold">✦ </span>
            {FESTIVE.eyebrow}
          </p>
          <h1 className="editorial-display mt-3 text-balance text-[clamp(2.4rem,6.4vw,5rem)] font-light leading-[0.96] tracking-tight">
            {FESTIVE.title}
          </h1>
          <p className="mt-4 max-w-xl text-[0.95rem] leading-[1.55] text-ivory/85 md:text-lg">
            {FESTIVE.intro}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={BUSINESS.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonPrimary}
            >
              Order on WhatsApp
            </a>
            <a href="#festive" className={buttonGhost}>
              See prices
            </a>
          </div>
        </div>

        <ul className="animate-rise border-t border-ivory/20 md:border-t-0">
          {quickOffers.map((offer) => (
            <li key={offer.title} className="border-b border-ivory/15 last:border-b-0 md:border-b">
              <a
                href={offer.href}
                className={`group flex items-center gap-4 py-3.5 transition-colors duration-300 md:py-4 ${
                  "featured" in offer && offer.featured
                    ? "-mx-3 rounded-2xl bg-gold/15 px-3 hover:bg-gold/25"
                    : "hover:text-gold"
                }`}
              >
                <span className="editorial-display w-[4.6rem] shrink-0 whitespace-nowrap [font-variant-numeric:lining-nums] text-[2.1rem] font-light leading-none text-gold md:w-24 md:text-[2.6rem]">
                  {offer.big}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.95rem] font-semibold leading-tight md:text-base">
                    {offer.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-ivory/65 md:text-sm">
                    {offer.sub}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="text-lg text-gold transition-transform duration-300 group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
