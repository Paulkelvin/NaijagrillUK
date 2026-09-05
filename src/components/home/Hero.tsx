import { UberEatsLink } from "@/components/order/UberEatsLink";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { HeroVideo } from "@/components/home/HeroVideo";
import { BUSINESS } from "@/lib/business";
import type { HomepageData } from "@/sanity/types";

export function Hero({ data }: { data: HomepageData }) {
  return (
    <section className="relative h-[100svh] overflow-hidden">
      <div className="image-vignette absolute inset-0">
        {data.heroVideoUrl ? (
          <HeroVideo
            image={data.heroImage}
            desktopUrl={data.heroVideoUrl}
            mobileUrl={data.heroVideoMobileUrl}
          />
        ) : (
          <EditorialImage
            src={data.heroImage}
            alt="Nigerian cuisine at NaijaGrill, Handsworth, Birmingham"
            priority
            sizes="100vw"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/65 via-charcoal/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/30 via-charcoal/10 to-transparent" />

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
            <a
              href={BUSINESS.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-4 text-[0.6875rem] font-black uppercase tracking-[0.22em] text-white shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1ebe57]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Order on WhatsApp
            </a>
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
