-- ============================================================================
-- PEOPLE ALSO ASK QUESTIONS
-- ============================================================================
--
-- Real PAA question text, at zero extra DataForSEO cost: the SERP sync
-- (src/lib/seo/dataforseo/serp.ts, Milestone 6) already pays for and
-- receives this data in every weekly call — it was just being discarded,
-- because a "people_also_ask" SERP item's real question text lives one
-- level deeper (people_also_ask_element[].title) than the code originally
-- read, and because serp_snapshots' domain/url/position are all NOT NULL,
-- organic-result-shaped columns a PAA question structurally can't satisfy
-- (it has none of those). This table is shaped for a question instead.
--
-- No domain/url/position — deliberately. A PAA question isn't a ranked
-- result; forcing it into serp_snapshots' shape was the original mistake.
CREATE TABLE IF NOT EXISTS public.paa_questions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id     UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  keyword_id  UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  question    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Same idempotency shape as serp_snapshots: a re-run within the same day
  -- for the same keyword is a safe no-op, not a duplicate.
  CONSTRAINT paa_questions_keyword_date_question_key UNIQUE (keyword_id, date, question),
  CONSTRAINT paa_questions_question_not_blank_check CHECK (btrim(question) <> '')
);

-- Supports: "load real PAA questions for this keyword" (content-brief.ts),
-- the same access pattern serp_snapshots' own index already serves.
CREATE INDEX IF NOT EXISTS idx_paa_site_kw_date ON public.paa_questions(site_id, keyword_id, date);

COMMENT ON TABLE public.paa_questions IS
  'Real Google "People Also Ask" questions, captured from the same weekly SERP sync as serp_snapshots (zero extra cost) but stored separately since a question has no domain/url/position. See PHASE_2_IMPLEMENTATION.md Milestone 16.';

ALTER TABLE public.paa_questions ENABLE ROW LEVEL SECURITY;
-- Same default-deny posture as every existing SEO table (Milestone 1):
-- enabled, zero anon/authenticated policies. service_role (BYPASSRLS) is
-- the only role with access, via src/lib/supabase/server.ts.

-- ============================================================================
-- ACTION OUTCOME TRACKING — promoted from a JSONB workaround to real columns
-- ============================================================================
--
-- Milestone 13 stored this in actions.supporting_data.outcomeTracking
-- because no migration path was available at the time (ADR-011) — that
-- ADR explicitly flagged promoting this to real columns as "a small,
-- low-risk follow-up once a migration path is available again." No
-- production action had captured a baseline yet (confirmed via a direct
-- query before writing this), so this is a pure additive schema change,
-- not a data migration.
ALTER TABLE public.actions
  ADD COLUMN IF NOT EXISTS baseline_metrics    JSONB,
  ADD COLUMN IF NOT EXISTS outcome_metrics     JSONB,
  ADD COLUMN IF NOT EXISTS outcome             TEXT,
  ADD COLUMN IF NOT EXISTS outcome_measured_at TIMESTAMPTZ;

ALTER TABLE public.actions
  ADD CONSTRAINT actions_outcome_check
    CHECK (outcome IS NULL OR outcome IN ('improved', 'unchanged', 'declined'));

ALTER TABLE public.actions
  ADD CONSTRAINT actions_outcome_measured_consistency_check
    CHECK (
      (outcome IS NULL AND outcome_measured_at IS NULL) OR
      (outcome IS NOT NULL AND outcome_measured_at IS NOT NULL)
    );

ALTER TABLE public.actions
  ADD CONSTRAINT actions_baseline_metrics_is_object_check
    CHECK (baseline_metrics IS NULL OR jsonb_typeof(baseline_metrics) = 'object');

ALTER TABLE public.actions
  ADD CONSTRAINT actions_outcome_metrics_is_object_check
    CHECK (outcome_metrics IS NULL OR jsonb_typeof(outcome_metrics) = 'object');

-- Supports: the daily outcome-measurement job's own query — "completed
-- actions with a baseline that haven't been measured yet." Partial so it
-- only ever indexes the (small, real-scale) set of rows that query
-- actually touches, not every action.
CREATE INDEX IF NOT EXISTS idx_actions_pending_outcome ON public.actions(site_id, completed_at)
  WHERE status = 'completed' AND baseline_metrics IS NOT NULL AND outcome IS NULL;

COMMENT ON COLUMN public.actions.baseline_metrics IS
  'Real keyword/page performance snapshot captured the moment this action was marked completed. See src/lib/seo/intelligence/action-outcomes.ts.';
COMMENT ON COLUMN public.actions.outcome IS
  'improved | unchanged | declined, set ~30 days after completion by comparing outcome_metrics against baseline_metrics.';
