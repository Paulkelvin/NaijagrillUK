"use client";

import { useSyncExternalStore } from "react";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { SanityImage } from "@/sanity/types";

/**
 * Renders the homepage hero background. The poster image is server-rendered as
 * the LCP element and paints instantly; the video is only fetched and mounted
 * on the client, choosing a lighter file on phones. Visitors who prefer reduced
 * motion or are saving data keep the poster image and never download a video.
 */
function subscribe(callback: () => void) {
  const queries = [
    window.matchMedia("(prefers-reduced-motion: reduce)"),
    window.matchMedia("(prefers-reduced-data: reduce)"),
    window.matchMedia("(max-width: 767px)"),
  ];
  for (const query of queries) query.addEventListener("change", callback);
  return () => {
    for (const query of queries) query.removeEventListener("change", callback);
  };
}

export function HeroVideo({
  image,
  desktopUrl,
  mobileUrl,
}: {
  image?: SanityImage | string;
  desktopUrl: string;
  mobileUrl?: string;
}) {
  // Returns one of the stable prop strings (or null), so the snapshot is
  // referentially stable across calls as useSyncExternalStore requires.
  const videoSrc = useSyncExternalStore(
    subscribe,
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const saveData =
        window.matchMedia("(prefers-reduced-data: reduce)").matches ||
        Boolean(
          (navigator as Navigator & { connection?: { saveData?: boolean } })
            .connection?.saveData,
        );
      if (reduceMotion || saveData) return null;

      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      return isMobile && mobileUrl ? mobileUrl : desktopUrl;
    },
    () => null,
  );

  return (
    <>
      {/* Poster: the LCP element and the fallback for no-JS / reduced-motion /
          data-saver visitors. The mobile video is portrait and the desktop one
          landscape, so both fill the hero edge-to-edge with object-cover. */}
      <EditorialImage
        src={image}
        alt="Nigerian cuisine at NaijaGrill, Handsworth, Birmingham"
        priority
        sizes="100vw"
      />
      {videoSrc && (
        <video
          key={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
    </>
  );
}
