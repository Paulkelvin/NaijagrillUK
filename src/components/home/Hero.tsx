import Link from "next/link";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { HomepageData } from "@/sanity/types";

export function Hero({ data }: { data: HomepageData }) {
  return (
    <section className="relative h-[100svh] overflow-hidden">
      <div className="image-vignette absolute inset-0">
        <EditorialImage
          src={data.heroImage}
          alt="Nigerian cuisine at NaijaGrill"
          priority
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/92 via-charcoal/45 to-charcoal/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/25 to-transparent" />

      <div className="relative flex h-full flex-col justify-end px-6 pb-28 pt-20 md:px-12 md:pb-16 md:pt-28 lg:px-16 lg:pb-20">
        <div className="mx-auto w-full max-w-[1600px]">
          <p className="editorial-caption-light image-text-contrast">
            {data.heroEyebrow}
          </p>
          <h1 className="editorial-display image-text-contrast mt-4 max-w-4xl whitespace-pre-line text-[clamp(2.1rem,5.2vw,5.25rem)] font-light leading-[0.98] tracking-tight text-ivory">
            {data.heroHeadline}
          </h1>
          <p className="image-text-contrast mt-4 max-w-lg text-sm leading-[1.55] text-ivory/90 md:text-base">
            {data.heroSubtext}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-ivory/15 pt-6">
            <Link
              href="/reservations#reserve"
              className="inline-flex rounded-full bg-gold px-7 py-4 text-[0.6875rem] font-black uppercase tracking-[0.22em] text-charcoal shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-ivory"
            >
              Reserve a table
            </Link>
            <UberEatsLink
              label="Homepage hero"
              className="inline-flex rounded-full border border-ivory/25 bg-charcoal/35 px-7 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-ivory backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
            >
              Order on Uber Eats
            </UberEatsLink>
          </div>
        </div>
      </div>
    </section>
  );
}
