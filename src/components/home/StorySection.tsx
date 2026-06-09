import Link from "next/link";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { HomepageData } from "@/sanity/types";

export function StorySection({ data }: { data: HomepageData }) {
  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-[1600px] px-6 py-28 md:px-12 md:py-36 lg:px-16 lg:py-44">
        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5 lg:col-start-2 lg:pr-12">
            <p className="editorial-caption mb-8">{data.storyEyebrow}</p>
            <h2 className="editorial-display text-balance whitespace-pre-line text-[clamp(2.25rem,4vw,4rem)] font-light leading-[1.05] text-charcoal">
              {data.storyHeadline}
            </h2>
            <div className="mt-10 space-y-6 text-base leading-[1.8] text-stone md:text-lg">
              {data.storyParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
            <Link href="/story" className="editorial-link mt-12">
              Read our story
            </Link>
          </div>

          <div className="relative aspect-[4/5] lg:col-span-5 lg:col-start-7">
            <EditorialImage
              src={data.storyImage}
              alt="Chef preparing Nigerian cuisine"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
