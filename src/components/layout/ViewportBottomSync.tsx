"use client";

import { useEffect } from "react";
import {
  computeBottomShift,
  isKeyboardOpen,
} from "@/lib/viewport-shift";

// Keeps bottom-pinned UI (the mobile action bar and WhatsApp button) glued to
// the real bottom of the screen as the browser toolbar shows and hides. It only
// sets CSS variables; elements opt in with the `vv-bottom-pin` class.
export function ViewportBottomSync() {
  useEffect(() => {
    const visual = window.visualViewport;
    if (!visual) return;

    const root = document.documentElement;
    // Zero-width fixed probe whose height is the layout viewport that fixed
    // elements are positioned against.
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:100%;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);

    let frame = 0;
    const update = () => {
      frame = 0;
      if (visual.scale > 1.01) {
        root.style.setProperty("--vv-bottom-shift", "0px");
        root.removeAttribute("data-keyboard");
        return;
      }
      const layoutHeight = probe.getBoundingClientRect().height;
      if (isKeyboardOpen(layoutHeight, visual.height, visual.offsetTop)) {
        root.setAttribute("data-keyboard", "open");
        return;
      }
      root.removeAttribute("data-keyboard");
      root.style.setProperty(
        "--vv-bottom-shift",
        `${computeBottomShift(layoutHeight, visual.height, visual.offsetTop)}px`,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    visual.addEventListener("resize", schedule);
    visual.addEventListener("scroll", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    schedule();

    return () => {
      visual.removeEventListener("resize", schedule);
      visual.removeEventListener("scroll", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      if (frame) cancelAnimationFrame(frame);
      probe.remove();
      root.style.removeProperty("--vv-bottom-shift");
      root.removeAttribute("data-keyboard");
    };
  }, []);

  return null;
}
