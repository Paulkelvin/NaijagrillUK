import { EditorialImage } from "@/components/ui/EditorialImage";
import type { OfferCard } from "@/lib/offers";

export function OfferCards({ cards }: { cards: OfferCard[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-3 md:gap-6">
      {cards.map((card) => (
        <article
          key={card.id}
          className="group relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-charcoal text-ivory shadow-[0_24px_70px_rgba(0,0,0,0.35)] md:min-h-[30rem]"
        >
          <div className="absolute inset-0 -z-20">
            <EditorialImage
              src={card.image}
              alt={card.alt}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-[900ms] group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-charcoal via-charcoal/75 to-charcoal/5" />
          <div className="absolute inset-x-0 top-0 -z-10 h-1 bg-gold" />

          <div className="p-7 md:p-8">
            <p className="editorial-display whitespace-nowrap [font-variant-numeric:lining-nums] text-[4.75rem] font-light leading-[0.9] text-gold md:text-[5.25rem]">
              {card.big}
            </p>
            <p className="editorial-caption-light mt-2">{card.small}</p>
            <h3 className="editorial-display mt-5 text-[1.65rem] font-light leading-[1.1]">
              {card.title}
            </h3>
            <p className="mt-3 text-sm leading-[1.6] text-ivory/80">{card.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
