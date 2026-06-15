"use client";

import { useState } from "react";

type PromoVideoPlayerProps = {
  id: string;
  title?: string;
  /** Vertical (YouTube Short) uses a 9:16 frame; otherwise a 16:9 frame. */
  vertical: boolean;
};

export function PromoVideoPlayer({ id, title, vertical }: PromoVideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const label = title ?? "NaijaGrill video";

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
        {playing ? (
          // The iframe is taller than the frame and shifted up so the YouTube
          // title/uploader bar (top) and controls (bottom) are clipped by the
          // frame's overflow:hidden. Width stays 100%, so no side black bars and
          // — since the frame matches the video aspect — no new letterboxing.
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
            {/* Custom poster so the YouTube title/uploader chrome never shows at rest. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
              alt={label}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
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
