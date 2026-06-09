import Link from "next/link";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { OpeningHours } from "@/components/local/OpeningHours";
import type { HomepageData, OpeningHoursData } from "@/sanity/types";

export function VisitSection({
  data,
  hours,
}: {
  data: HomepageData;
  hours: OpeningHoursData;
}) {
  return (
    <section className="bg-charcoal text-ivory">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[50vh] lg:min-h-[70vh]">
          <EditorialImage
            src={data.visitImage}
            alt="NaijaGrill restaurant interior"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        <div className="flex flex-col justify-center px-6 py-24 md:px-16 lg:px-20 lg:py-32">
          <p className="editorial-caption mb-8 text-ivory/60">Visit</p>
          <h2 className="editorial-display text-[clamp(2.25rem,4vw,3.75rem)] font-light leading-tight">
            {data.visitHeadline}
          </h2>
          <OpeningHours
            hours={hours}
            className="mt-10 space-y-2 text-base leading-relaxed text-ivory/75"
          />
          <p className="pt-4 text-base text-ivory/75">
            77B Rookery Road, Handsworth, Birmingham
          </p>
          <Link
            href="/reservations"
            className="mt-12 inline-block text-[0.6875rem] uppercase tracking-[0.28em] text-gold transition-opacity duration-300 hover:opacity-70"
          >
            Make a reservation
          </Link>
        </div>
      </div>
    </section>
  );
}
