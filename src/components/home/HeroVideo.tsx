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
      {/* Ambient backdrop. When a video is layered on top, the mobile poster is
          blurred + scaled so the fit-to-width video reads against a soft
          background instead of empty bars. With no video (reduced-motion /
          data-saver), the poster IS the hero, so it stays sharp and full-bleed. */}
      <EditorialImage
        src={image}
        alt="Nigerian cuisine at NaijaGrill"
        priority
        sizes="100vw"
        className={
          videoSrc
            ? "object-cover scale-110 blur-xl md:scale-100 md:blur-0"
            : "object-cover"
        }
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
          // On phones show the whole landscape frame (the food isn't cropped or
          // zoomed); on tablet/desktop fill the hero edge-to-edge.
          className="absolute inset-0 h-full w-full object-contain md:object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
    </>
  );
}
