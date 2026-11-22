import { describe, expect, it } from "vitest";
import { computeBottomShift, isKeyboardOpen } from "./viewport-shift";

describe("computeBottomShift", () => {
  it("does nothing when the layout and visible areas match", () => {
    expect(computeBottomShift(800, 800, 0)).toBe(0);
    expect(computeBottomShift(800, 799.6, 0)).toBe(0);
  });

  it("moves the bar up when a toolbar covers the bottom of the layout viewport", () => {
    expect(computeBottomShift(800, 740, 0)).toBe(-60);
  });

  it("moves the bar down into the blank strip when the toolbar has hidden", () => {
    expect(computeBottomShift(740, 800, 0)).toBe(60);
  });

  it("accounts for the visible area being scrolled down within the layout viewport", () => {
    expect(computeBottomShift(800, 740, 40)).toBe(-20);
  });
});

describe("isKeyboardOpen", () => {
  it("treats a toolbar-sized gap as not the keyboard", () => {
    expect(isKeyboardOpen(800, 740, 0)).toBe(false);
  });

  it("treats a keyboard-sized gap as the keyboard", () => {
    expect(isKeyboardOpen(800, 480, 0)).toBe(true);
  });
});
