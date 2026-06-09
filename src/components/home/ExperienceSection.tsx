import { EditorialImage } from "@/components/ui/EditorialImage";
import type { HomepageData } from "@/sanity/types";

export function ExperienceSection({ data }: { data: HomepageData }) {
  return (
    <section className="relative min-h-[85vh]">
      <EditorialImage
        src={data.experienceImage}
        alt="Intimate dining atmosphere at NaijaGrill"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-charcoal/50" />

      <div className="relative mx-auto flex min-h-[85vh] max-w-[1600px] items-end px-6 pb-20 md:px-12 lg:px-16 lg:pb-28">
        <div className="max-w-xl">
          <p className="editorial-caption mb-6 text-ivory/75">
            {data.experienceEyebrow}
          </p>
          <h2 className="editorial-display text-[clamp(2rem,5vw,4.5rem)] font-light leading-[1.05] text-ivory">
            {data.experienceHeadline}
          </h2>
          <p className="mt-8 text-base leading-[1.8] text-ivory/80 md:text-lg">
            {data.experienceBody}
          </p>
        </div>
      </div>
    </section>
  );
}
