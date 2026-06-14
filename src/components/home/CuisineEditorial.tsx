"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { EditorialFrame } from "@/components/ui/EditorialFrame";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { HomepageData } from "@/sanity/types";

const localCuisineImages: Record<string, string> = {
  jollof: "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
  "jollof rice": "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
  "white rice with ofada stew": "/images/menu/naijagrill-white-rice-ofada-stew.jpg",
  "white rice with ayamase": "/images/menu/naijagrill-white-rice-ayamase-stew.jpg",
  "fried rice": "/images/menu/naijagrill-fried-rice-peppered-hake-plantain.jpg",
  "poundo with egusi": "/images/menu/naijagrill-poundo-egusi-soup.jpg",
  "egusi soup": "/images/menu/naijagrill-poundo-egusi-soup.jpg",
  "efo riro": "/images/menu/naijagrill-efo-riro-soup.jpg",
  "assorted meat pepper soup":
    "/images/menu/naijagrill-assorted-meat-pepper-soup.jpg",
  "grilled tilapia": "/images/menu/naijagrill-grilled-tilapia-plantain-chips.jpg",
};

function imageForCuisineFeature(feature: HomepageData["cuisineFeatures"][number]) {
  return localCuisineImages[feature.title.toLowerCase()] ?? feature.image;
}

export function CuisineEditorial({ data }: { data: HomepageData }) {
  const movingFeatures = [...data.cuisineFeatures, ...data.cuisineFeatures];
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let paused = false;
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let resumeTimer: number | undefined;
    const speed = 0.5;

    const half = () => el.scrollWidth / 2;
    const wrap = () => {
      const h = half();
      if (h <= 0) return;
      if (el.scrollLeft >= h) el.scrollLeft -= h;
      else if (el.scrollLeft <= 0) el.scrollLeft += h;
    };

    const tick = () => {
      if (!paused && !dragging) {
        el.scrollLeft += speed;
        wrap();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const pause = () => {
      paused = true;
      if (resumeTimer) window.clearTimeout(resumeTimer);
    };
    const resumeSoon = () => {
      if (resumeTimer) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        paused = false;
      }, 1400);
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      pause();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      el.scrollLeft = startScroll - (e.clientX - startX);
    };
    const onPointerUp = () => {
      dragging = false;
      wrap();
      resumeSoon();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("pointerleave", onPointerUp);
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resumeSoon);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resumeSoon, { passive: true });
    el.addEventListener("wheel", () => {
      pause();
      resumeSoon();
    }, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      if (resumeTimer) window.clearTimeout(resumeTimer);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("pointerleave", onPointerUp);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resumeSoon);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resumeSoon);
    };
  }, []);

  return (
    <section className="bg-cream">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-6 py-14 md:px-12 md:py-16 lg:grid-cols-[0.34fr_1fr] lg:px-16">
        <div className="lg:pt-4">
          <p className="editorial-eyebrow-rule editorial-caption">
            {data.cuisineEyebrow}
          </p>
          <h2 className="editorial-display text-[clamp(2.25rem,4vw,3.75rem)] font-light leading-[0.96] text-charcoal">
            {data.cuisineHeadline}
          </h2>
          <div className="mt-10">
            <Link href="/menu" className="editorial-link">
              Explore the full menu
            </Link>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="no-scrollbar cursor-grab overflow-x-auto overscroll-x-contain active:cursor-grabbing"
        >
          <div className="flex w-max gap-6 pr-6">
            {movingFeatures.map((feature, index) => (
              <article
                key={`${feature.title}-${index}`}
                className="group w-[78vw] shrink-0 select-none rounded-[1.65rem] border border-charcoal/10 bg-ivory/70 p-4 md:w-[420px] lg:w-[430px]"
              >
                <div className="relative">
                  <EditorialFrame>
                    <div className="image-vignette-side relative aspect-[16/10] overflow-hidden rounded-[1.35rem]">
                      <EditorialImage
                        src={imageForCuisineFeature(feature)}
                        alt={feature.title}
                        sizes="(max-width: 1024px) 92vw, 28vw"
                        className="pointer-events-none object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    </div>
                  </EditorialFrame>
                  <span className="editorial-caption absolute left-5 top-5 rounded-full bg-charcoal/75 px-3 py-2 text-ivory/75 backdrop-blur">
                    0{(index % data.cuisineFeatures.length) + 1}
                  </span>
                </div>

                <div className="px-2 pb-1 pt-4">
                  <p className="editorial-caption mb-2">{feature.subtitle}</p>
                  <h3 className="editorial-display text-3xl font-light leading-[0.98] text-charcoal md:text-4xl">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-[1.55] text-stone">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
