import { describe, expect, it } from "vitest";
import { getActivePromotion, PROMOTION } from "./offers";

describe("PROMOTION", () => {
  it("is switched on and carries no date window", () => {
    expect(getActivePromotion()).toBe(PROMOTION);
    const serialised = JSON.stringify(PROMOTION);
    expect(serialised).not.toMatch(/November|December|startsAt|endsAt/);
  });

  it("has the three offers", () => {
    expect(PROMOTION.cards.map((c) => c.id)).toEqual(["twenty-off", "bogof", "puff-puff"]);
  });
});
