import { EditorialImage } from "@/components/ui/EditorialImage";
import type { Promotion } from "@/lib/offers";

export function DineInOffers({ promotion }: { promotion: Promotion }) {
  return (
    <section
      id="dine-in"
      className="scroll-mt-28 bg-ivory px-6 py-16 text-charcoal md:px-12 md:py-24 lg:px-16"
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="max-w-2xl">
          <p className="editorial-caption">At the restaurant</p>
          <h2 className="editorial-display mt-4 text-[clamp(2.1rem,4.5vw,3.5rem)] font-light leading-[1]">
            Dine-in <em className="text-gold">offers</em>
          </h2>
          <p className="mt-4 text-base leading-[1.6] text-charcoal/70">
            Dine in or collect in person at Handsworth. Just mention the offer when you order.
          </p>
        </div>

        <ul className="mt-10 border-t border-charcoal/15">
          {promotion.cards.map((card) => (
            <li
              key={card.id}
              className="flex items-center gap-5 border-b border-charcoal/15 py-6 md:gap-10 md:py-8"
            >
              <div className="w-[6.2rem] shrink-0 md:w-56">
                <p className="editorial-display whitespace-nowrap [font-variant-numeric:lining-nums] text-[2.6rem] font-light leading-[0.9] text-gold md:text-[5rem]">
                  {card.big}
                </p>
                <p className="editorial-caption mt-1.5">{card.small}</p>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="editorial-display text-[1.35rem] font-light leading-[1.1] md:text-[2rem]">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-[1.6] text-charcoal/70">{card.body}</p>
                <p className="mt-2 hidden text-xs leading-[1.6] text-burgundy md:block">
                  {card.claim}
                </p>
              </div>
              <div className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-gold shadow-[0_10px_30px_rgba(26,24,20,0.2)] sm:block md:h-36 md:w-36">
                <EditorialImage src={card.image} alt={card.alt} sizes="144px" />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-14 grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-start">
          <div>
            <p className="editorial-caption">20% off applies to</p>
            <p className="mt-3 text-sm leading-[1.6] text-charcoal/65">
              Dine in or collect in person.
            </p>
          </div>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {promotion.twentyOffDishes.map((dish) => (
              <li
                key={dish}
                className="flex items-center gap-3 border-b border-charcoal/10 py-3 text-[0.95rem]"
              >
                <span aria-hidden className="text-gold">✦</span>
                {dish}
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-8 space-y-1 text-xs leading-[1.6] text-charcoal/55">
          {promotion.terms.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
