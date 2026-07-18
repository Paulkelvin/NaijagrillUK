# SEO Intelligence Platform — Architecture Document

> **Status:** Living document. Updated as decisions are made during development.
> **Last updated:** 2026-07-18
> **Owner:** Paul Kelvin

---

## 1. Vision

### Project Goals

Build an SEO Intelligence Platform that transforms raw data from Google Search Console, Google Analytics 4, DataForSEO, and a CMS into a single prioritised action queue. The platform answers one question every day:

**What should I do today to maximise long-term organic growth and business results?**

This is not an analytics dashboard. It is a decision engine.

### Design Philosophy

1. **Data-first, not module-first.** The data pipeline is the product. Analysis modules are views on top of clean, joined data.
2. **Decisions over charts.** Every analytical component produces ranked actions, not visualisations. Charts support decisions; they never replace them.
3. **First-party advantage.** The competitive edge comes from combining first-party data (GSC + GA4 + CMS) with third-party intelligence (DataForSEO). No external tool has access to your conversion data, your content structure, and your ranking data simultaneously.
4. **One engine, many configurations.** The intelligence engine is generic. Business-specific behaviour (scoring weights, conversion events, intent priorities) lives in configuration, not code.
5. **Build for one, design for many.** Phase 1 targets a single site. The schema and API support multi-site from day one.

### Success Metrics

- Time from "what should I do?" to "doing it" drops below 5 minutes
- Every action in the queue has an estimated impact and a measurable outcome
- 80%+ of completed actions show measurable improvement within 30 days
- Data pipeline runs daily without manual intervention
- DataForSEO spend stays under $10/month per site

---

## 2. System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     ACTION LAYER                         │
│                                                          │
│   Daily Action Queue  │  Keyword Explorer  │  Settings   │
│   Page Performance    │  Cluster Map       │  Reports    │
│   Cannibalization     │  Link Suggestions  │  Briefs     │
└──────────────────────────┬───────────────────────────────┘
                           │ reads
┌──────────────────────────┴───────────────────────────────┐
│                  INTELLIGENCE LAYER                      │
│                                                          │
│   Opportunity Score    │  ROI Score    │  CTR Model       │
│   Cannibal Score       │  Link Score   │  Decay Score     │
│   Authority Score      │  Intent Check │  Keyword Value   │
│                                                          │
│   ──────── writes to ────────►  ACTION QUEUE TABLE       │
└──────────────────────────┬───────────────────────────────┘
                           │ reads
┌──────────────────────────┴───────────────────────────────┐
│                   DATA PIPELINE LAYER                    │
│                                                          │
│   GSC Sync (daily)     │  Normalisation  │  Archival     │
│   GA4 Sync (daily)     │  Validation     │  Retention    │
│   DataForSEO (weekly)  │  Join Logic     │  Cost Control │
│   CMS Webhook          │  Deduplication  │  Sync Log     │
│                                                          │
│   ──────── writes to ────────►  POSTGRESQL / SUPABASE    │
└──────────────────────────────────────────────────────────┘
```

### Component Diagram

```
External Services              Application                    Database
─────────────────              ───────────                    ────────

Google Search Console ──┐
                        │      ┌──────────────────┐
Google Analytics 4 ─────┼─────►│  Data Pipeline   │
                        │      │  (Cron Jobs)     │──────────► PostgreSQL
DataForSEO API ─────────┤      └──────────────────┘           (Supabase)
                        │               │                        │
CMS (Sanity) ───────────┘               │                        │
                                        ▼                        │
                               ┌──────────────────┐              │
                               │  Intelligence    │◄─────────────┘
                               │  Engine          │
                               │  (Server-side)   │─────► Action Queue
                               └──────────────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │  Next.js Admin   │
                               │  /admin/seo/*    │
                               └──────────────────┘
```

### Data Flow

1. **Cron jobs** run at scheduled intervals, calling external APIs
2. **Raw data** is normalised, validated, and written to PostgreSQL
3. **Sync log** records every run (status, records processed, errors, API credits spent)
4. **Intelligence engine** runs after each sync, reading normalised data and computing scores
5. **Actions** are written to the queue with priority scores, effort estimates, and supporting data
6. **Admin UI** reads from the database using Server Components (no intermediate API for reads)
7. **User actions** (mark complete, skip, adjust weights) use Server Actions or API routes

### Layer Responsibilities

| Layer | Responsibility | Does NOT |
|-------|---------------|----------|
| Data Pipeline | Ingest, normalise, validate, store, archive, control costs | Interpret data or compute scores |
| Intelligence | Score, rank, detect patterns, generate recommendations | Fetch external data or manage storage |
| Action | Display decisions, accept user input, track outcomes | Compute scores or access external APIs |

### Technology Stack

| Component | Technology | Reasoning |
|-----------|-----------|-----------|
| Application framework | Next.js 15 (App Router) | Already in use. Server Components for data-heavy pages. |
| Database | Supabase (PostgreSQL) | Already in use. Handles time-series volumes for single-site. |
| Background jobs | Vercel Cron or external cron hitting API routes | Simple. No job queue infrastructure needed at this scale. |
| Authentication | Existing `/admin` HTTP Basic Auth | Already built. Sufficient for single-user admin. |
| External APIs | GSC API, GA4 Data API, DataForSEO REST API, Sanity GROQ | Direct HTTP calls. No SDK dependencies where avoidable. |
| Hosting | Existing deployment (Vercel or similar) | No new infrastructure. |

### Trade-offs

| Decision | Benefit | Cost |
|----------|---------|------|
| Build inside existing Next.js app | No new infrastructure, shared auth, faster to ship | Couples SEO platform to the website codebase |
| Supabase over dedicated time-series DB | Zero new infrastructure, familiar tooling | Less efficient for time-series queries at scale (irrelevant under 1M rows) |
| Cron over event-driven pipeline | Simpler, fewer failure modes | Data is only as fresh as the cron interval |
| Server Components over API layer | Less code, no serialisation overhead, type-safe | Can't expose data to external consumers |

---

## 3. Database Design

### Entity Relationship Diagram

```
sites ─────────┬─────────────────────────────────────────────┐
               │                                             │
               ├──► pages ◄────── page_metrics (GA4)         │
               │      │                                      │
               │      ├──── keyword_page_metrics ────┐       │
               │      │          (GSC daily)         │       │
               │      │                              ▼       │
               │      │                          keywords ◄──┤
               │      │                              │       │
               │      ├──── internal_links           │       │
               │      │     (source ──► target)      │       │
               │      │                              │       │
               │      └──── topic_clusters ◄── cluster_keywords
               │                                             │
               ├──► competitors                              │
               │                                             │
               ├──► serp_snapshots                           │
               │                                             │
               ├──► actions ──► action_outcomes               │
               │                                             │
               ├──► sync_log                                 │
               │                                             │
               └──► api_budgets                              │
```

### Complete Schema

```sql
-- ============================================================
-- CORE ENTITIES
-- ============================================================

CREATE TABLE sites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  domain      TEXT NOT NULL UNIQUE,
  -- restaurant | ecommerce | service | blog | beauty
  business_type TEXT NOT NULL DEFAULT 'restaurant',
  config      JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sites IS
  'Each site is an independent property being tracked. All other tables reference site_id.';

-- ────────────────────────────────────────────────────────────

CREATE TABLE site_configs (
  site_id UUID PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,

  -- Scoring weights (JSONB for flexibility across modules)
  scoring_weights JSONB NOT NULL DEFAULT '{
    "opportunity": {
      "volume": 0.20,
      "position": 0.35,
      "difficulty": 0.15,
      "intent": 0.15,
      "business_value": 0.15
    },
    "page_roi": {
      "traffic_potential": 0.35,
      "conversion_rate": 0.30,
      "effort_inverse": 0.20,
      "decay_urgency": 0.15
    },
    "cannibalization": {
      "position_variance": 0.25,
      "click_split": 0.30,
      "ctr_deficit": 0.25,
      "traffic_at_risk": 0.20
    },
    "internal_link": {
      "target_potential": 0.30,
      "source_authority": 0.25,
      "topical_relevance": 0.25,
      "link_deficit": 0.20
    }
  }',

  -- Conversion events specific to this business
  -- Example: [{"name": "whatsapp_click", "value": 15}, {"name": "uber_eats_click", "value": 12}]
  conversion_events JSONB NOT NULL DEFAULT '[]',

  -- Data refresh schedules
  refresh_schedules JSONB NOT NULL DEFAULT '{
    "gsc": "daily",
    "ga4": "daily",
    "dataforseo_volume": "monthly",
    "dataforseo_serp": "weekly"
  }',

  -- CTR model (populated after sufficient data collected)
  -- {positions: {1: 0.28, 2: 0.15, ...}, source: "site_data" | "industry_default", sample_size: 1200}
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

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN site_configs.scoring_weights IS
  'Configurable weights per scoring module. Allows tuning per business type without code changes.';

-- ============================================================
-- CONTENT ENTITIES
-- ============================================================

CREATE TABLE topic_clusters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  pillar_page_id UUID,  -- set after pages table exists; FK added below
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────

CREATE TABLE pages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  path            TEXT NOT NULL,              -- /menu, /blog/jollof-rice
  title           TEXT,
  meta_description TEXT,
  word_count      INTEGER,
  -- blog_post | landing_page | product_page | category_page | service_page
  content_type    TEXT,
  topic_cluster_id UUID REFERENCES topic_clusters(id) ON DELETE SET NULL,
  h1              TEXT,
  schema_types    TEXT[],                     -- ['LocalBusiness', 'FAQ', 'Article']
  first_seen      DATE NOT NULL DEFAULT CURRENT_DATE,
  last_crawled    TIMESTAMPTZ,
  cms_published_at TIMESTAMPTZ,
  cms_updated_at  TIMESTAMPTZ,
  is_indexed      BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(site_id, path)
);

ALTER TABLE topic_clusters
  ADD CONSTRAINT fk_pillar_page
  FOREIGN KEY (pillar_page_id) REFERENCES pages(id) ON DELETE SET NULL;

CREATE INDEX idx_pages_site_cluster ON pages(site_id, topic_cluster_id);

-- ============================================================
-- KEYWORD ENTITIES
-- ============================================================

CREATE TABLE keywords (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  keyword             TEXT NOT NULL,           -- original form
  keyword_normalized  TEXT NOT NULL,           -- lowercase, trimmed, prepositions stripped
  search_volume       INTEGER,
  keyword_difficulty  REAL,
  cpc                 REAL,
  -- informational | navigational | commercial | transactional
  search_intent       TEXT,
  is_target           BOOLEAN DEFAULT false,   -- explicitly targeted vs discovered via GSC
  -- {"1": 120, "2": 140, ...} keyed by month number, for seasonality
  monthly_volumes     JSONB,
  data_source         TEXT,                    -- gsc | dataforseo | manual
  last_volume_refresh TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(site_id, keyword_normalized)
);

CREATE INDEX idx_keywords_site_target ON keywords(site_id, is_target);

-- ────────────────────────────────────────────────────────────

CREATE TABLE cluster_keywords (
  cluster_id  UUID NOT NULL REFERENCES topic_clusters(id) ON DELETE CASCADE,
  keyword_id  UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  is_primary  BOOLEAN DEFAULT false,
  PRIMARY KEY (cluster_id, keyword_id)
);

-- ============================================================
-- TIME-SERIES METRICS
-- ============================================================

-- GSC data: one row per keyword × page × day
CREATE TABLE keyword_page_metrics (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  keyword_id  UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  position    REAL,              -- average position from GSC
  impressions INTEGER DEFAULT 0,
  clicks      INTEGER DEFAULT 0,
  ctr         REAL,

  UNIQUE(keyword_id, page_id, date)
);

CREATE INDEX idx_kpm_site_date ON keyword_page_metrics(site_id, date);
CREATE INDEX idx_kpm_page_date ON keyword_page_metrics(page_id, date);
CREATE INDEX idx_kpm_keyword_date ON keyword_page_metrics(keyword_id, date);

COMMENT ON TABLE keyword_page_metrics IS
  'Core analytical table. Every insight (cannibalization, decay, opportunity) queries this.
   ~500 rows/day for a small site. Daily granularity kept for 6 months;
   weekly aggregates kept indefinitely (see retention policy).';

-- ────────────────────────────────────────────────────────────

-- Aggregated weekly view (populated by retention job)
CREATE TABLE keyword_page_metrics_weekly (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  keyword_id  UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  page_id     UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,      -- Monday of the week
  avg_position REAL,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  avg_ctr     REAL,

  UNIQUE(keyword_id, page_id, week_start)
);

-- ────────────────────────────────────────────────────────────

-- GA4 data: one row per page × day
CREATE TABLE page_metrics (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id               UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_id               UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  date                  DATE NOT NULL,
  sessions              INTEGER DEFAULT 0,
  engaged_sessions      INTEGER DEFAULT 0,
  bounce_rate           REAL,
  avg_engagement_time   REAL,       -- seconds
  conversions           INTEGER DEFAULT 0,
  conversion_value      REAL DEFAULT 0,
  -- Breakdown by conversion event: {"whatsapp_click": 3, "uber_eats_click": 1}
  conversion_breakdown  JSONB DEFAULT '{}',

  UNIQUE(page_id, date)
);

CREATE INDEX idx_pm_site_date ON page_metrics(site_id, date);

-- ============================================================
-- COMPETITIVE INTELLIGENCE
-- ============================================================

CREATE TABLE competitors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  domain            TEXT NOT NULL,
  name              TEXT,
  domain_authority  REAL,
  total_backlinks   INTEGER,
  referring_domains INTEGER,
  last_refreshed    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(site_id, domain)
);

-- ────────────────────────────────────────────────────────────

-- Who ranks where for our target keywords
CREATE TABLE serp_snapshots (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id       UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  keyword_id    UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  position      SMALLINT NOT NULL,
  url           TEXT NOT NULL,
  domain        TEXT NOT NULL,
  is_own_site   BOOLEAN DEFAULT false,
  -- organic | featured_snippet | paa | local_pack | video | image
  serp_feature  TEXT DEFAULT 'organic',
  title         TEXT
);

CREATE INDEX idx_serp_site_kw_date ON serp_snapshots(site_id, keyword_id, date);
CREATE INDEX idx_serp_domain ON serp_snapshots(domain);

-- ============================================================
-- INTERNAL LINKING
-- ============================================================

CREATE TABLE internal_links (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  source_page_id  UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  target_page_id  UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  anchor_text     TEXT,
  discovered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(source_page_id, target_page_id, anchor_text)
);

CREATE INDEX idx_links_target ON internal_links(target_page_id);

-- ============================================================
-- ACTION QUEUE
-- ============================================================

CREATE TABLE actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  -- create_content | update_content | add_internal_link |
  -- fix_cannibalization | fix_technical | update_meta | add_schema
  type            TEXT NOT NULL,
  priority_score  REAL NOT NULL,
  -- queued | in_progress | completed | skipped | dismissed
  status          TEXT NOT NULL DEFAULT 'queued',
  title           TEXT NOT NULL,
  description     TEXT,
  -- keyword_intelligence | page_performance | cannibalization |
  -- internal_linking | competitor | content_brief | decay
  source_module   TEXT NOT NULL,
  supporting_data JSONB DEFAULT '{}',
  effort          TEXT,              -- small | medium | large
  estimated_impact TEXT,
  page_id         UUID REFERENCES pages(id) ON DELETE SET NULL,
  keyword_id      UUID REFERENCES keywords(id) ON DELETE SET NULL,
  completed_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,       -- auto-dismiss stale actions
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_actions_site_status ON actions(site_id, status, priority_score DESC);

-- ────────────────────────────────────────────────────────────

-- Impact tracking: before/after metrics for completed actions
CREATE TABLE action_outcomes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id               UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  -- position | clicks | impressions | sessions | conversions | ctr
  metric_name             TEXT NOT NULL,
  value_before            REAL,
  value_after             REAL,
  measured_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  measurement_window_days INTEGER DEFAULT 30
);

-- ============================================================
-- PIPELINE OPERATIONS
-- ============================================================

CREATE TABLE sync_log (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id           UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  source            TEXT NOT NULL,   -- gsc | ga4 | dataforseo | cms | crawler
  endpoint          TEXT,            -- specific API endpoint or operation
  status            TEXT NOT NULL,   -- started | completed | failed | partial
  records_processed INTEGER DEFAULT 0,
  api_credits_used  REAL DEFAULT 0,
  error_message     TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  metadata          JSONB DEFAULT '{}'
);

CREATE INDEX idx_sync_site_source ON sync_log(site_id, source, started_at DESC);

-- ────────────────────────────────────────────────────────────

CREATE TABLE api_budgets (
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,    -- dataforseo | gsc | ga4
  monthly_limit   REAL NOT NULL,
  current_spend   REAL DEFAULT 0,
  alert_threshold REAL DEFAULT 0.8, -- alert at 80% of limit
  period_start    DATE NOT NULL,    -- first of the month

  PRIMARY KEY (site_id, provider, period_start)
);
```

### Retention Policy

| Table | Daily granularity | Weekly aggregates | Monthly aggregates |
|-------|------------------|-------------------|-------------------|
| keyword_page_metrics | 6 months | Indefinite (in `_weekly` table) | — |
| page_metrics | 6 months | Indefinite (aggregate on read) | — |
| serp_snapshots | — | Kept as-is (weekly snapshots) | — |
| sync_log | 3 months | — | — |
| actions (completed) | 12 months | — | — |

**Retention job** runs weekly:
1. Aggregate daily rows older than 6 months into `keyword_page_metrics_weekly`
2. Delete the aggregated daily rows
3. Delete sync_log entries older than 3 months
4. Delete completed/dismissed actions older than 12 months

### Keyword Normalisation Rules

Applied before insertion and before lookups:

1. Lowercase
2. Trim whitespace
3. Collapse multiple spaces to single space
4. Strip leading/trailing articles ("a", "an", "the")
5. Do NOT stem words (destroys meaning for multi-word queries)
6. Do NOT strip prepositions (they change meaning: "food in Birmingham" ≠ "food Birmingham")
7. Store original form in `keyword` column, normalised in `keyword_normalized`

**Rationale:** Aggressive normalisation (stemming, stripping prepositions) merges keywords that have different search intent. Conservative normalisation preserves meaning at the cost of occasional near-duplicates, which are easier to merge manually than to un-merge algorithmically.

### URL Normalisation Rules

Applied to every URL before storage:

1. Lowercase the path
2. Remove trailing slash (except for root "/")
3. Remove query parameters (except defined tracking exceptions)
4. Remove fragment identifiers (#)
5. Remove `www.` prefix from domain
6. Store normalised path in `pages.path`, full URL in `pages.url`

---

## 4. Data Pipeline

### Pipeline Architecture

Each data source has an independent sync job. Jobs are idempotent — running the same job twice for the same date produces the same result without duplicates.

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Cron        │────►│  API Route   │────►│  Sync        │
│  Trigger     │     │  /api/seo/   │     │  Function    │
│  (daily/     │     │  sync/{src}  │     │              │
│   weekly)    │     └──────────────┘     └──────┬───────┘
└─────────────┘                                  │
                                                 ▼
                                    ┌────────────────────────┐
                                    │  1. Check budget       │
                                    │  2. Fetch from API     │
                                    │  3. Normalise          │
                                    │  4. Validate           │
                                    │  5. Upsert to DB       │
                                    │  6. Log to sync_log    │
                                    │  7. Trigger analysis   │
                                    └────────────────────────┘
```

### 4.1 Google Search Console

**API:** Search Analytics API v1 (`searchanalytics/query`)

**Schedule:** Daily at 06:00 UTC (data is 2-3 days delayed, so we pull for `today - 3`)

**Request:**
```json
{
  "startDate": "2026-07-15",
  "endDate": "2026-07-15",
  "dimensions": ["query", "page"],
  "rowLimit": 25000,
  "startRow": 0
}
```

**Pagination:** If response returns 25,000 rows, increment `startRow` by 25,000 and fetch again. Repeat until fewer than 25,000 rows are returned.

**Processing per row:**
1. Normalise query → look up or create `keywords` row
2. Normalise page URL → look up or create `pages` row
3. Upsert into `keyword_page_metrics` (unique on keyword_id + page_id + date)

**Rate limits:** 1,200 requests per 100 seconds per project. For a small site (<1,000 keywords), this is never hit — typically 1-2 paginated requests per day.

**Retry strategy:** 3 retries with exponential backoff (2s, 4s, 8s). On 403, re-authenticate. On 5xx, retry. On 429, respect `Retry-After` header.

**Validation:**
- Reject rows where `position` < 1 or > 1000
- Reject rows where `clicks` > `impressions`
- Log rejected rows to sync_log metadata

**Critical note:** GSC retains only 16 months of data. Data not archived is lost permanently. The daily sync job is the ONLY way to build long-term historical baselines. Start collecting on day one.

**Authentication:** OAuth 2.0 service account. Credentials stored as environment variables (`GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY`, `GSC_PROPERTY_URL`).

### 4.2 Google Analytics 4

**API:** GA4 Data API v1 (`runReport`)

**Schedule:** Daily at 06:30 UTC (runs after GSC sync)

**Request:**
```json
{
  "dateRanges": [{"startDate": "2026-07-15", "endDate": "2026-07-15"}],
  "dimensions": [{"name": "pagePath"}],
  "metrics": [
    {"name": "sessions"},
    {"name": "engagedSessions"},
    {"name": "bounceRate"},
    {"name": "averageSessionDuration"},
    {"name": "conversions"},
    {"name": "purchaseRevenue"}
  ]
}
```

**For conversion breakdown** (if custom events are configured):
Run a second report with `eventName` as an additional dimension, filtered to configured conversion events.

**Processing per row:**
1. Normalise pagePath → match to `pages` row (create if new)
2. Upsert into `page_metrics` (unique on page_id + date)

**Rate limits:** 10,000 requests per day per project. A single-site daily sync uses 1-2 requests.

**Retry strategy:** Same as GSC (3 retries, exponential backoff).

**Validation:**
- Reject rows where pagePath is empty or matches excluded patterns (/studio, /api/)
- Log pages that appear in GA4 but not in the `pages` table (potential crawler miss)

**Authentication:** OAuth 2.0 service account. Credentials: `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY`, `GA4_PROPERTY_ID`.

### 4.3 DataForSEO

**API:** DataForSEO REST API v3

**Schedule:** Varies by endpoint (see DataForSEO Strategy section below)

**Budget enforcement:** Before every API call:
1. Read `api_budgets` for the current month
2. If `current_spend >= monthly_limit`, skip the call and log a warning
3. After each call, update `current_spend` with the credits consumed
4. If `current_spend >= monthly_limit × alert_threshold`, log an alert

**Authentication:** HTTP Basic Auth. Credentials: `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`.

**Retry strategy:** 3 retries with exponential backoff. DataForSEO returns task errors inline (not HTTP status codes), so check `tasks[].status_code` in responses.

### 4.4 CMS (Sanity)

**Trigger:** Webhook on document publish/update (configured in Sanity)

**Webhook endpoint:** `POST /api/seo/webhook/cms`

**Processing:**
1. Validate webhook signature
2. For page-type documents (menu, blog posts, landing pages):
   - Update `pages` row: title, word_count, cms_published_at, cms_updated_at
   - Extract internal links from body content → update `internal_links` table
3. Log to sync_log

**Fallback:** Weekly full crawl of the sitemap to catch missed webhooks. Fetch `/sitemap.xml`, parse all URLs, update `pages` table, crawl each page for internal links.

### 4.5 Site Crawler (Internal Links)

**Purpose:** Build the internal link graph by crawling your own site.

**Schedule:** Weekly (Sunday night). Also triggered after CMS webhook.

**Method:** Fetch each page in the `pages` table. Parse HTML for `<a>` tags pointing to internal URLs. Upsert into `internal_links`.

**Implementation:** Simple HTTP fetch + HTML parsing (use `cheerio` or `linkedom`). Not a full Googlebot simulation — just find `<a href>` elements in the rendered HTML.

**Rate limiting:** Self-throttle to 2 requests/second to avoid hammering your own server.

### Deduplication Strategy

All upserts use PostgreSQL `ON CONFLICT ... DO UPDATE` with the unique constraints defined in the schema. This makes every sync job idempotent:

- `keyword_page_metrics`: unique on (keyword_id, page_id, date)
- `page_metrics`: unique on (page_id, date)
- `keywords`: unique on (site_id, keyword_normalized)
- `pages`: unique on (site_id, path)

Running the same sync twice for the same date overwrites with the latest values. No duplicates.

---

## 5. Intelligence Engine

Every algorithm below reads from the normalised database and writes scored results. The algorithms run after each data sync and can also be triggered manually.

### 5.1 Opportunity Score

**Purpose:** Rank keywords by how valuable they are to pursue.

**Inputs:**
- `keywords.search_volume`
- `keywords.keyword_difficulty`
- `keywords.cpc`
- `keywords.search_intent`
- Best position from `keyword_page_metrics` (most recent 7 days)

**Formula:**

```
position_potential(pos):
  pos ≤ 3    → 0.20   (already strong, low marginal gain)
  pos 4-10   → 0.60   (page 1 but not top 3)
  pos 11-20  → 1.00   (striking distance — highest ROI)
  pos 21-50  → 0.40   (realistic with effort)
  pos > 50   → 0.10   (long shot)
  no ranking → 0.30   (new opportunity, unknown effort)

difficulty_score = 1 - (keyword_difficulty / 100)

intent_value:
  transactional  → 1.0
  commercial     → 0.8
  informational  → 0.4
  navigational   → 0.2
  null/unknown   → 0.5

volume_norm = min(search_volume / max_volume_in_site_keywords, 1.0)

business_value = min(cpc / max_cpc_in_site_keywords, 1.0)

opportunity_score = (
    volume_norm      × W.volume
  + position_potential × W.position
  + difficulty_score  × W.difficulty
  + intent_value      × W.intent
  + business_value    × W.business
) × 100
```

**Default weights by business type:**

| Weight | Restaurant | Ecommerce | Service | Blog |
|--------|-----------|-----------|---------|------|
| volume | 0.20 | 0.25 | 0.20 | 0.30 |
| position | 0.35 | 0.25 | 0.30 | 0.25 |
| difficulty | 0.15 | 0.20 | 0.15 | 0.20 |
| intent | 0.15 | 0.20 | 0.20 | 0.10 |
| business_value | 0.15 | 0.10 | 0.15 | 0.15 |

**Assumptions:**
- CPC is a reliable proxy for commercial value
- Position potential is the strongest single signal for achievable gains
- Restaurants weight position higher because local keywords have inherently lower volumes

**Limitations:**
- Does not account for SERP features (a keyword where Google shows a local pack has different click distribution than organic-only)
- Cannot detect keyword intent without SERP snapshot data. Before DataForSEO integration, intent must be set manually or left as null

**Output:** `opportunity_score` (0–100) stored as a computed view or materialised in a keywords summary table. Action queue receives top keywords not yet targeted.

### 5.2 Page ROI Score

**Purpose:** Rank existing pages by improvement return on investment.

**Inputs:**
- All keywords the page ranks for (from `keyword_page_metrics`, last 30 days)
- Page conversion data (from `page_metrics`, last 30 days)
- Site-specific CTR model (from `site_configs.ctr_model`)
- Page metadata (word count, last updated, schema types)

**Formula:**

```
For each keyword K that page P ranks for:
  current_clicks_K = avg daily clicks × 30
  target_position_K = max(1, current_position - 3)
  projected_ctr_K = ctr_model[target_position_K]
  projected_clicks_K = search_volume × projected_ctr_K
  click_gain_K = max(0, projected_clicks_K - current_clicks_K)

traffic_potential = Σ click_gain_K  (summed across all keywords)

page_conversion_rate = conversions / sessions  (from page_metrics, 30-day avg)
  fallback: site-wide average if page has < 50 sessions

avg_conversion_value = from site_configs.conversion_events
  fallback: use CPC-weighted average across page keywords

revenue_potential = traffic_potential × page_conversion_rate × avg_conversion_value

effort_score = (
    word_count_gap    × 0.25    // (avg competitor word count - your word count) / avg
  + content_age       × 0.15    // days since last update / 365, capped at 1.0
  + missing_paa       × 0.25    // unanswered PAA questions / total PAA (from SERP data)
  + link_deficit      × 0.15    // (avg internal links to top 5 pages - links to this page) / avg
  + schema_gap        × 0.10    // missing schema types relevant to this page type
  + meta_quality      × 0.10    // missing/short meta description or title
)
  Range: 0.0 (no effort needed) to 1.0 (maximum effort)

roi_score = revenue_potential / max(effort_score, 0.05)
```

**Assumptions:**
- Moving up 3 positions is a reasonable target for a content update
- Pages with more keywords benefit more from improvement (the sum amplifies)
- Effort can be estimated from measurable content gaps

**Limitations:**
- `missing_paa` requires SERP snapshot data. Before DataForSEO integration, this component is 0 (skip it)
- `word_count_gap` requires competitor page analysis. Before content brief data, use a default target word count per content_type (blog: 1500, landing: 800, product: 500)
- Conversion rate is unreliable for pages with fewer than 50 sessions/month. The site-wide fallback prevents this from distorting results

**Output:** `roi_score` per page. Action queue receives top pages sorted by ROI.

### 5.3 Cannibalization Score

**Purpose:** Detect keywords where multiple pages compete against each other.

**Inputs:**
- `keyword_page_metrics` for the last 30 days
- Only keywords with 2+ pages receiving impressions

**Detection query:**

```sql
SELECT keyword_id, count(DISTINCT page_id) as page_count
FROM keyword_page_metrics
WHERE date >= current_date - 30
  AND impressions > 0
GROUP BY keyword_id
HAVING count(DISTINCT page_id) >= 2
```

**Scoring per cannibalised keyword:**

```
pages[] = all pages ranking for this keyword in last 30 days

position_variance = stddev(all daily positions across all pages, last 30 days)
  normalised: min(position_variance / 10, 1.0)

click_split = 1 - (max_page_clicks / total_clicks_across_pages)
  0 = one page gets all clicks (no issue)
  approaching 1 = clicks evenly split (severe)

expected_ctr = ctr_model[best_avg_position_across_pages]
actual_ctr = total_clicks / total_impressions
ctr_deficit = max(0, expected_ctr - actual_ctr)
  normalised: min(ctr_deficit / expected_ctr, 1.0)

traffic_value = total_clicks × (keyword.cpc or 1.0)
  normalised: min(traffic_value / max_traffic_value_in_set, 1.0)

cannibal_score = (
    position_variance_norm × W.position_variance
  + click_split            × W.click_split
  + ctr_deficit_norm       × W.ctr_deficit
  + traffic_value_norm     × W.traffic_at_risk
) × 100
```

**Action generation:**
For each cannibalised keyword with score > 40:
- If one page has significantly more traffic: recommend making it the canonical, redirect or de-optimise the other
- If both pages are similar: recommend merging content
- If pages serve different intents: recommend differentiating (change target keyword on one page)

**Limitations:**
- 30 days may be too short to detect intermittent cannibalization. Consider 90-day lookback for detection, 30-day for scoring
- Navigational keywords (brand name) often rank with multiple pages legitimately. Exclude keywords matching the site's brand name

### 5.4 Site-Specific CTR Model

**Purpose:** Replace industry-average CTR curves with your actual click-through rates.

**Inputs:** All `keyword_page_metrics` rows from the last 90 days.

**Method:**

```
For each position bucket (1, 2, 3, ..., 20):
  ctr_at_position = sum(clicks at position) / sum(impressions at position)

  Only include positions with ≥ 50 impressions in the bucket
  (sparse positions fall back to industry defaults)

Minimum data requirement:
  At least 1,000 total clicks across all positions to generate a site-specific model.
  Below that threshold, use industry defaults entirely.
```

**Industry defaults (used as fallback):**

| Position | CTR |
|----------|-----|
| 1 | 0.280 |
| 2 | 0.150 |
| 3 | 0.110 |
| 4 | 0.080 |
| 5 | 0.060 |
| 6 | 0.045 |
| 7 | 0.040 |
| 8 | 0.035 |
| 9 | 0.030 |
| 10 | 0.025 |
| 11-20 | Linear decay from 0.015 to 0.004 |

**Storage:** Written to `site_configs.ctr_model` after each rebuild. Includes `source` ("site_data" or "industry_default") and `sample_size`.

**Refresh:** Rebuilt weekly after GSC sync.

### 5.5 Conversion-Weighted Keyword Value

**Purpose:** Calculate the monthly revenue value of ranking for each keyword.

**Formula:**

```
keyword_monthly_value = search_volume × expected_ctr × conversion_rate × avg_conversion_value

Where:
  expected_ctr = ctr_model[current_position]  (or target_position for projections)
  conversion_rate = page-level conversion rate from page_metrics
    fallback: site-wide average
  avg_conversion_value = from site_configs.conversion_events
    fallback: keyword CPC as proxy
```

**This metric is impossible for any third-party tool to calculate.** It requires joining GSC keyword data with GA4 conversion data with business-configured conversion values. This is the platform's core competitive advantage.

**Output:** `keyword_monthly_value` stored on a keyword summary view. Used by the Opportunity Score as a potential replacement for `business_value` once conversion data is sufficient.

### 5.6 Topical Authority Score

**Purpose:** Measure how completely you cover each topic cluster.

**Formula:**

```
For each topic_cluster:

  total_keywords = count of keywords in cluster_keywords
  covered_keywords = count where keyword has a page ranking in top 50
  coverage = covered_keywords / total_keywords

  avg_position = mean(best_position for each covered keyword)
  position_score = max(0, (20 - avg_position) / 20)
    0 at position 20+, 1.0 at position 1

  cluster_pages = distinct pages ranking for cluster keywords
  possible_links = cluster_pages × (cluster_pages - 1)  // directed graph
  actual_links = count from internal_links between cluster pages
  link_density = actual_links / max(possible_links, 1)

  freshest_update = max(cms_updated_at) across cluster pages
  stalest_page = min(cms_updated_at) across cluster pages
  freshness = 1 - (days_since(stalest_page) / 365)  // capped at 0

  authority = (
      coverage       × 0.40
    + position_score  × 0.30
    + link_density    × 0.15
    + freshness       × 0.15
  ) × 100
```

**Action generation:**
- Clusters below 50% coverage: recommend creating content for uncovered keywords
- Clusters with low link_density: recommend adding internal links between cluster pages
- Clusters with low freshness: recommend updating the stalest page

### 5.7 Content Decay Score

**Purpose:** Detect pages losing organic traffic before the drop becomes critical.

**Inputs:** `page_metrics.sessions` (organic) over a 90-day window. Requires at least 60 days of data.

**Formula:**

```
For each page with ≥ 30 avg sessions/month:

  daily_sessions[] = sessions from page_metrics, last 90 days
  trend_slope = linear regression slope over the window
    (negative = declining)

  peak_traffic = max(30-day rolling average in available history)
  current_traffic = most recent 30-day average

  decay_pct = max(0, (peak_traffic - current_traffic) / peak_traffic × 100)

  Decay stage:
    decay_pct < 5      → stable (no action)
    decay_pct 5-15     → early_decay (alert, easy to recover)
    decay_pct 15-40    → mid_decay (update needed)
    decay_pct > 40     → critical_decay (rewrite or consolidate)

  recency = how recently the decline started
    (recent declines are more actionable — the page hasn't yet lost its ranking signals)

  decay_urgency = decay_pct × current_traffic × recency_factor
```

**Filtering:** Only flag pages with meaningful traffic (≥30 sessions/month average). Decaying pages with 5 sessions/month aren't worth the effort.

**Limitations:**
- Seasonal traffic looks like decay if the window doesn't cover a full year. Cross-reference with `keywords.monthly_volumes` to detect seasonality. If a page's primary keyword has seasonal patterns matching the traffic drop, flag it as "seasonal, not decaying."
- 90 days of data needed. This analysis is unavailable until the pipeline has run for 3 months.

### 5.8 Internal Linking Score

**Purpose:** Prioritise which internal links to add.

**Inputs:**
- `internal_links` (current link graph)
- `pages` with their topic_cluster_id
- Page-level metrics (traffic, keyword potential)

**For each potential link (source_page → target_page) where no link currently exists:**

```
target_keyword_potential = sum of opportunity_scores for target page's keywords
  normalised: target_potential / max_potential_in_site

source_page_authority = sessions + (internal_links_pointing_to_source × 10)
  normalised: source_authority / max_authority_in_site

topical_relevance:
  same cluster → 1.0
  related clusters (share keywords) → 0.5
  unrelated → 0.1

current_inlinks = count of internal links pointing to target
avg_inlinks = average internal links per page across site
link_deficit = max(0, (avg_inlinks - current_inlinks) / avg_inlinks)

link_score = (
    target_keyword_potential × W.target_potential
  + source_page_authority    × W.source_authority
  + topical_relevance        × W.topical_relevance
  + link_deficit             × W.link_deficit
) × 100
```

**Action generation:** Top 10 link suggestions per analysis run, grouped by source page (so you can update one page and add multiple links at once).

**Limitation:** Generating all possible page pairs is O(n²). For a site with 50 pages, that's 2,450 pairs — manageable. For 500 pages, that's 249,500. Filter: only consider pairs within the same or related topic clusters.

### 5.9 Intent Alignment Check

**Purpose:** Detect pages targeting keywords with mismatched search intent.

**Inputs:**
- `pages.content_type` (blog_post, landing_page, product_page, etc.)
- `keywords.search_intent` (informational, commercial, transactional, navigational)
- `keyword_page_metrics` (which keywords each page ranks for)

**Alignment matrix:**

| Content type | informational | commercial | transactional | navigational |
|-------------|--------------|------------|---------------|-------------|
| blog_post | aligned | partial | misaligned | misaligned |
| landing_page | misaligned | aligned | aligned | partial |
| product_page | misaligned | partial | aligned | partial |
| category_page | partial | aligned | partial | misaligned |
| service_page | partial | aligned | aligned | partial |

**Detection:**
For each page, check its top 5 keywords (by impressions). If the majority are misaligned, flag with recommendation:
- Informational keyword on a product page → create a blog post targeting that keyword instead, link to the product page
- Transactional keyword on a blog post → create or optimise a landing/product page for that keyword

**Limitation:** Requires `search_intent` on keywords, which comes from manual tagging or DataForSEO SERP analysis. Until then, this check is skipped.

---

## 6. DataForSEO Strategy

### Endpoint Selection

| Endpoint | Purpose | Cost | Frequency | Monthly cost (200 keywords) |
|----------|---------|------|-----------|----------------------------|
| Keywords Data > Google > Search Volume | Volume, CPC, difficulty, monthly trends | $0.05 / 1,000 keywords | Monthly | ~$0.01 |
| SERP > Regular | Top 10 results, SERP features, PAA | $0.035 / SERP | Weekly (top 100 keywords) | ~$1.40 |
| Keywords Data > Google > Related Keywords | Keyword discovery | $0.05 / seed keyword | On-demand (content planning) | ~$0.50 |
| On-Page > Content Analysis | Competitor page analysis for briefs | $0.04 / page | On-demand (per content brief) | ~$2.00 |
| Backlinks > Summary | Domain authority, backlink counts | $0.04 / domain | Monthly (own + 5 competitors) | ~$0.24 |

**Estimated monthly total: $4-5 per site.**

### Endpoints NOT Used (and why)

| Endpoint | Why skipped |
|----------|-------------|
| Rank Tracker | Redundant with GSC for own rankings. SERP API covers competitor positions. |
| Backlinks > Full crawl | Expensive, and backlink-by-backlink data has low ROI for a local business. |
| Content Analysis API | Overlaps with On-Page API + own content analysis. |
| Domain Analytics > Competitors | Can be derived from SERP overlap data already collected. |

### Caching Strategy

- **Search volume data:** Cache for 30 days. Volume doesn't change faster than monthly.
- **SERP snapshots:** Cache for 7 days. Weekly snapshots are sufficient for trend detection.
- **Backlink summaries:** Cache for 30 days. Domain authority doesn't shift daily.
- **Related keywords:** Cache indefinitely until manually refreshed. Keyword suggestions for a given seed rarely change.

### Budget Controls

1. `api_budgets` table tracks spend per provider per month
2. Before every API call, check if `current_spend < monthly_limit`
3. If `current_spend >= monthly_limit × alert_threshold`, log a warning
4. If `current_spend >= monthly_limit`, skip the call, log to `sync_log` with status "budget_exceeded"
5. Default monthly limit: $10 per site

---

## 7. API Design

### Design Principle

The admin UI uses **Next.js Server Components** for all read operations — they query the database directly, no intermediate API layer. API routes exist only for:

1. **Cron-triggered sync jobs** (need external-accessible endpoints)
2. **Webhooks** (CMS publish events)
3. **Client-side mutations** (updating action status, saving configuration)

This eliminates an entire layer of serialisation, caching, and API versioning. The database schema IS the API for reads.

### API Routes

```
POST /api/seo/sync/gsc          Trigger GSC sync (called by cron)
POST /api/seo/sync/ga4          Trigger GA4 sync (called by cron)
POST /api/seo/sync/dataforseo   Trigger DataForSEO sync (called by cron)
POST /api/seo/sync/crawl        Trigger site crawl for internal links

POST /api/seo/webhook/cms       CMS publish webhook receiver

POST /api/seo/actions/:id       Update action (status, notes)
POST /api/seo/clusters          Create topic cluster
PUT  /api/seo/clusters/:id      Update cluster (add/remove keywords)
PUT  /api/seo/settings           Update site configuration

POST /api/seo/analysis/run      Trigger full analysis re-run
POST /api/seo/briefs/generate   Generate content brief for a keyword
```

### Authentication

All `/api/seo/*` routes check the same HTTP Basic Auth used by the existing `/admin` route. Cron-triggered routes additionally check a `CRON_SECRET` header to prevent unauthorised triggering.

```typescript
// Cron auth check
const cronSecret = request.headers.get('x-cron-secret');
if (cronSecret !== process.env.CRON_SECRET) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Background Jobs

| Job | Trigger | Frequency | Timeout |
|-----|---------|-----------|---------|
| GSC sync | Cron | Daily 06:00 UTC | 5 min |
| GA4 sync | Cron | Daily 06:30 UTC | 3 min |
| DataForSEO volume refresh | Cron | 1st of month | 2 min |
| DataForSEO SERP snapshots | Cron | Weekly Monday 07:00 UTC | 10 min |
| Site crawl (internal links) | Cron + CMS webhook | Weekly + on publish | 5 min |
| Analysis engine (all scores) | After any sync completes | Event-driven | 3 min |
| Retention/archival | Cron | Weekly Sunday 03:00 UTC | 5 min |
| CTR model rebuild | Cron | Weekly after GSC sync | 1 min |

### Webhook Strategy

**Inbound (CMS → Platform):**
- Sanity webhook fires on document publish
- Endpoint validates signature, processes content changes
- Triggers incremental crawl of the changed page

**Outbound (Platform → User):**
- Weekly digest email (via existing Resend integration)
- Alert on critical events: budget exceeded, data sync failure, critical content decay

---

## 8. Frontend Architecture

### Information Architecture

```
/admin/seo/                          Dashboard (Action Queue)
/admin/seo/keywords                  Keyword explorer
/admin/seo/keywords/[id]             Keyword detail
/admin/seo/pages                     Page performance table
/admin/seo/pages/[id]                Page detail
/admin/seo/clusters                  Topic cluster overview
/admin/seo/clusters/[id]             Cluster detail with keyword map
/admin/seo/cannibalization           Cannibalization report
/admin/seo/links                     Internal linking suggestions
/admin/seo/competitors               Competitor overview
/admin/seo/briefs                    Content brief generator
/admin/seo/settings                  Site config, API keys, weights
/admin/seo/sync                      Pipeline status and logs
```

### Dashboard (Action Queue)

The dashboard is NOT a chart-heavy analytics page. It is a **task list**.

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  SEO Intelligence Platform              [Site selector] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─── Key Metrics (compact, single row) ─────────────┐  │
│  │ Organic clicks: 1,240 (+8%)  │  Avg pos: 14.2     │  │
│  │ Conversions: 34 (+12%)       │  Actions done: 7/12 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Today's Priorities                              [All]  │
│  ─────────────────────────────────────────────────────  │
│  1. Update "Nigerian food Birmingham" page              │
│     ROI: High  │  Effort: Small  │  +120 clicks/mo     │
│     [Start] [Skip] [Details]                            │
│                                                         │
│  2. Add internal link: Menu → Catering page             │
│     ROI: Medium  │  Effort: Small  │  +40 clicks/mo    │
│     [Start] [Skip] [Details]                            │
│                                                         │
│  3. Fix cannibalization: "jollof rice" (2 pages)        │
│     ROI: High  │  Effort: Medium  │  +80 clicks/mo     │
│     [Start] [Skip] [Details]                            │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  Recent Activity                                        │
│  • GSC sync completed (1,247 rows)      2 hours ago     │
│  • Content decay detected: /blog/suya   yesterday       │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Navigation

Sidebar navigation with these groups:

```
OVERVIEW
  Dashboard (Action Queue)

INTELLIGENCE
  Keywords
  Pages
  Topic Clusters

DIAGNOSTICS
  Cannibalization
  Internal Links
  Competitors

TOOLS
  Content Briefs

SYSTEM
  Settings
  Pipeline Status
```

### Design Principles

- **Tables over charts.** The primary data display is sortable, filterable tables. Charts appear only where trend lines add meaning (position over time, traffic decay curves).
- **Inline actions.** Every row in every table has a contextual action: "Create content", "Update page", "Add link", "Investigate". No navigating to a separate action-creation screen.
- **Severity indicators.** Use colour-coded pills for status: green (healthy), amber (attention), red (urgent). These encode state at a glance without requiring the user to read numbers.
- **Last updated timestamps.** Every data section shows when its underlying data was last refreshed. Staleness is visible, not hidden.

---

## 9. Roadmap

### Phase 1 — Data Foundation (4-6 weeks)

**Objectives:** Establish the data pipeline and prove the architecture with one high-value analysis.

**Deliverables:**
- [ ] Database schema (all tables from section 3)
- [ ] GSC API integration with daily sync and archival
- [ ] GA4 API integration with daily sync
- [ ] Keyword and URL normalisation logic
- [ ] Sync log and basic pipeline monitoring
- [ ] Keyword explorer page (sortable table with GSC metrics)
- [ ] Page performance table (sortable with GA4 metrics)
- [ ] Striking distance report (keywords at positions 4-20, sorted by volume × CTR potential)
- [ ] Manual topic cluster creation UI
- [ ] Basic `/admin/seo` layout and navigation

**Dependencies:**
- Google Cloud project with Search Console API and GA4 Data API enabled
- Service account with access to both properties
- Environment variables configured

**Estimated effort:** 4-6 weeks for one developer

**Risks:**
- GSC API authentication can be tricky with service accounts vs OAuth. Budget 2-3 days for auth setup.
- GSC data delay (2-3 days) means you won't see results immediately. Plan testing around this.

**Exit criteria:** Daily data flowing from GSC and GA4, visible in admin tables. Striking distance report generating actionable keyword recommendations.

### Phase 2 — Intelligence Layer (6-8 weeks)

**Objectives:** Build the core scoring algorithms and the action queue.

**Deliverables:**
- [ ] Opportunity Score algorithm
- [ ] Page ROI Score algorithm
- [ ] Cannibalization detection and scoring
- [ ] Content decay detection
- [ ] Site-specific CTR model builder
- [ ] Conversion-weighted keyword value calculation
- [ ] Action Queue UI (the dashboard)
- [ ] DataForSEO integration: search volume and keyword difficulty
- [ ] DataForSEO integration: SERP snapshots (weekly)
- [ ] DataForSEO budget controls
- [ ] Site configuration UI (scoring weights, conversion events)

**Dependencies:**
- Phase 1 complete with ≥30 days of data
- DataForSEO account with API credentials
- At least 1,000 total clicks in GSC to build CTR model (use defaults until then)

**Estimated effort:** 6-8 weeks for one developer

**Risks:**
- Scoring algorithms need tuning after real data. Plan 1-2 weeks of iteration after initial implementation.
- DataForSEO API responses have complex nested structures. Budget time for response parsing.
- CTR model requires sufficient click data. Sites with very low traffic may never leave industry defaults.

**Exit criteria:** Dashboard shows daily prioritised actions. All scores are computing. DataForSEO data enriching keywords with volume and difficulty.

### Phase 3 — Advanced Features (8-10 weeks)

**Objectives:** Add competitive intelligence, content tools, and impact tracking.

**Deliverables:**
- [ ] Site crawler for internal link graph
- [ ] Internal link scoring and suggestions
- [ ] Topical authority scoring per cluster
- [ ] Intent alignment check
- [ ] Competitor tracking (domain authority trends, SERP overlap)
- [ ] Content brief generator (using DataForSEO On-Page API)
- [ ] Seasonal keyword calendar
- [ ] Impact tracking (before/after measurement on completed actions)
- [ ] Weekly digest email
- [ ] Data retention job (daily → weekly aggregation)

**Dependencies:**
- Phase 2 complete with action queue functional
- At least 90 days of GSC data for reliable decay detection
- Competitor domains identified and configured

**Estimated effort:** 8-10 weeks for one developer

**Risks:**
- Internal link analysis on large sites is O(n²). May need optimisation for sites with 200+ pages.
- Content brief quality depends on DataForSEO On-Page API data quality. Test early with a few keywords before building the full UI.
- Impact tracking attribution is inherently noisy. Multiple changes to a page + external factors make clean causation impossible. Document this limitation in the UI.

**Exit criteria:** Full intelligence suite running. Content briefs generating useful output. Impact tracked for completed actions.

### Phase 4 — Optimisation and Scale (ongoing)

**Objectives:** Auto-tune the system, support multiple sites, expand configurations.

**Deliverables:**
- [ ] Score auto-tuning from action outcomes (adjust weights based on what actually works)
- [ ] Multi-site UI (site selector, per-site dashboards)
- [ ] Business type configuration presets (ecommerce, beauty, service, blog)
- [ ] Automated reporting (monthly PDF or email summary)
- [ ] CMS webhook integration (real-time content updates)
- [ ] API for external consumers (if needed)
- [ ] Embeddable keyword/page performance widgets

**Dependencies:**
- Phases 1-3 complete
- Sufficient action outcomes data to train auto-tuning (≥50 completed actions with measured impact)
- Second site to test multi-site functionality

**Estimated effort:** Ongoing, feature-by-feature

**Risks:**
- Auto-tuning requires statistical rigour. Don't adjust weights from small sample sizes — minimum 50 outcomes per action type.
- Multi-site adds complexity to every query (site_id scoping). Test thoroughly that site data never leaks across sites.

---

## 10. Architecture Decision Records

### ADR-001: Data-First Architecture

**Problem:** Should the system be organised around analytical modules (feature-first) or around the data pipeline (data-first)?

**Considered alternatives:**
1. **Module-first:** Build each analysis feature independently, each with its own data fetching.
2. **Data-first:** Build a shared normalised data layer, then analysis as views on top.

**Chosen solution:** Data-first.

**Reasoning:** Module-first architectures duplicate data fetching logic, create inconsistencies when modules see different snapshots of the same data, and make cross-module analysis (e.g., cannibalization + decay) difficult. The hardest engineering problem is data normalisation and joining, not the analysis logic. Solving it once in a shared layer reduces total complexity.

**Trade-offs:** Slower to show the first feature (pipeline before product). Mitigated by shipping the striking distance report in Phase 1 — simple analysis on top of clean data.

---

### ADR-002: PostgreSQL (Supabase) Over Time-Series Database

**Problem:** Keyword-page metrics are time-series data. Should we use a specialised time-series database?

**Considered alternatives:**
1. **TimescaleDB** — PostgreSQL extension optimised for time-series.
2. **ClickHouse** — columnar database, fast analytical queries.
3. **Plain PostgreSQL** via Supabase — already in use.

**Chosen solution:** Plain PostgreSQL (Supabase).

**Reasoning:** For a single site with ~500 keywords, daily data produces ~180,000 rows/year. With weekly aggregation after 6 months, the active daily table stays under ~90,000 rows. PostgreSQL handles this without any performance concern. Adding TimescaleDB or ClickHouse introduces new infrastructure, deployment complexity, and operational burden for zero measurable benefit at this scale. The weekly aggregation table (`keyword_page_metrics_weekly`) provides long-term trend data without the storage cost of daily granularity.

**Re-evaluation trigger:** If the system tracks 10+ sites with 1,000+ keywords each, and query performance on the metrics tables exceeds 500ms, evaluate TimescaleDB as a drop-in extension.

---

### ADR-003: Multi-Site Schema Design With Single-Site Phase 1

**Problem:** The platform should eventually support multiple sites and business types. Should multi-site support be built now or later?

**Considered alternatives:**
1. **Build for one site, add multi-site later.** Simpler initial development, but requires schema migration and query refactoring later.
2. **Design multi-site schema now, build one site's features.** Slightly more complex queries (every query includes `site_id`), but zero migration cost later.

**Chosen solution:** Option 2 — multi-site schema now, single-site features first.

**Reasoning:** Adding `site_id` to every table and query is a small upfront cost (an extra `WHERE` clause). Retrofitting it later requires migrating every table, updating every query, and risking bugs in data isolation. The schema cost is paid once; the migration cost would be paid in every table.

**Trade-offs:** Every query is slightly more complex. Mitigated by a helper function that injects `site_id` filtering.

---

### ADR-004: Manual Topic Clustering Over Embeddings

**Problem:** How should keywords be grouped into topic clusters?

**Considered alternatives:**
1. **Automated clustering using embeddings** (compute semantic similarity between keywords, apply k-means or hierarchical clustering).
2. **Manual tagging** through the admin UI.
3. **Hybrid:** manual grouping with AI-suggested clusters.

**Chosen solution:** Manual tagging in Phase 1. Hybrid in Phase 3+.

**Reasoning:** For a site with 50-200 target keywords, manual grouping takes 30 minutes and produces more accurate clusters than any algorithm. The site owner understands their business taxonomy better than an embedding model. Automated clustering introduces engineering complexity (embedding model selection, distance thresholds, cluster count heuristics) that's disproportionate to the value it adds for a small keyword set.

At 500+ keywords, manual grouping becomes tedious. At that scale, introduce AI-suggested clusters that the user can accept, modify, or reject.

**Trade-offs:** Requires manual effort from the user. Mitigated by making the UI fast (drag-and-drop keywords into clusters).

**Re-evaluation trigger:** When any single site exceeds 500 target keywords.

---

### ADR-005: Server Components Over Separate API Layer

**Problem:** Should the admin UI read data through an API layer or directly from the database?

**Considered alternatives:**
1. **REST API** between frontend and database.
2. **GraphQL API** for flexible querying.
3. **Server Components** querying the database directly.

**Chosen solution:** Server Components.

**Reasoning:** The admin UI is the only consumer of this data. Building a REST or GraphQL API creates an abstraction layer with no consumers other than the UI we control. Server Components query the database directly with full type safety, zero serialisation overhead, and no API versioning. API routes exist only for external triggers (cron, webhooks) and client-side mutations.

**Trade-offs:** If we later need to expose data to external consumers (a mobile app, a reporting tool), we'll need to build an API layer then. This is unlikely for Phase 1-3 and can be added incrementally.

**Future implication:** If multi-user access is needed (e.g., a client-facing dashboard), the Server Component approach still works — add authentication middleware, not an API layer.

---

### ADR-006: Cron-Based Pipelines Over Event-Driven

**Problem:** How should data sync jobs be triggered?

**Considered alternatives:**
1. **Cron-based:** scheduled jobs at fixed intervals.
2. **Event-driven:** jobs triggered by upstream events (e.g., GSC data becomes available).
3. **Queue-based:** jobs placed in a message queue, processed by workers.

**Chosen solution:** Cron-based with webhook supplements.

**Reasoning:** GSC and GA4 data becomes available on a predictable schedule (daily, with a 2-3 day delay). There's no upstream event to subscribe to — you poll on a schedule. Queue-based infrastructure (Redis, BullMQ, SQS) adds operational complexity that's unjustified for 4-5 daily jobs. Vercel Cron (or a simple external cron service) triggers API routes. CMS changes are the exception — those come via webhook and are handled immediately.

**Trade-offs:** Data is only as fresh as the cron interval. For daily SEO data, this is fine — nobody makes SEO decisions based on hourly data changes.

---

### ADR-007: JSONB Configuration Over Hard-Coded Business Logic

**Problem:** Different business types need different scoring weights, conversion events, and intent priorities. How should this be configurable?

**Considered alternatives:**
1. **Hard-coded per business type** (if/else branches in scoring logic).
2. **JSONB configuration** in the database, read at scoring time.
3. **Configuration files** committed to the repository.

**Chosen solution:** JSONB in `site_configs` table.

**Reasoning:** Scoring weights need to be adjustable without code deployments. Different sites on the same instance need independent configuration. JSONB in PostgreSQL is queryable, indexable, and doesn't require schema migrations when new config keys are added. Default configurations per business type are provided as seed data, not code branches.

**Trade-offs:** JSONB is less type-safe than explicit columns. Mitigated by a TypeScript interface that validates config shape at the application layer before writing to the database.

---

### ADR-008: Keyword Normalisation — Conservative Approach

**Problem:** How aggressively should keywords be normalised for deduplication?

**Considered alternatives:**
1. **Aggressive:** lowercase + stem + strip prepositions + strip articles.
2. **Conservative:** lowercase + trim + collapse spaces + strip articles only.
3. **None:** store exactly as received from GSC.

**Chosen solution:** Conservative (option 2).

**Reasoning:** Aggressive normalisation merges keywords with different meanings. "Food in Birmingham" and "food Birmingham" have different search volumes and potentially different SERP results. Stemming "catering" to "cater" loses meaning. Conservative normalisation catches only true duplicates (case differences, extra spaces, leading "a/an/the") while preserving semantic distinctions.

**Trade-offs:** May result in near-duplicate keywords that the user must merge manually. This is preferable to automatic merging that destroys data.

---

## Appendix A: Environment Variables

```env
# Google Search Console
GSC_CLIENT_EMAIL=seo-platform@project.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GSC_PROPERTY_URL=https://www.naijagrillandspice.co.uk

# Google Analytics 4
GA4_CLIENT_EMAIL=seo-platform@project.iam.gserviceaccount.com
GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GA4_PROPERTY_ID=123456789

# DataForSEO
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password

# Cron job authentication
CRON_SECRET=a-long-random-string

# Existing (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Appendix B: Business Type Configuration Presets

### Restaurant (default)

```json
{
  "scoring_weights": {
    "opportunity": {
      "volume": 0.20,
      "position": 0.35,
      "difficulty": 0.15,
      "intent": 0.15,
      "business_value": 0.15
    }
  },
  "conversion_events": [
    {"name": "whatsapp_click", "value": 15},
    {"name": "uber_eats_click", "value": 12},
    {"name": "phone_call", "value": 10},
    {"name": "reservation_submit", "value": 20},
    {"name": "directions_click", "value": 5}
  ],
  "keyword_intent_priority": ["transactional", "commercial", "informational"],
  "default_content_types": ["landing_page", "blog_post", "service_page"],
  "local_business": true
}
```

### Ecommerce

```json
{
  "scoring_weights": {
    "opportunity": {
      "volume": 0.25,
      "position": 0.25,
      "difficulty": 0.20,
      "intent": 0.20,
      "business_value": 0.10
    }
  },
  "conversion_events": [
    {"name": "purchase", "value": 0},
    {"name": "add_to_cart", "value": 5},
    {"name": "begin_checkout", "value": 10}
  ],
  "keyword_intent_priority": ["transactional", "commercial", "informational"],
  "default_content_types": ["product_page", "category_page", "blog_post"],
  "local_business": false
}
```

### Service Business

```json
{
  "scoring_weights": {
    "opportunity": {
      "volume": 0.20,
      "position": 0.30,
      "difficulty": 0.15,
      "intent": 0.20,
      "business_value": 0.15
    }
  },
  "conversion_events": [
    {"name": "form_submit", "value": 50},
    {"name": "phone_call", "value": 30},
    {"name": "email_click", "value": 15}
  ],
  "keyword_intent_priority": ["commercial", "transactional", "informational"],
  "default_content_types": ["service_page", "landing_page", "blog_post"],
  "local_business": true
}
```

### Blog / Content Site

```json
{
  "scoring_weights": {
    "opportunity": {
      "volume": 0.30,
      "position": 0.25,
      "difficulty": 0.20,
      "intent": 0.10,
      "business_value": 0.15
    }
  },
  "conversion_events": [
    {"name": "newsletter_signup", "value": 5},
    {"name": "affiliate_click", "value": 2}
  ],
  "keyword_intent_priority": ["informational", "commercial", "transactional"],
  "default_content_types": ["blog_post", "category_page", "landing_page"],
  "local_business": false
}
```

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-07-18 | Initial architecture document | Paul Kelvin |
