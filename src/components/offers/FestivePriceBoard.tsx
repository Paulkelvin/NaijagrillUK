import { BUSINESS } from "@/lib/business";
import { FESTIVE, formatPrice } from "@/lib/offers";

export function FestivePriceBoard() {
  return (
    <section
      id="festive"
      className="relative scroll-mt-28 overflow-hidden bg-[linear-gradient(180deg,#2a0f0c_0%,#160f0b_100%)] px-6 py-16 text-ivory md:px-12 md:py-24 lg:px-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(209,154,58,0.28),transparent_55%)]"
      />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="editorial-caption-light">
            <span aria-hidden>✦ </span>Bulk festive orders<span aria-hidden> ✦</span>
          </p>
          <h2 className="editorial-display mt-4 text-[clamp(2.2rem,5vw,4rem)] font-light leading-[1]">
            Feed the whole <em className="text-gold">crowd</em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-[1.6] text-ivory/75">
            {FESTIVE.intro} Priced by the litre, the cooler or the piece.
          </p>
        </div>

        {/* £100 bonus */}
        <div className="mx-auto mt-10 max-w-3xl rounded-[2rem] bg-[linear-gradient(135deg,#f3d48a_0%,#d19a3a_55%,#a46b1c_100%)] px-6 py-6 text-center text-charcoal shadow-[0_24px_70px_rgba(0,0,0,0.4)] md:px-10">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.24em]">
            Orders over £{FESTIVE.bonusThreshold} come with
          </p>
          <p className="editorial-display mt-2 text-[1.55rem] font-medium leading-[1.2] md:text-[2.1rem]">
            {FESTIVE.bonusItems.join(" ✦ ")}
          </p>
        </div>

        {/* Price board */}
        <div className="mt-14 md:columns-2 md:gap-x-16">
          {FESTIVE.groups.map((group) => (
            <div key={group.id} className="mb-12 break-inside-avoid">
              <div className="flex items-baseline gap-4 border-b border-gold/50 pb-3">
                <h3 className="editorial-display text-[1.9rem] font-light leading-none text-gold">
                  {group.title}
                </h3>
                <p className="hidden text-xs text-ivory/55 sm:block">{group.blurb}</p>
              </div>
              <ul>
                {group.items.map((item) => (
                  <li key={item.name} className="border-b border-ivory/10 py-4">
                    <p className="text-[1.05rem] font-semibold leading-tight">{item.name}</p>
                    <ul className="mt-2.5 flex flex-wrap gap-2">
                      {item.options.map((option) => (
                        <li
                          key={option.size}
                          className="flex items-baseline gap-2 rounded-full border border-gold/35 bg-ivory/[0.04] px-3.5 py-1.5"
                        >
                          <span className="text-xs text-ivory/70">{option.size}</span>
                          <span className="editorial-display [font-variant-numeric:lining-nums] text-lg font-semibold text-gold">
                            {formatPrice(option.price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Steps */}
        <ol className="mt-16 grid gap-8 border-t border-ivory/15 pt-10 md:grid-cols-3">
          {FESTIVE.steps.map((item) => (
            <li key={item.step} className="flex gap-4">
              <span className="editorial-display [font-variant-numeric:lining-nums] text-5xl font-light leading-none text-gold">
                {item.step}
              </span>
              <span>
                <span className="block text-base font-semibold">{item.title}</span>
                <span className="mt-1 block text-sm leading-[1.6] text-ivory/65">{item.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <a
            href={BUSINESS.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full bg-gold px-8 py-4 text-[0.6875rem] font-black uppercase tracking-[0.22em] text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:bg-ivory"
          >
            Place a bulk order on WhatsApp
          </a>
          <a
            href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}
            className="inline-flex rounded-full border border-ivory/30 px-8 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
          >
            Call {BUSINESS.phoneDisplay}
          </a>
        </div>
        <ul className="mt-6 space-y-1 text-center text-xs text-ivory/50">
          {FESTIVE.terms.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
