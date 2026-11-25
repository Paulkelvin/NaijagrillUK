import { EditorialImage } from "@/components/ui/EditorialImage";
import { BUSINESS } from "@/lib/business";
import { FESTIVE, formatPrice } from "@/lib/offers";

export function FestivePriceBoard() {
  return (
    <section
      id="festive"
      className="relative scroll-mt-28 overflow-x-clip bg-[linear-gradient(180deg,#2a0f0c_0%,#160f0b_100%)] px-6 py-16 text-ivory md:px-12 md:py-24 lg:px-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(209,154,58,0.28),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(246,220,138,.6) 0 1.2px, transparent 1.7px), radial-gradient(circle at 70% 60%, rgba(246,220,138,.45) 0 1px, transparent 1.5px), radial-gradient(circle at 45% 85%, rgba(246,220,138,.4) 0 1.5px, transparent 2px)",
          backgroundSize: "130px 130px, 170px 170px, 230px 230px",
          maskImage: "linear-gradient(180deg, #000 0%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(180deg, #000 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="editorial-caption-light">
            <span aria-hidden>✦ </span>Bulk festive orders<span aria-hidden> ✦</span>
          </p>
          <h2 className="editorial-display mt-4 text-[clamp(2.2rem,5vw,4rem)] font-light leading-[1]">
            Feed the whole <em className="text-gold">crowd</em>
          </h2>
          <div aria-hidden className="mt-5 flex items-center justify-center gap-3 text-gold">
            <span className="h-px w-16 bg-gold/50" />✦<span className="h-px w-16 bg-gold/50" />
          </div>
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

        {/* Jump links */}
        <nav
          aria-label="Festive menu sections"
          className="sticky top-[6.9rem] z-30 -mx-6 mt-10 flex gap-2 overflow-x-auto bg-charcoal/90 px-6 py-3 backdrop-blur md:top-[6.2rem] md:mx-0 md:justify-center md:rounded-full md:px-4"
        >
          {FESTIVE.groups.map((group) => (
            <a
              key={group.id}
              href={`#festive-${group.id}`}
              className="shrink-0 rounded-full border border-gold/40 px-4 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ivory transition-colors duration-300 hover:border-gold hover:text-gold"
            >
              {group.title}
            </a>
          ))}
        </nav>

        {/* Price board */}
        <div className="mt-8 md:columns-2 md:gap-x-16">
          {FESTIVE.groups.map((group) => (
            <div key={group.id} id={`festive-${group.id}`} className="mb-12 scroll-mt-40 break-inside-avoid">
              <div className="relative h-36 overflow-hidden rounded-[1.5rem] border border-gold/30 md:h-44">
                <EditorialImage src={group.image} alt={group.alt} sizes="(max-width: 768px) 100vw, 560px" />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/70 to-charcoal/10" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="editorial-display text-[2.1rem] font-normal leading-none text-gold [text-shadow:0_2px_14px_rgba(0,0,0,0.7)]">
                    {group.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-ivory/75">{group.blurb}</p>
                </div>
              </div>
              <ul>
                {group.items.map((item) => (
                  <li key={item.name} className="border-b border-ivory/10 py-4">
                    <p className="text-[1.05rem] font-semibold leading-tight">{item.name}</p>
                    <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {item.options.map((option) => (
                        <li
                          key={option.size}
                          className="rounded-2xl border border-gold/30 bg-ivory/[0.04] px-3 py-2.5 text-center"
                        >
                          <span className="editorial-display block [font-variant-numeric:lining-nums] text-[1.65rem] font-semibold leading-none text-gold">
                            {formatPrice(option.price)}
                          </span>
                          <span className="mt-1.5 block text-[0.6875rem] font-semibold uppercase leading-tight tracking-[0.08em] text-ivory/80">
                            {option.size}
                          </span>
                          {option.note ? (
                            <span className="block text-[0.6875rem] leading-tight text-ivory/50">
                              {option.note}
                            </span>
                          ) : null}
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
