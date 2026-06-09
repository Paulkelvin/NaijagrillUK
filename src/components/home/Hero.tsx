import Link from "next/link";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { HomepageData } from "@/sanity/types";

export function Hero({ data }: { data: HomepageData }) {
  return (
    <section className="relative min-h-screen">
      <EditorialImage
        src={data.heroImage}
        alt="Nigerian cuisine at NaijaGrill"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-charcoal/35" />

      <div className="relative flex min-h-screen flex-col justify-end px-6 pb-20 md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-[1600px]">
          <p className="editorial-caption mb-6 text-ivory/80">
            {data.heroEyebrow}
          </p>
          <h1 className="editorial-display max-w-4xl whitespace-pre-line text-[clamp(3rem,8vw,7.5rem)] font-light leading-[0.95] tracking-tight text-ivory">
            {data.heroHeadline}
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-ivory/85 md:text-lg">
            {data.heroSubtext}
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-10">
            <Link
              href="/reservations"
              className="text-[0.6875rem] uppercase tracking-[0.28em] text-ivory transition-opacity duration-300 hover:opacity-60"
            >
              Reserve a table
            </Link>
            <Link
              href="/menu"
              className="text-[0.6875rem] uppercase tracking-[0.28em] text-ivory/70 transition-opacity duration-300 hover:opacity-100"
            >
              View the menu
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
