// Integration tests against the real Supabase project (ENGINEERING_STANDARDS.md
// §8) — skipped by default so `npm test` stays fast and credential-free.
// Run explicitly with: npm run test:integration
//
// Every row this file creates is deleted in afterAll, tracked by id as it's
// created. Nothing pre-existing is ever read or mutated.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { completeSyncRun, startSyncRun } from "./sync-log";

const runIntegration = process.env.RUN_INTEGRATION_TESTS === "1";

describe.skipIf(!runIntegration)("sync-log integration (real Supabase)", () => {
  let siteId: string;
  const createdRunIds: number[] = [];

  beforeAll(async () => {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("sites")
      .select("id")
      .eq("domain", "naijagrillandspice.co.uk")
      .single();
    if (error || !data) {
      throw new Error(`Could not resolve seeded site for integration tests: ${error?.message}`);
    }
    siteId = data.id;
  });

  afterAll(async () => {
    if (createdRunIds.length === 0) return;
    const supabase = createSupabaseServiceRoleClient();
    await supabase.from("sync_log").delete().in("id", createdRunIds);
  });

  it("startSyncRun -> completeSyncRun('completed') produces a correct row", async () => {
    const runId = await startSyncRun(siteId, "ping", "test-endpoint");
    createdRunIds.push(runId);

    await completeSyncRun(runId, {
      status: "completed",
      recordsProcessed: 7,
      apiCreditsUsed: 0.5,
      metadata: { warnings: ["example warning"] },
    });

    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase.from("sync_log").select("*").eq("id", runId).single();

    expect(error).toBeNull();
    expect(data.status).toBe("completed");
    expect(data.records_processed).toBe(7);
    expect(data.api_credits_used).toBe(0.5);
    expect(data.completed_at).not.toBeNull();
    expect(data.error_message).toBeNull();
    expect(data.metadata.warnings).toEqual(["example warning"]);
    expect(data.metadata.retry_count).toBe(0); // default fills applied
  });

  it("startSyncRun -> simulated throw -> completeSyncRun('failed') produces a row with error_message set", async () => {
    const runId = await startSyncRun(siteId, "ping", "test-endpoint");
    createdRunIds.push(runId);

    try {
      throw new Error("simulated failure for integration test");
    } catch (err) {
      await completeSyncRun(runId, {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }

    const supabase = createSupabaseServiceRoleClient();
    const { data } = await supabase.from("sync_log").select("*").eq("id", runId).single();

    expect(data.status).toBe("failed");
    expect(data.error_message).toBe("simulated failure for integration test");
    expect(data.completed_at).not.toBeNull();
  });

  it("two concurrent startSyncRun calls for the same source produce two distinct rows", async () => {
    const [runIdA, runIdB] = await Promise.all([
      startSyncRun(siteId, "ping", "concurrent-a"),
      startSyncRun(siteId, "ping", "concurrent-b"),
    ]);
    createdRunIds.push(runIdA, runIdB);

    expect(runIdA).not.toBe(runIdB);

    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("sync_log")
      .select("id, endpoint, status")
      .in("id", [runIdA, runIdB]);

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    // both still "started" — this test doesn't complete them, proving the
    // insert path alone doesn't collide even without a completion step
    expect(data?.every((row) => row.status === "started")).toBe(true);

    // clean up their "started" state isn't required for correctness, but
    // complete them anyway so no row is left dangling for the stale-run
    // detection (Milestone 7) to (correctly) flag during manual testing.
    await Promise.all([
      completeSyncRun(runIdA, { status: "completed" }),
      completeSyncRun(runIdB, { status: "completed" }),
    ]);
  });
});
