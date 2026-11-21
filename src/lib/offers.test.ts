import { describe, expect, it } from "vitest";
import { getActivePromotion, getPromotionState, PROMOTION } from "./offers";

describe("getActivePromotion", () => {
  it("is off the day before the promotion starts", () => {
    expect(getActivePromotion(new Date("2026-11-21T23:59:59Z"))).toBeNull();
  });

  it("is on from the first moment of 22 November", () => {
    expect(getActivePromotion(new Date("2026-11-22T00:00:00Z"))).toBe(PROMOTION);
  });

  it("is still on late on 1 December", () => {
    expect(getActivePromotion(new Date("2026-12-01T23:30:00Z"))).toBe(PROMOTION);
  });

  it("switches off after the end date", () => {
    expect(getActivePromotion(new Date("2026-12-02T00:00:00Z"))).toBeNull();
  });

  it("reports upcoming, active and ended states", () => {
    expect(getPromotionState(new Date("2026-11-21T12:00:00Z"))).toBe("upcoming");
    expect(getPromotionState(new Date("2026-11-25T12:00:00Z"))).toBe("active");
    expect(getPromotionState(new Date("2026-12-05T12:00:00Z"))).toBe("ended");
  });
});
