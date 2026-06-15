import Link from "next/link";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { OpeningHours } from "@/components/local/OpeningHours";
import { ReviewProof } from "@/components/reviews/ReviewProof";
import type { HomepageData, OpeningHoursData } from "@/sanity/types";

export function VisitSection({
  data,
  hours,
}: {
  data: HomepageData;
  hours: OpeningHoursData;
}) {
  const visitImage = "/images/naija-grill-and-spice-table.jpg";

  return (
    <section className="bg-charcoal px-6 py-14 text-ivory md:px-12 md:py-20 lg:px-16">
      <div className="mx-auto grid max-w-[1500px] items-center gap-10 lg:grid-cols-[0.78fr_1fr]">
        <div className="relative">
          <div className="image-vignette relative aspect-[16/10] overflow-hidden">
            <EditorialImage
              src={visitImage}
              alt="NaijaGrill restaurant interior"
              sizes="(max-width: 1024px) 100vw, 42vw"
            />
          </div>
          <div className="absolute -bottom-4 -right-4 hidden h-28 w-28 border border-gold/35 md:block" />
        </div>

        <div className="border-l border-ivory/10 pl-8 lg:pl-14">
          <p className="editorial-eyebrow-rule editorial-caption text-ivory/60">
            Visit
          </p>
          <h2 className="editorial-display text-[clamp(2.25rem,4vw,3.75rem)] font-light leading-tight">
            {data.visitHeadline}
          </h2>
          <OpeningHours
            hours={hours}
            className="mt-8 space-y-2 text-base leading-relaxed text-ivory/75"
          />
          <p className="pt-4 text-base text-ivory/75">
            77B Rookery Road, Handsworth, Birmingham
          </p>
          <Link
            href="/reservations#reserve"
            className="mt-9 inline-block text-[0.6875rem] uppercase tracking-[0.28em] text-gold transition-opacity duration-300 hover:opacity-70"
          >
            Make a reservation
          </Link>
          <ReviewProof
            variant="dark"
            compact
            className="mt-10 max-w-md border-t border-ivory/10 pt-8"
          />
        </div>
      </div>
    </section>
  );
}
