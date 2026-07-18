-- ============================================================================
-- SEO Intelligence Platform — Core Schema (Phase 1)
--
-- Implements the subset of docs/seo-platform/ARCHITECTURE.md §3 needed for
-- Milestones 1–8: GSC/GA4 ingestion, normalization, retention, and
-- observability. Deliberately excludes DataForSEO/competitor/action-queue
-- tables (competitors, serp_snapshots, internal_links, actions,
-- action_outcomes, api_budgets) — those belong to Phase 2/3 per
-- docs/seo-platform/PHASE_1_IMPLEMENTATION.md.
--
-- Idempotency: every statement is safe to re-run in development.
--   - CREATE TABLE IF NOT EXISTS with constraints defined inline (so a
--     re-run that finds the table already present skips the whole
--     statement, constraints included — no separate ALTER TABLE ADD
--     CONSTRAINT calls to fail on re-run).
--   - The one constraint that cannot be inline (topic_clusters.pillar_page_id
--     → pages.id, a circular dependency) is added via a guarded DO block.
--   - Triggers use DROP TRIGGER IF EXISTS + CREATE TRIGGER (Postgres has no
--     CREATE TRIGGER IF NOT EXISTS).
--   - Seed data uses ON CONFLICT DO NOTHING.
--
-- RLS: every table below has RLS enabled with NO policies for anon/
-- authenticated — this is default-deny, not default-allow. These are
-- server-only tables (unlike the public form tables in the initial
-- migration, which intentionally allow anonymous insert). All access is via
-- the Supabase service_role key, whose Postgres role has BYPASSRLS set by
-- Supabase automatically — it does not need, and does not get, any policy
-- here. See "RLS Summary" in the Milestone 1 write-up in
-- docs/seo-platform/PHASE_1_IMPLEMENTATION.md for the verification method.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Shared trigger: maintain updated_at on any table that has one.
-- Applied per-table below via DROP TRIGGER IF EXISTS + CREATE TRIGGER.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seo_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  domain        TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'restaurant',
  -- Lightweight overrides only (feature flags etc.). Heavy, structured
  -- configuration lives in site_configs — see ARCHITECTURE.md §3.
  config        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT sites_domain_key UNIQUE (domain),
  CONSTRAINT sites_business_type_check
    CHECK (business_type IN ('restaurant', 'ecommerce', 'service', 'blog', 'beauty')),
  CONSTRAINT sites_config_is_object_check
    CHECK (jsonb_typeof(config) = 'object')
);

COMMENT ON TABLE public.sites IS
  'Each site is an independent property being tracked. All other SEO tables reference site_id.';

DROP TRIGGER IF EXISTS sites_set_updated_at ON public.sites;
CREATE TRIGGER sites_set_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();

-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.site_configs (
  -- 1:1 with sites — the PK is the FK, no independent identity, so
  -- ON DELETE CASCADE is correct: a config row is meaningless without its site.
  site_id UUID PRIMARY KEY REFERENCES public.sites(id) ON DELETE CASCADE,

  scoring_weights JSONB NOT NULL DEFAULT '{
    "opportunity": {
      "volume": 0.20, "position": 0.35, "difficulty": 0.15,
      "intent": 0.15, "business_value": 0.15
    },
    "page_roi": {
      "traffic_potential": 0.35, "conversion_rate": 0.30,
      "effort_inverse": 0.20, "decay_urgency": 0.15
    },
    "cannibalization": {
      "position_variance": 0.25, "click_split": 0.30,
      "ctr_deficit": 0.25, "traffic_at_risk": 0.20
    },
    "internal_link": {
      "target_potential": 0.30, "source_authority": 0.25,
      "topical_relevance": 0.25, "link_deficit": 0.20
    }
  }',

  -- Business-specific conversion events, e.g.
  -- [{"name": "whatsapp_click", "value": 15}]. Empty by default — every
  -- business must configure its own; there is no sane universal default.
  conversion_events JSONB NOT NULL DEFAULT '[]',

  refresh_schedules JSONB NOT NULL DEFAULT '{
    "gsc": "daily", "ga4": "daily",
    "dataforseo_volume": "monthly", "dataforseo_serp": "weekly"
  }',

  -- Populated by the Site-Specific CTR Model job (ARCHITECTURE.md §5.4).
  -- Defaults to industry averages until ≥1,000 clicks of site data exist.
  ctr_model JSONB NOT NULL DEFAULT '{
    "source": "industry_default",
    "positions": {
      "1": 0.28, "2": 0.15, "3": 0.11, "4": 0.08, "5": 0.06,
      "6": 0.045, "7": 0.04, "8": 0.035, "9": 0.03, "10": 0.025,
      "11": 0.015, "12": 0.012, "13": 0.010, "14": 0.008, "15": 0.007,
      "16": 0.006, "17": 0.005, "18": 0.005, "19": 0.004, "20": 0.004
    },
    "sample_size": 0
  }',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT site_configs_scoring_weights_is_object_check
    CHECK (jsonb_typeof(scoring_weights) = 'object'),
  CONSTRAINT site_configs_conversion_events_is_array_check
    CHECK (jsonb_typeof(conversion_events) = 'array'),
  CONSTRAINT site_configs_refresh_schedules_is_object_check
    CHECK (jsonb_typeof(refresh_schedules) = 'object'),
  CONSTRAINT site_configs_ctr_model_is_object_check
    CHECK (jsonb_typeof(ctr_model) = 'object')
);

COMMENT ON COLUMN public.site_configs.scoring_weights IS
  'Configurable weights per scoring module. Allows tuning per business type without code changes (ADR-007).';

DROP TRIGGER IF EXISTS site_configs_set_updated_at ON public.site_configs;
CREATE TRIGGER site_configs_set_updated_at
  BEFORE UPDATE ON public.site_configs
  FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();

-- ============================================================================
-- CONTENT ENTITIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.topic_clusters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id        UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  -- FK to pages added below via DO block — pages doesn't exist yet at this
  -- point (circular reference: pages.topic_cluster_id → topic_clusters.id).
  pillar_page_id UUID,
  -- Optional: not every cluster needs a written description.
  description    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Business rule: cluster names are meant to be human-chosen and unique per
  -- site (manual tagging UI, ADR-004) — a site should never have two
  -- clusters called "Menu Pages". Addition beyond ARCHITECTURE.md's original
  -- schema; see Milestone 1 "Differences from Architecture" for reasoning.
  CONSTRAINT topic_clusters_site_name_key UNIQUE (site_id, name)
);

CREATE INDEX IF NOT EXISTS idx_topic_clusters_site ON public.topic_clusters(site_id);
-- Supports: Topical Authority Score (ARCHITECTURE.md §5.6) iterating
-- "for each topic_cluster" scoped to a site.

DROP TRIGGER IF EXISTS topic_clusters_set_updated_at ON public.topic_clusters;
CREATE TRIGGER topic_clusters_set_updated_at
  BEFORE UPDATE ON public.topic_clusters
  FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();

-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id          UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  url              TEXT NOT NULL,
  path             TEXT NOT NULL,
  -- Nullable: not every page has been crawled/classified yet. NULL means
  -- "unknown", distinct from an empty string.
  title            TEXT,
  meta_description TEXT,
  -- Nullable: only populated after a site crawl (Phase 3). NULL until then.
  word_count       INTEGER,
  -- Nullable: unknown until manually tagged or inferred. NULL is a valid,
  -- expected state through Phase 1/2 — the Intent Alignment Check
  -- (ARCHITECTURE.md §5.9) explicitly skips pages without this set.
  content_type     TEXT,
  topic_cluster_id UUID REFERENCES public.topic_clusters(id) ON DELETE SET NULL,
  -- Nullable: only populated after a crawl (Phase 3).
  h1               TEXT,
  -- Nullable (no default) is intentional: NULL means "not yet crawled";
  -- '{}' would mean "crawled, and genuinely has zero schema types" — these
  -- are different facts and collapsing them would lose information.
  schema_types     TEXT[],
  first_seen       DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Nullable: null until the Phase 3 site crawler runs against this page.
  last_crawled     TIMESTAMPTZ,
  -- Nullable: populated by the CMS webhook, not implemented in Phase 1.
  cms_published_at TIMESTAMPTZ,
  cms_updated_at   TIMESTAMPTZ,
  is_indexed       BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pages_site_path_key UNIQUE (site_id, path),
  CONSTRAINT pages_content_type_check
    CHECK (content_type IS NULL OR content_type IN
      ('blog_post', 'landing_page', 'product_page', 'category_page', 'service_page'))
);

-- Supports: Topical Authority Score's per-cluster page lookups
-- (ARCHITECTURE.md §5.6). A plain site_id index is not added separately —
-- this composite index already serves site_id-only queries via its
-- leftmost column.
CREATE INDEX IF NOT EXISTS idx_pages_site_cluster ON public.pages(site_id, topic_cluster_id);

DROP TRIGGER IF EXISTS pages_set_updated_at ON public.pages;
CREATE TRIGGER pages_set_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();

-- Deferred FK: topic_clusters.pillar_page_id → pages.id. Added here now that
-- pages exists. ON DELETE SET NULL: if the pillar page is deleted, the
-- cluster still exists but loses its pillar reference rather than cascading
-- into cluster deletion.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topic_clusters_pillar_page_id_fkey'
  ) THEN
    ALTER TABLE public.topic_clusters
      ADD CONSTRAINT topic_clusters_pillar_page_id_fkey
      FOREIGN KEY (pillar_page_id) REFERENCES public.pages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- KEYWORD ENTITIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.keywords (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  keyword             TEXT NOT NULL,
  keyword_normalized  TEXT NOT NULL,
  -- Nullable: only populated by DataForSEO (Phase 2). NULL in Phase 1.
  search_volume       INTEGER,
  -- Nullable: DataForSEO only (Phase 2). Scale is 0–100 per
  -- ARCHITECTURE.md §5.1's difficulty_score formula.
  keyword_difficulty  REAL,
  -- Nullable: DataForSEO only (Phase 2).
  cpc                 REAL,
  -- Nullable: requires SERP analysis or manual tagging (Phase 2/3). The
  -- Intent Alignment Check (ARCHITECTURE.md §5.9) is explicitly skipped
  -- until this is populated.
  search_intent       TEXT,
  is_target           BOOLEAN NOT NULL DEFAULT false,
  -- Nullable: DataForSEO only (Phase 2). NULL means "not yet fetched",
  -- distinct from an empty object.
  monthly_volumes     JSONB,
  -- NOT NULL: every keyword row is created by a specific sync job, which
  -- always knows its own source at write time (Phase 1: always 'gsc').
  -- Stronger than ARCHITECTURE.md's original nullable column — see
  -- Milestone 1 "Differences from Architecture".
  data_source         TEXT NOT NULL,
  -- Nullable: null until the first DataForSEO volume refresh (Phase 2).
  last_volume_refresh TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT keywords_site_normalized_key UNIQUE (site_id, keyword_normalized),
  CONSTRAINT keywords_search_volume_check
    CHECK (search_volume IS NULL OR search_volume >= 0),
  CONSTRAINT keywords_difficulty_range_check
    CHECK (keyword_difficulty IS NULL OR (keyword_difficulty >= 0 AND keyword_difficulty <= 100)),
  CONSTRAINT keywords_cpc_check
    CHECK (cpc IS NULL OR cpc >= 0),
  CONSTRAINT keywords_search_intent_check
    CHECK (search_intent IS NULL OR search_intent IN
      ('informational', 'navigational', 'commercial', 'transactional')),
  CONSTRAINT keywords_monthly_volumes_is_object_check
    CHECK (monthly_volumes IS NULL OR jsonb_typeof(monthly_volumes) = 'object'),
  CONSTRAINT keywords_data_source_check
    CHECK (data_source IN ('gsc', 'dataforseo', 'manual'))
);

-- Supports: Opportunity Score (ARCHITECTURE.md §5.1) iterating target vs.
-- discovered keywords per site.
CREATE INDEX IF NOT EXISTS idx_keywords_site_target ON public.keywords(site_id, is_target);

DROP TRIGGER IF EXISTS keywords_set_updated_at ON public.keywords;
CREATE TRIGGER keywords_set_updated_at
  BEFORE UPDATE ON public.keywords
  FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();

-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cluster_keywords (
  cluster_id UUID NOT NULL REFERENCES public.topic_clusters(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (cluster_id, keyword_id)
);

-- Supports: reverse lookup "which cluster(s) is this keyword in" for the
-- keyword detail view (ARCHITECTURE.md §8 /admin/seo/keywords/[id]). The
-- composite PK's leftmost column is cluster_id, so it does not serve
-- keyword_id-first lookups.
CREATE INDEX IF NOT EXISTS idx_cluster_keywords_keyword ON public.cluster_keywords(keyword_id);

DROP TRIGGER IF EXISTS cluster_keywords_set_updated_at ON public.cluster_keywords;
CREATE TRIGGER cluster_keywords_set_updated_at
  BEFORE UPDATE ON public.cluster_keywords
  FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();

-- ============================================================================
-- TIME-SERIES METRICS
-- ============================================================================

-- GSC data: one row per keyword × page × day.
CREATE TABLE IF NOT EXISTS public.keyword_page_metrics (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Denormalized: also derivable via keyword_id → keywords.site_id or
  -- page_id → pages.site_id. Kept as a direct column specifically so
  -- idx_kpm_site_date can serve site-scoped date-range queries without a
  -- join. The FK+CASCADE here is redundant with the cascades on keyword_id/
  -- page_id (deleting a site already cascade-deletes its keywords and
  -- pages, which would cascade-delete these rows anyway) but is kept for
  -- referential-integrity consistency with the rest of the schema.
  site_id     UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  keyword_id  UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  page_id     UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  -- Nullable: GSC's API contract does not guarantee position is always
  -- present, though in practice it is whenever impressions > 0. Kept
  -- nullable defensively rather than assumed.
  position    REAL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks      INTEGER NOT NULL DEFAULT 0,
  -- Nullable: undefined when impressions = 0 (division by zero); GSC omits
  -- it in that case rather than returning 0.
  ctr         REAL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Rows are upserted (ON CONFLICT DO UPDATE) whenever a sync re-runs for a
  -- date already ingested — updated_at distinguishes "written once" from
  -- "re-synced", which matters for debugging late-arriving GSC data.
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT keyword_page_metrics_keyword_page_date_key UNIQUE (keyword_id, page_id, date),
  -- Mirrors the application-layer validation in ARCHITECTURE.md §4.1
  -- ("Reject rows where position < 1 or > 1000") at the database level —
  -- defense in depth per the Milestone 1 database-first rules.
  CONSTRAINT keyword_page_metrics_position_range_check
    CHECK (position IS NULL OR (position >= 1 AND position <= 1000)),
  CONSTRAINT keyword_page_metrics_impressions_check CHECK (impressions >= 0),
  CONSTRAINT keyword_page_metrics_clicks_check CHECK (clicks >= 0),
  -- Mirrors ARCHITECTURE.md §4.1's "Reject rows where clicks > impressions".
  CONSTRAINT keyword_page_metrics_clicks_le_impressions_check CHECK (clicks <= impressions),
  CONSTRAINT keyword_page_metrics_ctr_range_check
    CHECK (ctr IS NULL OR (ctr >= 0 AND ctr <= 1))
);

COMMENT ON TABLE public.keyword_page_metrics IS
  'Core analytical table. Every insight (cannibalization, decay, opportunity) queries this. Daily granularity kept 6 months; weekly aggregates (keyword_page_metrics_weekly) kept indefinitely.';

-- Supports: Cannibalization Score's 90-day lookback (ARCHITECTURE.md §5.3)
-- and the retention job's "older than 6 months" scan (§3 Retention Policy).
CREATE INDEX IF NOT EXISTS idx_kpm_site_date ON public.keyword_page_metrics(site_id, date);
-- Supports: Page ROI Score's per-page 30-day keyword scan (§5.2).
CREATE INDEX IF NOT EXISTS idx_kpm_page_date ON public.keyword_page_metrics(page_id, date);
-- Supports: Opportunity Score's "best position, last 7 days" per keyword
-- (§5.1) and the Site-Specific CTR Model's per-position aggregation (§5.4).
CREATE INDEX IF NOT EXISTS idx_kpm_keyword_date ON public.keyword_page_metrics(keyword_id, date);

DROP TRIGGER IF EXISTS keyword_page_metrics_set_updated_at ON public.keyword_page_metrics;
CREATE TRIGGER keyword_page_metrics_set_updated_at
  BEFORE UPDATE ON public.keyword_page_metrics
  FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();

-- ----------------------------------------------------------------------------

-- Aggregated weekly view, populated by the retention job (Milestone 8).
CREATE TABLE IF NOT EXISTS public.keyword_page_metrics_weekly (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id            UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  keyword_id         UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  page_id            UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  -- Must be the Monday of its week — enforced below rather than trusted to
  -- the retention job's application code.
  week_start         DATE NOT NULL,
  avg_position       REAL,
  total_impressions  INTEGER NOT NULL DEFAULT 0,
  total_clicks       INTEGER NOT NULL DEFAULT 0,
  avg_ctr            REAL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT kpm_weekly_keyword_page_week_key UNIQUE (keyword_id, page_id, week_start),
  CONSTRAINT kpm_weekly_week_start_is_monday_check
    CHECK (EXTRACT(ISODOW FROM week_start) = 1),
  CONSTRAINT kpm_weekly_avg_position_range_check
    CHECK (avg_position IS NULL OR (avg_position >= 1 AND avg_position <= 1000)),
  CONSTRAINT kpm_weekly_impressions_check CHECK (total_impressions >= 0),
  CONSTRAINT kpm_weekly_clicks_check CHECK (total_clicks >= 0),
  CONSTRAINT kpm_weekly_clicks_le_impressions_check CHECK (total_clicks <= total_impressions),
  CONSTRAINT kpm_weekly_ctr_range_check CHECK (avg_ctr IS NULL OR (avg_ctr >= 0 AND avg_ctr <= 1))
);

-- No additional indexes: no Phase 1 query pattern reads this table other
-- than the retention job's own upsert, which uses the UNIQUE constraint
-- above. Revisit when a Phase 3 historical-trend UI reads it directly.

DROP TRIGGER IF EXISTS kpm_weekly_set_updated_at ON public.keyword_page_metrics_weekly;
CREATE TRIGGER kpm_weekly_set_updated_at
  BEFORE UPDATE ON public.keyword_page_metrics_weekly
  FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();

-- ----------------------------------------------------------------------------

-- GA4 data: one row per page × day.
CREATE TABLE IF NOT EXISTS public.page_metrics (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id              UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  page_id              UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  date                 DATE NOT NULL,
  sessions             INTEGER NOT NULL DEFAULT 0,
  engaged_sessions     INTEGER NOT NULL DEFAULT 0,
  -- Nullable: undefined for zero-session days (division by zero); GA4
  -- omits it rather than returning 0.
  bounce_rate          REAL,
  avg_engagement_time  REAL,
  conversions          INTEGER NOT NULL DEFAULT 0,
  conversion_value     REAL NOT NULL DEFAULT 0,
  conversion_breakdown JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT page_metrics_page_date_key UNIQUE (page_id, date),
  CONSTRAINT page_metrics_sessions_check CHECK (sessions >= 0),
  CONSTRAINT page_metrics_engaged_sessions_check CHECK (engaged_sessions >= 0),
  CONSTRAINT page_metrics_engaged_le_sessions_check CHECK (engaged_sessions <= sessions),
  CONSTRAINT page_metrics_bounce_rate_range_check
    CHECK (bounce_rate IS NULL OR (bounce_rate >= 0 AND bounce_rate <= 1)),
  CONSTRAINT page_metrics_engagement_time_check
    CHECK (avg_engagement_time IS NULL OR avg_engagement_time >= 0),
  CONSTRAINT page_metrics_conversions_check CHECK (conversions >= 0),
  CONSTRAINT page_metrics_conversion_value_check CHECK (conversion_value >= 0),
  CONSTRAINT page_metrics_conversion_breakdown_is_object_check
    CHECK (jsonb_typeof(conversion_breakdown) = 'object')
);

-- Supports: Page ROI Score's per-site metrics scan (§5.2).
CREATE INDEX IF NOT EXISTS idx_pm_site_date ON public.page_metrics(site_id, date);
-- Content Decay Score's per-page 90-day window (§5.7) is already served by
-- the UNIQUE(page_id, date) constraint's implicit index — no separate
-- index needed.

DROP TRIGGER IF EXISTS page_metrics_set_updated_at ON public.page_metrics;
CREATE TRIGGER page_metrics_set_updated_at
  BEFORE UPDATE ON public.page_metrics
  FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();

-- ----------------------------------------------------------------------------

-- Aggregated weekly view, populated by the retention job (Milestone 8).
-- Added during the architecture validation pass (CHANGELOG.md 2026-07-18)
-- for retention parity with keyword_page_metrics_weekly.
CREATE TABLE IF NOT EXISTS public.page_metrics_weekly (
  id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id                 UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  page_id                 UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  week_start              DATE NOT NULL,
  avg_sessions            REAL NOT NULL DEFAULT 0,
  avg_engaged_sessions    REAL NOT NULL DEFAULT 0,
  avg_bounce_rate         REAL,
  avg_engagement_time     REAL,
  total_conversions       INTEGER NOT NULL DEFAULT 0,
  total_conversion_value  REAL NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT page_metrics_weekly_page_week_key UNIQUE (page_id, week_start),
  CONSTRAINT page_metrics_weekly_week_start_is_monday_check
    CHECK (EXTRACT(ISODOW FROM week_start) = 1),
  CONSTRAINT page_metrics_weekly_avg_sessions_check CHECK (avg_sessions >= 0),
  CONSTRAINT page_metrics_weekly_avg_engaged_check CHECK (avg_engaged_sessions >= 0),
  CONSTRAINT page_metrics_weekly_engaged_le_sessions_check
    CHECK (avg_engaged_sessions <= avg_sessions),
  CONSTRAINT page_metrics_weekly_bounce_rate_range_check
    CHECK (avg_bounce_rate IS NULL OR (avg_bounce_rate >= 0 AND avg_bounce_rate <= 1)),
  CONSTRAINT page_metrics_weekly_engagement_time_check
    CHECK (avg_engagement_time IS NULL OR avg_engagement_time >= 0),
  CONSTRAINT page_metrics_weekly_conversions_check CHECK (total_conversions >= 0),
  CONSTRAINT page_metrics_weekly_conversion_value_check CHECK (total_conversion_value >= 0)
);

-- No additional indexes — same reasoning as keyword_page_metrics_weekly.

DROP TRIGGER IF EXISTS page_metrics_weekly_set_updated_at ON public.page_metrics_weekly;
CREATE TRIGGER page_metrics_weekly_set_updated_at
  BEFORE UPDATE ON public.page_metrics_weekly
  FOR EACH ROW EXECUTE FUNCTION public.seo_set_updated_at();

-- ============================================================================
-- PIPELINE OPERATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sync_log (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Sites are not expected to be deleted in normal operation (only in
  -- test/dev cleanup) — CASCADE keeps this simple rather than preserving
  -- orphaned audit rows via ON DELETE SET NULL.
  site_id           UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  -- Enum enforced at the DB level (stronger than ARCHITECTURE.md's
  -- comment-only list) — includes 'ping' (Milestone 4) and 'retention'
  -- (Milestone 8) alongside the original gsc/ga4/dataforseo/cms/crawler
  -- set, per the Milestone 0 deviation note.
  source            TEXT NOT NULL,
  -- Nullable: not every job calls a specific external endpoint (e.g. the
  -- 'ping' and 'retention' jobs have no external endpoint to name).
  endpoint          TEXT,
  status             TEXT NOT NULL,
  records_processed  INTEGER NOT NULL DEFAULT 0,
  api_credits_used   REAL NOT NULL DEFAULT 0,
  -- Nullable, but constrained below: required whenever status = 'failed' —
  -- a failure must always record why, never silently.
  error_message      TEXT,
  -- started_at doubles as this row's creation timestamp; a separate
  -- created_at would be redundant.
  started_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Nullable: NULL exactly while status = 'started' — this is the basis of
  -- the stale-run detection in Milestone 7 (a 'started' row far older than
  -- the job's expected duration signals a crash that never reached
  -- completeSyncRun()).
  completed_at        TIMESTAMPTZ,
  metadata             JSONB NOT NULL DEFAULT '{}',

  CONSTRAINT sync_log_source_check
    CHECK (source IN ('gsc', 'ga4', 'dataforseo', 'cms', 'crawler', 'ping', 'retention')),
  CONSTRAINT sync_log_status_check
    CHECK (status IN ('started', 'completed', 'failed', 'partial')),
  CONSTRAINT sync_log_records_processed_check CHECK (records_processed >= 0),
  CONSTRAINT sync_log_api_credits_used_check CHECK (api_credits_used >= 0),
  -- Enforces the sync-log write-path contract (Milestone 3): a run is
  -- 'started' with no completed_at, or in a terminal status with
  -- completed_at set — never a mix of the two.
  CONSTRAINT sync_log_status_completed_at_consistency_check
    CHECK (
      (status = 'started' AND completed_at IS NULL) OR
      (status <> 'started' AND completed_at IS NOT NULL)
    ),
  CONSTRAINT sync_log_completed_after_started_check
    CHECK (completed_at IS NULL OR completed_at >= started_at),
  CONSTRAINT sync_log_failed_has_error_message_check
    CHECK (status <> 'failed' OR error_message IS NOT NULL),
  CONSTRAINT sync_log_metadata_is_object_check
    CHECK (jsonb_typeof(metadata) = 'object')
);

-- Supports: "last run per source" (Milestone 7 sync_status_summary view)
-- and general sync-history browsing by source, most recent first.
CREATE INDEX IF NOT EXISTS idx_sync_site_source
  ON public.sync_log(site_id, source, started_at DESC);
-- A partial index for the failed-runs / stale-runs queries
-- (sync_failures_recent, Milestone 7) is deliberately deferred to Milestone
-- 7, when the actual view — and its exact query shape — is built, rather
-- than guessed at here.

-- No updated_at: completed_at already captures the only mutation this row
-- undergoes (transition from 'started' to a terminal status). A separate
-- updated_at would be redundant and could drift from completed_at if future
-- code ever updated another field without changing status.

-- ============================================================================
-- ROW LEVEL SECURITY — default-deny for anon/authenticated on all tables
-- above. No policies are created. Access is exclusively via the
-- service_role key (BYPASSRLS, set by Supabase automatically), used by
-- src/lib/supabase/server.ts. See Milestone 1 RLS Summary for verification.
-- ============================================================================

ALTER TABLE public.sites                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_configs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_clusters                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_keywords              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_page_metrics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_page_metrics_weekly   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_metrics                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_metrics_weekly           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log                      ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SEED DATA — one site for naijagrillandspice.co.uk, restaurant preset
-- (ARCHITECTURE.md Appendix B). ON CONFLICT DO NOTHING makes this safe to
-- re-run.
-- ============================================================================

INSERT INTO public.sites (name, domain, business_type)
VALUES ('NaijaGrill & Spice Kitchen', 'naijagrillandspice.co.uk', 'restaurant')
ON CONFLICT (domain) DO NOTHING;

INSERT INTO public.site_configs (site_id, conversion_events)
SELECT
  id,
  '[
    {"name": "whatsapp_click", "value": 15},
    {"name": "uber_eats_click", "value": 12},
    {"name": "phone_call", "value": 10},
    {"name": "reservation_submit", "value": 20},
    {"name": "directions_click", "value": 5}
  ]'::jsonb
FROM public.sites
WHERE domain = 'naijagrillandspice.co.uk'
ON CONFLICT (site_id) DO NOTHING;
