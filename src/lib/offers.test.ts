import { describe, expect, it } from "vitest";
import { FESTIVE, getActivePromotion, PROMOTION } from "./offers";

describe("PROMOTION", () => {
  it("is switched on and carries no date window", () => {
    expect(getActivePromotion()).toBe(PROMOTION);
    const serialised = JSON.stringify(PROMOTION);
    expect(serialised).not.toMatch(/November|December|startsAt|endsAt/);
  });

  it("has the three offers", () => {
    expect(PROMOTION.cards.map((c) => c.id)).toEqual(["twenty-off", "bogof", "puff-puff"]);
  });

  it("prices every festive dish with at least one size", () => {
    const items = FESTIVE.groups.flatMap((g) => g.items);
    expect(items.length).toBeGreaterThan(10);
    for (const item of items) {
      expect(item.options.length).toBeGreaterThan(0);
      for (const option of item.options) expect(option.price).toBeGreaterThan(0);
    }
  });
});
