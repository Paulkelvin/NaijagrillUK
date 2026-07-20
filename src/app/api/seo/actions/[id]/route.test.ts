import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockSupabase: any;
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

const mockCaptureActionMetrics = vi.fn();
vi.mock("@/lib/seo/intelligence/action-outcomes", () => ({
  captureActionMetrics: (...args: unknown[]) => mockCaptureActionMetrics(...args),
}));

const { PATCH } = await import("./route");

function request(body: unknown) {
  return new NextRequest("http://localhost/api/seo/actions/action-1", {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function params(id = "action-1") {
  return { params: Promise.resolve({ id }) };
}

interface MockConfig {
  updatedRow?: Record<string, unknown> | null;
  error?: { message: string } | null;
  // The row read back before marking an action "completed" (action-outcomes.ts's
  // baseline capture) — undefined means "not found", matching a real maybeSingle().
  fetchedRow?: Record<string, unknown> | null;
  fetchError?: { message: string } | null;
}

function makeSupabaseMock(config: MockConfig = {}) {
  const updateCalls: Array<Record<string, unknown>> = [];
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({ data: config.fetchedRow ?? null, error: config.fetchError ?? null }),
      })),
    })),
    update: vi.fn((values: Record<string, unknown>) => {
      updateCalls.push(values);
      return {
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: config.updatedRow ?? null, error: config.error ?? null }),
          })),
        })),
      };
    }),
  }));
  return { from, updateCalls };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCaptureActionMetrics.mockResolvedValue(null);
});

describe("PATCH /api/seo/actions/[id]", () => {
  it("returns 400 for invalid JSON", async () => {
    mockSupabase = makeSupabaseMock();
    const req = new NextRequest("http://localhost/api/seo/actions/action-1", {
      method: "PATCH",
      body: "not json",
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req, params());
    expect(res.status).toBe(400);
  });

  it("returns 400 when status is missing or not a valid enum value", async () => {
    mockSupabase = makeSupabaseMock();
    const res1 = await PATCH(request({}), params());
    expect(res1.status).toBe(400);

    const res2 = await PATCH(request({ status: "not_a_real_status" }), params());
    expect(res2.status).toBe(400);
  });

  it("sets completed_at when transitioning to a terminal status", async () => {
    const { from, updateCalls } = makeSupabaseMock({ updatedRow: { id: "action-1", status: "completed" } });
    mockSupabase = { from };

    const res = await PATCH(request({ status: "completed" }), params());
    expect(res.status).toBe(200);
    expect(updateCalls[0].status).toBe("completed");
    expect(updateCalls[0].completed_at).not.toBeNull();
  });

  it("keeps completed_at null when transitioning to a non-terminal status", async () => {
    const { from, updateCalls } = makeSupabaseMock({ updatedRow: { id: "action-1", status: "in_progress" } });
    mockSupabase = { from };

    const res = await PATCH(request({ status: "in_progress" }), params());
    expect(res.status).toBe(200);
    expect(updateCalls[0].completed_at).toBeNull();
  });

  it("returns 404 when no matching action exists", async () => {
    const { from } = makeSupabaseMock({ updatedRow: null });
    mockSupabase = { from };

    const res = await PATCH(request({ status: "skipped" }), params("missing-id"));
    expect(res.status).toBe(404);
  });

  it("returns 500 with the error message when the update fails", async () => {
    const { from } = makeSupabaseMock({ error: { message: "constraint violation" } });
    mockSupabase = { from };

    const res = await PATCH(request({ status: "dismissed" }), params());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: "constraint violation" });
  });

  it("returns the updated action on success", async () => {
    const { from } = makeSupabaseMock({ updatedRow: { id: "action-1", status: "queued", completed_at: null } });
    mockSupabase = { from };

    const res = await PATCH(request({ status: "queued" }), params());
    const body = await res.json();
    expect(body).toEqual({ ok: true, action: { id: "action-1", status: "queued", completed_at: null } });
  });

  it("captures a baseline metrics snapshot into supporting_data when transitioning into completed for the first time", async () => {
    const baseline = { window: "keyword", capturedAt: "t0", avgPosition: 12, clicks: 4, impressions: 80 };
    mockCaptureActionMetrics.mockResolvedValue(baseline);
    const { from, updateCalls } = makeSupabaseMock({
      fetchedRow: { status: "queued", keyword_id: "kw-1", page_id: null, supporting_data: { opportunityScore: 55 } },
      updatedRow: { id: "action-1", status: "completed" },
    });
    mockSupabase = { from };

    const res = await PATCH(request({ status: "completed" }), params());
    expect(res.status).toBe(200);
    expect(mockCaptureActionMetrics).toHaveBeenCalledWith(mockSupabase, { keywordId: "kw-1", pageId: null });
    expect(updateCalls[0].supporting_data).toEqual({ opportunityScore: 55, outcomeTracking: { baselineMetrics: baseline } });
    // The original status/completed_at behavior is unaffected by the addition.
    expect(updateCalls[0].status).toBe("completed");
    expect(updateCalls[0].completed_at).not.toBeNull();
  });

  it("does not re-capture a baseline when the action was already completed (idempotent re-PATCH)", async () => {
    const { from, updateCalls } = makeSupabaseMock({
      fetchedRow: { status: "completed", keyword_id: "kw-1", page_id: null, supporting_data: { outcomeTracking: { baselineMetrics: { window: "keyword" } } } },
      updatedRow: { id: "action-1", status: "completed" },
    });
    mockSupabase = { from };

    await PATCH(request({ status: "completed" }), params());
    expect(mockCaptureActionMetrics).not.toHaveBeenCalled();
    expect(updateCalls[0].supporting_data).toBeUndefined();
  });

  it("skips baseline capture (but still completes the action) when there's nothing to measure against", async () => {
    mockCaptureActionMetrics.mockResolvedValue(null); // action-outcomes.ts's defensive null case
    const { from, updateCalls } = makeSupabaseMock({
      fetchedRow: { status: "queued", keyword_id: null, page_id: null, supporting_data: {} },
      updatedRow: { id: "action-1", status: "completed" },
    });
    mockSupabase = { from };

    const res = await PATCH(request({ status: "completed" }), params());
    expect(res.status).toBe(200);
    expect(updateCalls[0].supporting_data).toBeUndefined();
  });

  it("does not fetch/capture a baseline for non-completed transitions", async () => {
    const { from } = makeSupabaseMock({ updatedRow: { id: "action-1", status: "skipped" } });
    mockSupabase = { from };

    await PATCH(request({ status: "skipped" }), params());
    expect(mockCaptureActionMetrics).not.toHaveBeenCalled();
  });
});
