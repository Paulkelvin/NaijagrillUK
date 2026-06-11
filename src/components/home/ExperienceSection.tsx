import { EditorialImage } from "@/components/ui/EditorialImage";
import type { HomepageData } from "@/sanity/types";

export function ExperienceSection({ data }: { data: HomepageData }) {
  return (
    <section className="relative min-h-[68vh] overflow-hidden">
      <div className="image-vignette absolute inset-0">
        <EditorialImage
          src={data.experienceImage}
          alt="Intimate dining atmosphere at NaijaGrill"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,15,11,0.84),rgba(22,15,11,0.42),rgba(22,15,11,0.72))]" />

      <div className="relative mx-auto flex min-h-[68vh] max-w-[1600px] items-end px-6 pb-16 md:px-12 lg:px-16 lg:pb-20">
        <div className="max-w-2xl border-l-2 border-gold/50 pl-10">
          <p className="editorial-caption image-text-contrast mb-5 text-ivory/82">
            {data.experienceEyebrow}
          </p>
          <h2 className="editorial-display image-text-contrast text-[clamp(2rem,5vw,4.5rem)] font-light leading-[0.98] text-ivory">
            {data.experienceHeadline}
          </h2>
          <p className="image-text-contrast mt-6 max-w-lg text-base leading-[1.62] text-ivory/88 md:text-lg">
            {data.experienceBody}
          </p>
        </div>
      </div>
    </section>
  );
}
