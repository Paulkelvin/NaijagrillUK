import { describe, expect, it } from "vitest";
import { normalizeKeyword, normalizePath, normalizeUrl } from "./normalize";

describe("normalizeKeyword", () => {
  it("lowercases", () => {
    expect(normalizeKeyword("Jollof Rice")).toBe("jollof rice");
  });

  it("trims leading/trailing whitespace", () => {
    expect(normalizeKeyword("  jollof rice  ")).toBe("jollof rice");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeKeyword("jollof    rice")).toBe("jollof rice");
    expect(normalizeKeyword("jollof\trice")).toBe("jollof rice");
  });

  it("strips a leading article", () => {
    expect(normalizeKeyword("the jollof rice")).toBe("jollof rice");
    expect(normalizeKeyword("a jollof rice")).toBe("jollof rice");
    expect(normalizeKeyword("an jollof rice")).toBe("jollof rice");
  });

  it("strips a trailing article", () => {
    expect(normalizeKeyword("best restaurant the")).toBe("best restaurant");
  });

  it("preserves prepositions — must NOT strip 'in'", () => {
    expect(normalizeKeyword("food in Birmingham")).toBe("food in birmingham");
    expect(normalizeKeyword("Food Birmingham")).toBe("food birmingham");
    // confirms these two remain genuinely distinct after normalization
    expect(normalizeKeyword("food in Birmingham")).not.toBe(normalizeKeyword("food Birmingham"));
  });

  it("does not strip articles embedded mid-string", () => {
    expect(normalizeKeyword("restaurant and the bar")).toBe("restaurant and the bar");
  });

  it("does not stem words", () => {
    expect(normalizeKeyword("catering")).toBe("catering");
  });

  it("only strips one layer — 'the a menu' strips only the outer article", () => {
    expect(normalizeKeyword("the a menu")).toBe("a menu");
  });

  it("leaves a bare article untouched — nothing follows it to strip", () => {
    // The regex matches "article + trailing space + content"; a standalone
    // "the" has no space after it, so nothing matches. This is the correct
    // behavior, not just an accepted gap — collapsing "the" to "" would
    // make it collide with every other single-article query in the UNIQUE
    // (site_id, keyword_normalized) constraint, which would be worse.
    expect(normalizeKeyword("the")).toBe("the");
  });

  it("is deterministic on empty input", () => {
    expect(normalizeKeyword("")).toBe("");
  });
});

describe("normalizePath", () => {
  it("lowercases", () => {
    expect(normalizePath("/Menu")).toBe("/menu");
  });

  it("strips a trailing slash", () => {
    expect(normalizePath("/menu/")).toBe("/menu");
  });

  it("preserves the root path as '/'", () => {
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("")).toBe("/");
  });

  it("leaves a path with no trailing slash unchanged (besides casing)", () => {
    expect(normalizePath("/menu")).toBe("/menu");
  });
});

describe("normalizeUrl", () => {
  it("strips the www. prefix from the domain", () => {
    const result = normalizeUrl("https://www.naijagrillandspice.co.uk/menu");
    expect(result.url).toBe("https://naijagrillandspice.co.uk/menu");
    expect(result.path).toBe("/menu");
  });

  it("leaves an already-non-www domain unchanged", () => {
    const result = normalizeUrl("https://naijagrillandspice.co.uk/menu");
    expect(result.url).toBe("https://naijagrillandspice.co.uk/menu");
  });

  it("lowercases the path", () => {
    const result = normalizeUrl("https://naijagrillandspice.co.uk/Menu");
    expect(result.path).toBe("/menu");
  });

  it("strips a trailing slash from a non-root path", () => {
    const result = normalizeUrl("https://naijagrillandspice.co.uk/menu/");
    expect(result.path).toBe("/menu");
  });

  it("normalizes the root path", () => {
    const result = normalizeUrl("https://naijagrillandspice.co.uk/");
    expect(result.path).toBe("/");
    expect(result.url).toBe("https://naijagrillandspice.co.uk/");
  });

  it("normalizes a bare-domain URL with no path to root", () => {
    const result = normalizeUrl("https://naijagrillandspice.co.uk");
    expect(result.path).toBe("/");
  });

  it("removes query parameters entirely (no exceptions defined for Phase 1)", () => {
    const result = normalizeUrl("https://naijagrillandspice.co.uk/menu?utm_source=google&utm_medium=cpc");
    expect(result.path).toBe("/menu");
    expect(result.url).toBe("https://naijagrillandspice.co.uk/menu");
  });

  it("removes fragment identifiers", () => {
    const result = normalizeUrl("https://naijagrillandspice.co.uk/menu#small-chops");
    expect(result.path).toBe("/menu");
    expect(result.url).not.toContain("#");
  });

  it("forces https regardless of input scheme", () => {
    const result = normalizeUrl("http://naijagrillandspice.co.uk/menu");
    expect(result.url).toBe("https://naijagrillandspice.co.uk/menu");
  });

  it("composes all rules together correctly", () => {
    const result = normalizeUrl("https://WWW.naijagrillandspice.co.uk/Menu/?utm_source=x#section");
    expect(result.url).toBe("https://naijagrillandspice.co.uk/menu");
    expect(result.path).toBe("/menu");
  });

  it("throws a clear error for a malformed URL", () => {
    expect(() => normalizeUrl("not a url")).toThrow(/not a valid absolute URL/);
  });
});
