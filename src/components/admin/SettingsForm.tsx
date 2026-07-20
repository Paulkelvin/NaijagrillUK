"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Mirrors each module's own hardcoded default (opportunity-score.ts,
// run-analysis.ts's DEFAULT_PAGE_ROI_WEIGHTS, cannibalization.ts,
// site_configs' own migration seed for internal_link — not yet consumed
// by any Phase 2 module, but already shipped in the schema default, so
// it's editable here for forward-compatibility). Used only when a module
// is entirely missing from the loaded row, so the form never starts blank.
const MODULE_DEFAULTS: Record<string, Record<string, number>> = {
  opportunity: { volume: 0.2, position: 0.35, difficulty: 0.15, intent: 0.15, business_value: 0.15 },
  page_roi: { traffic_potential: 0.35, conversion_rate: 0.3, effort_inverse: 0.2, decay_urgency: 0.15 },
  cannibalization: { position_variance: 0.25, click_split: 0.3, ctr_deficit: 0.25, traffic_at_risk: 0.2 },
  internal_link: { target_potential: 0.3, source_authority: 0.25, topical_relevance: 0.25, link_deficit: 0.2 },
};

const MODULE_LABELS: Record<string, string> = {
  opportunity: "Opportunity Score",
  page_roi: "Page ROI Score",
  cannibalization: "Cannibalization Score",
  internal_link: "Internal Linking (Phase 3, not yet used)",
};

type WeightsByModule = Record<string, Record<string, number>>;
interface ConversionEvent {
  name: string;
  value: number;
}

interface SettingsFormProps {
  initialScoringWeights: WeightsByModule;
  initialConversionEvents: ConversionEvent[];
}

const INPUT_CLASS =
  "w-24 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-amber-300/60";
const LABEL_CLASS = "text-sm text-white/70";
const CARD_CLASS = "rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6";
const BUTTON_CLASS =
  "rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-amber-300/50 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

function moduleWeights(initial: WeightsByModule, moduleName: string): Record<string, number> {
  return Object.keys(initial[moduleName] ?? {}).length > 0 ? initial[moduleName] : MODULE_DEFAULTS[moduleName];
}

export function SettingsForm({ initialScoringWeights, initialConversionEvents }: SettingsFormProps) {
  const router = useRouter();
  const [weights, setWeights] = useState<WeightsByModule>(() =>
    Object.fromEntries(Object.keys(MODULE_DEFAULTS).map((m) => [m, moduleWeights(initialScoringWeights, m)])),
  );
  const [events, setEvents] = useState<ConversionEvent[]>(initialConversionEvents);
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "success" | "error"; message?: string }>({
    kind: "idle",
  });

  function setWeight(moduleName: string, key: string, value: number) {
    setWeights((prev) => ({ ...prev, [moduleName]: { ...prev[moduleName], [key]: value } }));
  }

  function addEvent() {
    setEvents((prev) => [...prev, { name: "", value: 0 }]);
  }

  function updateEvent(index: number, field: "name" | "value", value: string | number) {
    setEvents((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  }

  function removeEvent(index: number) {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/seo/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoring_weights: weights, conversion_events: events }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ kind: "error", message: body.error ?? `Failed (${res.status})` });
        return;
      }
      setStatus({ kind: "success" });
      router.refresh();
    } catch {
      setStatus({ kind: "error", message: "Network error — try again." });
    }
  }

  return (
    <div className="space-y-6">
      {Object.keys(MODULE_DEFAULTS).map((moduleName) => {
        const moduleWeightValues = weights[moduleName];
        const sum = Object.values(moduleWeightValues).reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
        const sumOk = Math.abs(sum - 1) <= 0.01;
        return (
          <div key={moduleName} className={CARD_CLASS}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-white">{MODULE_LABELS[moduleName]}</h2>
              <span className={sumOk ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
                Sum: {sum.toFixed(3)} {sumOk ? "✓" : "(must be 1.0)"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Object.entries(moduleWeightValues).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between gap-2">
                  <span className={LABEL_CLASS}>{key.replace(/_/g, " ")}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    className={INPUT_CLASS}
                    value={value}
                    onChange={(e) => setWeight(moduleName, key, Number(e.target.value))}
                  />
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <div className={CARD_CLASS}>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-white">Conversion Events</h2>
          <button type="button" className={BUTTON_CLASS} onClick={addEvent}>
            + Add event
          </button>
        </div>
        {events.length === 0 && <p className="text-sm text-white/50">No conversion events configured.</p>}
        <div className="space-y-2">
          {events.map((event, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="text"
                placeholder="event name, e.g. whatsapp_click"
                className={`${INPUT_CLASS} flex-1`}
                value={event.name}
                onChange={(e) => updateEvent(index, "name", e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="value"
                className={INPUT_CLASS}
                value={event.value}
                onChange={(e) => updateEvent(index, "value", Number(e.target.value))}
              />
              <button type="button" className={BUTTON_CLASS} onClick={() => removeEvent(index)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="button" className={BUTTON_CLASS} disabled={status.kind === "saving"} onClick={save}>
          {status.kind === "saving" ? "Saving…" : "Save settings"}
        </button>
        {status.kind === "success" && <span className="text-sm text-emerald-400">Saved.</span>}
        {status.kind === "error" && <span className="text-sm text-red-400">{status.message}</span>}
      </div>
    </div>
  );
}
