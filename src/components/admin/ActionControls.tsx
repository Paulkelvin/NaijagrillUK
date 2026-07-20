"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const BUTTON_CLASS =
  "rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-amber-300/50 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

interface ActionControlsProps {
  actionId: string;
  status: string;
}

/**
 * Status mutation buttons for one action-queue row. Talks to
 * /api/seo/actions/[id] directly — that route is Basic-Auth protected by
 * middleware.ts, and the browser already holds those credentials from
 * loading /admin/seo itself, so no extra auth wiring is needed here.
 */
export function ActionControls({ actionId, status }: ActionControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function mutate(nextStatus: string) {
    setError(null);
    try {
      const res = await fetch(`/api/seo/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Failed (${res.status})`);
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Network error — try again.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "queued" && (
        <button type="button" className={BUTTON_CLASS} disabled={isPending} onClick={() => mutate("in_progress")}>
          Start
        </button>
      )}
      {status === "in_progress" && (
        <button type="button" className={BUTTON_CLASS} disabled={isPending} onClick={() => mutate("completed")}>
          Complete
        </button>
      )}
      <button type="button" className={BUTTON_CLASS} disabled={isPending} onClick={() => mutate("skipped")}>
        Skip
      </button>
      <button type="button" className={BUTTON_CLASS} disabled={isPending} onClick={() => mutate("dismissed")}>
        Dismiss
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
