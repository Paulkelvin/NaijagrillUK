"use client";

import { useState } from "react";

type PromoVideoPlayerProps = {
  /** Self-hosted video URL (Sanity file asset). Takes priority over YouTube. */
  src?: string;
  /** YouTube video id (used only when there is no self-hosted file). */
  id?: string;
  title?: string;
  /** Poster image shown before playback. */
  posterUrl?: string;
  /** Vertical (9:16) frame vs landscape (16:9). */
  vertical: boolean;
};

export function PromoVideoPlayer({
  src,
  id,
  title,
  posterUrl,
  vertical,
}: PromoVideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const label = title ?? "NaijaGrill video";
  // For YouTube, fall back to its thumbnail if no poster was provided.
  const resting =
    posterUrl ?? (id ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : null);

  return (
    <div
      className={`relative w-full ${vertical ? "max-w-[340px]" : "max-w-[600px]"}`}
    >
      <div
        className="absolute -inset-3 -z-10 rounded-[2.75rem] border border-gold/25"
        aria-hidden
      />
      <div
        className={`relative overflow-hidden rounded-[2.25rem] border border-ivory/12 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.45)] ${
          vertical ? "aspect-[9/16]" : "aspect-video"
        }`}
      >
        {playing && src ? (
          // Self-hosted video: native player, no third-party branding.
          <video
            src={src}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : playing && id ? (
          // YouTube fallback: oversize + clip the title/uploader chrome.
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=0`}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute left-0 w-full border-0"
            style={{ top: "-48px", height: "calc(100% + 96px)" }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${label}`}
            className="group absolute inset-0 h-full w-full"
          >
            {resting ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resting}
                alt={label}
                loading="lazy"
                onError={(event) => {
                  if (id) {
                    event.currentTarget.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
                  }
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 bg-gradient-to-br from-charcoal to-black" />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-charcoal/45 via-transparent to-transparent" />
            <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gold/95 shadow-[0_12px_36px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-charcoal">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
