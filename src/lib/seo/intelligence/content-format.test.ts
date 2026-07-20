import { describe, expect, it } from "vitest";
import { suggestContentFormat } from "./content-format";

describe("suggestContentFormat", () => {
  it("suggests a dedicated page for transactional intent above the FAQ ceiling", () => {
    expect(suggestContentFormat("transactional", 2400)).toBe("Dedicated page"); // real: "jollof rice near me"
  });

  it("suggests a dedicated page for commercial intent above the FAQ ceiling", () => {
    expect(suggestContentFormat("commercial", 210)).toBe("Dedicated page"); // real: "ghana restaurant birmingham"
  });

  it("suggests an article for informational intent above the FAQ ceiling", () => {
    expect(suggestContentFormat("informational", 2900)).toBe("Article"); // real: "jollof rice nigerian"
  });

  it("suggests an FAQ answer below the volume ceiling regardless of intent", () => {
    expect(suggestContentFormat("informational", 30)).toBe("FAQ answer"); // real: "jollof rice pronunciation"
    expect(suggestContentFormat("commercial", 20)).toBe("FAQ answer"); // real: "small chops price list uk"
    expect(suggestContentFormat("transactional", 10)).toBe("FAQ answer");
  });

  it("treats a null search volume as 0 — an FAQ answer, not a crash", () => {
    expect(suggestContentFormat("commercial", null)).toBe("FAQ answer");
  });

  it("falls back to Review manually for an unrecognized or missing intent above the ceiling", () => {
    expect(suggestContentFormat(null, 500)).toBe("Review manually");
    expect(suggestContentFormat("navigational", 500)).toBe("Review manually");
  });

  it("volume exactly at the ceiling still counts as FAQ (inclusive boundary)", () => {
    expect(suggestContentFormat("commercial", 50)).toBe("FAQ answer");
    expect(suggestContentFormat("commercial", 51)).toBe("Dedicated page");
  });
});
