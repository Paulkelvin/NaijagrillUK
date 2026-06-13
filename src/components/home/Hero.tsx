import Link from "next/link";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { ReviewProof } from "@/components/reviews/ReviewProof";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { HomepageData } from "@/sanity/types";

export function Hero({ data }: { data: HomepageData }) {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="image-vignette absolute inset-0">
        <EditorialImage
          src={data.heroImage}
          alt="Nigerian cuisine at NaijaGrill"
          priority
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/25 via-transparent to-charcoal/55" />

      <div className="relative flex min-h-screen flex-col justify-end px-6 pb-20 pt-36 md:px-12 md:pb-24 md:pt-40 lg:px-16">
        <div className="mx-auto w-full max-w-[1600px]">
          <p className="editorial-eyebrow-rule editorial-caption image-text-contrast text-ivory/82">
            {data.heroEyebrow}
          </p>
          <h1 className="editorial-display image-text-contrast mt-8 max-w-4xl whitespace-pre-line text-[clamp(2.65rem,6.5vw,6.25rem)] font-light leading-[0.96] tracking-tight text-ivory">
            {data.heroHeadline}
          </h1>
          <p className="image-text-contrast mt-8 max-w-lg text-base leading-[1.6] text-ivory/90 md:text-lg">
            {data.heroSubtext}
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-ivory/15 pt-8">
            <Link
              href="/reservations"
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
          <ReviewProof
            variant="dark"
            compact
            className="mt-8 max-w-xl border-l border-gold/45 pl-5"
          />
        </div>
      </div>
    </section>
  );
}
