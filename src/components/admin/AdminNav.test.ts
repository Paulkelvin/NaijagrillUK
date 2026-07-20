import { describe, expect, it } from "vitest";
import { isActiveLink } from "./AdminNav";

describe("isActiveLink", () => {
  it("matches the exact current path", () => {
    expect(isActiveLink("/admin/seo", "/admin/seo")).toBe(true);
    expect(isActiveLink("/admin/seo/settings", "/admin/seo/settings")).toBe(true);
  });

  it("does not treat a sibling route as active just because it shares a URL prefix", () => {
    // Regression: /admin/seo/settings starts with /admin/seo as a string,
    // but it's a sibling nav item ("Settings"), not a sub-page of Action
    // Queue — both used to highlight at once on the settings page.
    expect(isActiveLink("/admin/seo/settings", "/admin/seo")).toBe(false);
  });

  it("does not treat /admin/seo as active for the Dashboard link", () => {
    expect(isActiveLink("/admin/seo", "/admin")).toBe(false);
  });
});
