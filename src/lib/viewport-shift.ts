// A position:fixed element is laid out against the "layout viewport". On phones
// the browser toolbar can leave that taller or shorter than what is actually
// visible, so a bottom bar ends up hidden behind the toolbar or floating above
// a blank strip. This returns how far (px) to move it so it sits on the bottom
// edge of the visible area: negative moves up, positive moves down.
export function computeBottomShift(
  layoutHeight: number,
  visibleHeight: number,
  visibleOffsetTop: number,
): number {
  const gap = layoutHeight - (visibleOffsetTop + visibleHeight);
  if (Math.abs(gap) < 1) return 0;
  return -Math.round(gap);
}

// More than a browser toolbar's worth of missing height means the on-screen
// keyboard is open, so the bar should get out of the way.
export const KEYBOARD_GAP_PX = 160;

export function isKeyboardOpen(
  layoutHeight: number,
  visibleHeight: number,
  visibleOffsetTop: number,
): boolean {
  return layoutHeight - (visibleOffsetTop + visibleHeight) > KEYBOARD_GAP_PX;
}
