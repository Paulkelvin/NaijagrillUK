import Link from "next/link";

const occasions = [
  "Birthdays",
  "Baby showers",
  "Graduations",
  "Weddings",
  "Corporate trays",
  "Family gatherings",
];

export function PrivateDiningTeaser() {
  return (
    <section className="bg-cream px-6 pb-14 md:px-12 md:pb-20 lg:px-16">
      <div className="mx-auto grid max-w-[1500px] gap-8 rounded-[2rem] border border-charcoal/10 bg-charcoal px-7 py-9 text-ivory shadow-[0_24px_80px_rgba(22,15,11,0.16)] md:px-10 md:py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="editorial-caption mb-3 text-gold">
            Private dining & catering
          </p>
          <h2 className="editorial-display text-[clamp(2.25rem,4vw,4rem)] font-light leading-[0.98]">
            Planning a full table or a bigger celebration?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-[1.65] text-ivory/72 md:text-base">
            Tell us the occasion, date, and guest count, and the team will help
            shape restaurant hosting or Nigerian catering around it.
          </p>
        </div>

        <div className="lg:justify-self-end">
          <div className="flex flex-wrap gap-2">
            {occasions.map((occasion) => (
              <span
                key={occasion}
                className="rounded-full border border-ivory/12 px-4 py-2 text-xs uppercase tracking-[0.14em] text-ivory/70"
              >
                {occasion}
              </span>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <Link href="/events-catering#enquiry" className="editorial-button-dark">
              Events & Catering
            </Link>
            <Link
              href="/contact"
              className="text-xs uppercase tracking-[0.2em] text-ivory/70 transition-colors hover:text-gold"
            >
              Ask a question
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
