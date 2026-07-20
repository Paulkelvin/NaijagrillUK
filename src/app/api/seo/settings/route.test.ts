import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPrimarySiteId = vi.fn();
vi.mock("@/lib/seo/site", () => ({
  getPrimarySiteId: () => mockGetPrimarySiteId(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

const { PUT } = await import("./route");

function request(body: unknown) {
  return new NextRequest("http://localhost/api/seo/settings", {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const VALID_OPPORTUNITY_WEIGHTS = { volume: 0.2, position: 0.35, difficulty: 0.15, intent: 0.15, business_value: 0.15 };

interface MockConfig {
  existingScoringWeights?: Record<string, unknown>;
  fetchError?: { message: string } | null;
  updatedRow?: Record<string, unknown> | null;
  updateError?: { message: string } | null;
}

function makeSupabaseMock(config: MockConfig = {}) {
  const updateCalls: Array<Record<string, unknown>> = [];
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { scoring_weights: config.existingScoringWeights ?? {} },
          error: config.fetchError ?? null,
        }),
      })),
    })),
    update: vi.fn((values: Record<string, unknown>) => {
      updateCalls.push(values);
      return {
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: config.updatedRow ?? null, error: config.updateError ?? null }),
          })),
        })),
      };
    }),
  }));
  return { from, updateCalls };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPrimarySiteId.mockResolvedValue("site-1");
});

describe("PUT /api/seo/settings", () => {
  it("returns 400 for invalid JSON", async () => {
    mockSupabase = makeSupabaseMock();
    const req = new NextRequest("http://localhost/api/seo/settings", {
      method: "PUT",
      body: "not json",
      headers: { "content-type": "application/json" },
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when neither scoring_weights nor conversion_events is provided", async () => {
    mockSupabase = makeSupabaseMock();
    const res = await PUT(request({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when a module's weights don't sum to 1.0", async () => {
    mockSupabase = makeSupabaseMock();
    const res = await PUT(request({ scoring_weights: { opportunity: { volume: 0.5, position: 0.2 } } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("sum to 1.0");
  });

  it("returns 400 for a negative weight", async () => {
    mockSupabase = makeSupabaseMock();
    const res = await PUT(request({ scoring_weights: { opportunity: { ...VALID_OPPORTUNITY_WEIGHTS, volume: -0.1 } } }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a conversion_event with a non-positive value", async () => {
    mockSupabase = makeSupabaseMock();
    const res = await PUT(request({ conversion_events: [{ name: "whatsapp_click", value: 0 }] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a conversion_event with an empty name", async () => {
    mockSupabase = makeSupabaseMock();
    const res = await PUT(request({ conversion_events: [{ name: "", value: 15 }] }));
    expect(res.status).toBe(400);
  });

  it("shallow-merges new scoring_weights over the existing modules, not replacing the whole column", async () => {
    const { from, updateCalls } = makeSupabaseMock({
      existingScoringWeights: {
        opportunity: VALID_OPPORTUNITY_WEIGHTS,
        cannibalization: { position_variance: 0.25, click_split: 0.3, ctr_deficit: 0.25, traffic_at_risk: 0.2 },
      },
      updatedRow: { scoring_weights: {}, conversion_events: [] },
    });
    mockSupabase = { from };

    const newPageRoiWeights = { traffic_potential: 0.35, conversion_rate: 0.3, effort_inverse: 0.2, decay_urgency: 0.15 };
    const res = await PUT(request({ scoring_weights: { page_roi: newPageRoiWeights } }));

    expect(res.status).toBe(200);
    const merged = updateCalls[0].scoring_weights as Record<string, unknown>;
    expect(merged.opportunity).toEqual(VALID_OPPORTUNITY_WEIGHTS);
    expect(merged.page_roi).toEqual(newPageRoiWeights);
    expect(merged.cannibalization).toBeDefined();
  });

  it("accepts a valid conversion_events update", async () => {
    const { from, updateCalls } = makeSupabaseMock({ updatedRow: { scoring_weights: {}, conversion_events: [] } });
    mockSupabase = { from };

    const events = [{ name: "whatsapp_click", value: 15 }, { name: "uber_eats_click", value: 12 }];
    const res = await PUT(request({ conversion_events: events }));

    expect(res.status).toBe(200);
    expect(updateCalls[0].conversion_events).toEqual(events);
  });

  it("returns 404 when site_configs has no matching row", async () => {
    const { from } = makeSupabaseMock({ updatedRow: null });
    mockSupabase = { from };

    const res = await PUT(request({ conversion_events: [{ name: "x", value: 1 }] }));
    expect(res.status).toBe(404);
  });

  it("returns 500 with the error message when the update fails", async () => {
    const { from } = makeSupabaseMock({ updateError: { message: "constraint violation" } });
    mockSupabase = { from };

    const res = await PUT(request({ conversion_events: [{ name: "x", value: 1 }] }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "constraint violation" });
  });
});
