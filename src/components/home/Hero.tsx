import Link from "next/link";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { HomepageData } from "@/sanity/types";

export function Hero({ data }: { data: HomepageData }) {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="image-vignette relative absolute inset-0">
        <EditorialImage
          src={data.heroImage}
          alt="Nigerian cuisine at NaijaGrill"
          priority
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/25 via-transparent to-charcoal/55" />

      <div className="relative flex min-h-screen flex-col justify-end px-6 pb-24 md:px-12 md:pb-28 lg:px-16">
        <div className="mx-auto w-full max-w-[1600px]">
          <p className="editorial-eyebrow-rule editorial-caption text-ivory/80">
            {data.heroEyebrow}
          </p>
          <h1 className="editorial-display max-w-4xl whitespace-pre-line text-[clamp(3rem,8vw,7.5rem)] font-light leading-[0.95] tracking-tight text-ivory">
            {data.heroHeadline}
          </h1>
          <p className="mt-8 max-w-lg text-base leading-relaxed text-ivory/85 md:text-lg">
            {data.heroSubtext}
          </p>
          <div className="mt-14 flex flex-wrap items-center gap-8 border-t border-ivory/15 pt-10">
            <Link
              href="/reservations"
              className="group inline-flex items-center gap-3 text-[0.6875rem] uppercase tracking-[0.28em] text-ivory transition-colors duration-300 hover:text-gold"
            >
              <span className="h-px w-8 bg-gold/70 transition-all duration-300 group-hover:w-12" />
              Reserve a table
            </Link>
            <Link
              href="/menu"
              className="text-[0.6875rem] uppercase tracking-[0.28em] text-ivory/70 transition-colors duration-300 hover:text-ivory"
            >
              View the menu
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
