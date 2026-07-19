import { describe, expect, it, vi } from "vitest";
import { getPrimarySiteId } from "./site";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => ({ from: mockFrom }),
}));

function stubSelect(result: { data: unknown; error: unknown }) {
  mockFrom.mockReturnValue({ select: vi.fn().mockResolvedValue(result) });
}

describe("getPrimarySiteId", () => {
  it("returns the id when exactly one site exists", async () => {
    stubSelect({ data: [{ id: "site-1" }], error: null });
    await expect(getPrimarySiteId()).resolves.toBe("site-1");
  });

  it("throws a clear error when no site exists", async () => {
    stubSelect({ data: [], error: null });
    await expect(getPrimarySiteId()).rejects.toThrow(/No site exists/);
  });

  it("throws a clear error when multiple sites exist (Phase 1 assumption)", async () => {
    stubSelect({ data: [{ id: "a" }, { id: "b" }], error: null });
    await expect(getPrimarySiteId()).rejects.toThrow(/Multiple sites exist \(2\)/);
  });

  it("surfaces the underlying Supabase error message on query failure", async () => {
    stubSelect({ data: null, error: { message: "connection refused" } });
    await expect(getPrimarySiteId()).rejects.toThrow(/connection refused/);
  });
});
