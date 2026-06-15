import Link from "next/link";
import { EditorialFrame } from "@/components/ui/EditorialFrame";
import type { HomepageData } from "@/sanity/types";

export function StorySection({ data }: { data: HomepageData }) {
  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-[1500px] px-6 py-16 md:px-12 md:py-20 lg:px-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5 lg:pr-8">
            <p className="editorial-eyebrow-rule editorial-caption">
              {data.storyEyebrow}
            </p>
            <h2 className="editorial-display text-balance whitespace-pre-line text-[clamp(2.25rem,4vw,4.25rem)] font-light leading-[0.98] text-charcoal">
              {data.storyHeadline}
            </h2>
            <div className="mt-8 space-y-5 border-l border-gold/40 pl-8 text-base leading-[1.68] text-stone md:text-lg">
              {data.storyParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
            <Link href="/story" className="editorial-link mt-12">
              Read our story
            </Link>
          </div>

          <div className="relative max-w-[420px] justify-self-center lg:col-span-4 lg:col-start-8 lg:w-full">
            <EditorialFrame>
              <div className="relative overflow-hidden bg-charcoal [border-radius:2.5rem_5.5rem_2.5rem_4rem]">
                {/* aspect-ratio is set on the iframe itself (not a percentage
                    height on an absolute child) so mobile Safari sizes it
                    correctly instead of collapsing it to zero height. */}
                <iframe
                  src="https://drive.google.com/file/d/1GMcUNummV2Em2eWJ_eXfQLGDSjXWi2OR/preview"
                  title="A glimpse inside NaijaGrill"
                  loading="lazy"
                  allow="autoplay; encrypted-media; fullscreen"
                  className="block aspect-[4/5] w-full border-0"
                />
                {/* Mask Google Drive's top bar so the pop-out / open-in-new
                    link cannot be clicked through to the video source. */}
                <div
                  className="absolute inset-x-0 top-0 z-20 h-14 cursor-default"
                  aria-hidden
                />
              </div>
            </EditorialFrame>
            <div
              className="absolute -bottom-6 -left-6 -z-10 hidden h-[72%] w-[72%] rounded-[2rem] border border-gold/30 md:block"
              aria-hidden
            />
            <div
              className="absolute -right-7 top-10 hidden h-28 w-28 rounded-[2rem] bg-gold/15 md:block"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  );
}
