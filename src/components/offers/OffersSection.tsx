import Link from "next/link";
import { OfferCards } from "@/components/offers/OfferCards";
import { BUSINESS } from "@/lib/business";
import type { Promotion } from "@/lib/offers";

export function OffersSection({ promotion }: { promotion: Promotion }) {
  return (
    <section
      id="offers"
      className="relative overflow-hidden bg-charcoal px-6 py-16 text-ivory md:px-12 md:py-24 lg:px-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(209,154,58,0.22),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-[1500px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="editorial-caption-light">
            Offers right now
          </p>
          <h2 className="editorial-display mt-4 text-[clamp(2.6rem,6vw,5rem)] font-light leading-[0.98]">
            Eat well. <em className="text-gold">Save more.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-[1.6] text-ivory/75">
            Come in for a proper Nigerian meal and enjoy our offers when you
            dine in or collect at the restaurant.
          </p>
        </div>

        <div className="mt-12">
          <OfferCards cards={promotion.cards} />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/reservations#reserve"
            className="inline-flex rounded-full bg-gold px-8 py-4 text-[0.6875rem] font-black uppercase tracking-[0.22em] text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:bg-ivory"
          >
            Book a table
          </Link>
          <a
            href={BUSINESS.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border border-ivory/25 px-8 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
          >
            Ask on WhatsApp
          </a>
          <Link
            href="/offers"
            className="text-xs uppercase tracking-[0.2em] text-ivory/70 underline decoration-gold/50 underline-offset-4 transition-colors hover:text-gold"
          >
            Offer details
          </Link>
        </div>
        <p className="mt-6 text-center text-xs text-ivory/50">
          Dine-in and in-person collection only. Not available on Uber Eats.
        </p>
      </div>
    </section>
  );
}
