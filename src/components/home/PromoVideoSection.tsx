import Link from "next/link";
import { UberEatsLink } from "@/components/order/UberEatsLink";
import { PromoVideoPlayer } from "@/components/home/PromoVideoPlayer";
import { resolveImageSrc } from "@/sanity/resolve-image";
import type { HomepageData } from "@/sanity/types";

/** Pull the video id out of any common YouTube URL shape (Short, watch, youtu.be, embed). */
function youtubeId(url?: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/shorts\/([\w-]{6,})/,
    /[?&]v=([\w-]{6,})/,
    /youtu\.be\/([\w-]{6,})/,
    /youtube\.com\/embed\/([\w-]{6,})/,
  ];
  for (const re of patterns) {
    const match = url.match(re);
    if (match) return match[1];
  }
  return null;
}

export function PromoVideoSection({ data }: { data: HomepageData }) {
  const videos = (data.videos ?? [])
    .map((video) => ({
      src: video.fileUrl,
      id: youtubeId(video.url) ?? undefined,
      title: video.title,
      posterUrl: resolveImageSrc(video.poster, 800) ?? undefined,
      vertical: video.orientation
        ? video.orientation === "portrait"
        : /\/shorts\//.test(video.url ?? ""),
    }))
    .filter((video) => video.src || video.id);

  if (!videos.length) return null;

  return (
    <section className="bg-charcoal text-ivory">
      <div className="mx-auto max-w-[1500px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <div className="mb-12 max-w-2xl">
          <p className="editorial-caption-light mb-5 text-gold">
            {data.videoEyebrow ?? "On screen"}
          </p>
          <h2 className="editorial-display text-[clamp(2.25rem,4.4vw,4.25rem)] font-light leading-[0.98] text-ivory">
            {data.videoHeadline ?? "Naija Grill, in motion."}
          </h2>
          {data.videoBody && (
            <p className="mt-6 max-w-md text-base leading-[1.62] text-ivory/78 md:text-lg">
              {data.videoBody}
            </p>
          )}
          <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-ivory/12 pt-7">
            <Link
              href="/reservations#reserve"
              className="inline-flex rounded-full bg-gold px-7 py-4 text-[0.6875rem] font-black uppercase tracking-[0.22em] text-charcoal shadow-[0_18px_44px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-ivory"
            >
              Reserve a table
            </Link>
            <UberEatsLink
              label="Homepage video"
              className="inline-flex rounded-full border border-ivory/25 px-7 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
            >
              Order on Uber Eats
            </UberEatsLink>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-10">
          {videos.map((video, index) => (
            <PromoVideoPlayer
              key={video.src ?? video.id ?? index}
              src={video.src}
              id={video.id}
              title={video.title}
              posterUrl={video.posterUrl}
              vertical={video.vertical}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
