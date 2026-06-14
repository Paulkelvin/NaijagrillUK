"use client";

import { useEffect } from "react";

export function SmoothScrollToHash({
  targetId,
  duration = 1500,
}: {
  targetId: string;
  duration?: number;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== `#${targetId}`) return;

    const el = document.getElementById(targetId);
    if (!el) return;

    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);

    let raf = 0;
    const startTime = performance.now();
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const targetY = () =>
      el.getBoundingClientRect().top + window.scrollY - 16;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      window.scrollTo(0, targetY() * easeInOutCubic(progress));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        root.style.scrollBehavior = previousBehavior;
      }
    };

    const start = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, 350);

    return () => {
      window.clearTimeout(start);
      if (raf) cancelAnimationFrame(raf);
      root.style.scrollBehavior = previousBehavior;
    };
  }, [targetId, duration]);

  return null;
}
