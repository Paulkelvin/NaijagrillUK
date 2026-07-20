import { describe, expect, it } from "vitest";
import { fetchContentBriefs } from "./content-brief";

function makeSupabaseMock(rows: unknown[]) {
  return {
    from: () => ({
      select: () => ({
        in: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      }),
    }),
  };
}

describe("fetchContentBriefs", () => {
  it("returns an empty map without querying when there are no keyword ids", async () => {
    const result = await fetchContentBriefs({ from: () => { throw new Error("should not be called"); } }, []);
    expect(result.size).toBe(0);
  });

  it("uses only the most recent snapshot date per keyword, ignoring older ones", async () => {
    const supabase = makeSupabaseMock([
      { keyword_id: "kw-1", date: "2026-07-20", domain: "newer-competitor.com", title: "New", position: 3, is_own_site: false },
      { keyword_id: "kw-1", date: "2026-07-13", domain: "stale-competitor.com", title: "Stale", position: 1, is_own_site: false },
    ]);
    const result = await fetchContentBriefs(supabase, ["kw-1"]);
    const brief = result.get("kw-1")!;
    expect(brief.snapshotDate).toBe("2026-07-20");
    expect(brief.competitors).toEqual([{ domain: "newer-competitor.com", title: "New", position: 3 }]);
  });

  it("separates your own result from competitors and sorts competitors by position", async () => {
    const supabase = makeSupabaseMock([
      { keyword_id: "kw-1", date: "2026-07-20", domain: "b-competitor.com", title: "B", position: 8, is_own_site: false },
      { keyword_id: "kw-1", date: "2026-07-20", domain: "naijagrillandspice.co.uk", title: "Us", position: 4, is_own_site: true },
      { keyword_id: "kw-1", date: "2026-07-20", domain: "a-competitor.com", title: "A", position: 2, is_own_site: false },
    ]);
    const result = await fetchContentBriefs(supabase, ["kw-1"]);
    const brief = result.get("kw-1")!;
    expect(brief.ownPosition).toBe(4);
    expect(brief.competitors.map((c) => c.domain)).toEqual(["a-competitor.com", "b-competitor.com"]);
  });

  it("caps competitors at 5, keeping the best-positioned ones", async () => {
    const rows = Array.from({ length: 8 }, (_, i) => ({
      keyword_id: "kw-1",
      date: "2026-07-20",
      domain: `competitor-${i}.com`,
      title: `Title ${i}`,
      position: i + 1,
      is_own_site: false,
    }));
    const supabase = makeSupabaseMock(rows);
    const result = await fetchContentBriefs(supabase, ["kw-1"]);
    expect(result.get("kw-1")!.competitors).toHaveLength(5);
    expect(result.get("kw-1")!.competitors[0].position).toBe(1);
  });

  it("returns null ownPosition when your site doesn't appear in the snapshot at all", async () => {
    const supabase = makeSupabaseMock([{ keyword_id: "kw-1", date: "2026-07-20", domain: "competitor.com", title: "T", position: 1, is_own_site: false }]);
    const result = await fetchContentBriefs(supabase, ["kw-1"]);
    expect(result.get("kw-1")!.ownPosition).toBeNull();
  });

  it("keeps separate briefs for multiple keywords from one batched query", async () => {
    const supabase = makeSupabaseMock([
      { keyword_id: "kw-1", date: "2026-07-20", domain: "a.com", title: "A", position: 1, is_own_site: false },
      { keyword_id: "kw-2", date: "2026-07-20", domain: "b.com", title: "B", position: 2, is_own_site: false },
    ]);
    const result = await fetchContentBriefs(supabase, ["kw-1", "kw-2"]);
    expect(result.size).toBe(2);
    expect(result.get("kw-1")!.competitors[0].domain).toBe("a.com");
    expect(result.get("kw-2")!.competitors[0].domain).toBe("b.com");
  });

  it("returns an empty map when no keyword has any snapshot yet", async () => {
    const supabase = makeSupabaseMock([]);
    const result = await fetchContentBriefs(supabase, ["kw-1"]);
    expect(result.size).toBe(0);
  });
});
