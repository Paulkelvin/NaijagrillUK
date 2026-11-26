"use client";

import { useEffect } from "react";

// Hides the bottom-pinned UI (mobile action bar, WhatsApp button) while a form
// field is focused, so the on-screen keyboard never has it floating over the
// input. It deliberately does NOT try to move the bar around: the bar is plain
// `position: fixed; bottom: 0`, which every phone browser positions correctly
// as its toolbars show and hide. Elements opt in with the `vv-bottom-pin` class.
const FIELD = "input, textarea, select, [contenteditable='true']";

export function ViewportBottomSync() {
  useEffect(() => {
    const root = document.documentElement;
    const onFocusIn = (event: FocusEvent) => {
      if ((event.target as Element | null)?.matches?.(FIELD)) {
        root.setAttribute("data-keyboard", "open");
      }
    };
    const onFocusOut = () => root.removeAttribute("data-keyboard");

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      root.removeAttribute("data-keyboard");
    };
  }, []);

  return null;
}
