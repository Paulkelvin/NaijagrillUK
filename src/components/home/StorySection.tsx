import Link from "next/link";
import { EditorialFrame } from "@/components/ui/EditorialFrame";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { SectionDivider } from "@/components/ui/SectionDivider";
import type { HomepageData } from "@/sanity/types";

export function StorySection({ data }: { data: HomepageData }) {
  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-[1600px] px-6 py-28 md:px-12 md:py-36 lg:px-16 lg:py-44">
        <SectionDivider className="mb-20" />
        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5 lg:col-start-2 lg:pr-8">
            <p className="editorial-eyebrow-rule editorial-caption">
              {data.storyEyebrow}
            </p>
            <h2 className="editorial-display text-balance whitespace-pre-line text-[clamp(2.25rem,4vw,4.25rem)] font-light leading-[1.05] text-charcoal">
              {data.storyHeadline}
            </h2>
            <div className="mt-10 space-y-6 border-l border-gold/30 pl-8 text-base leading-[1.85] text-stone md:text-lg">
              {data.storyParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
            <Link href="/story" className="editorial-link mt-12">
              Read our story
            </Link>
          </div>

          <div className="relative lg:col-span-5 lg:col-start-7">
            <EditorialFrame>
              <div className="relative aspect-[4/5]">
                <EditorialImage
                  src={data.storyImage}
                  alt="Chef preparing Nigerian cuisine"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
              </div>
            </EditorialFrame>
            <div
              className="absolute -bottom-6 -left-6 -z-10 hidden h-full w-full border border-gold/25 md:block"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  );
}
