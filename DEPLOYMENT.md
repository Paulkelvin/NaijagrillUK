# NaijaGrill Deployment Guide

## Prerequisites

- Node.js 20+
- A [Sanity](https://www.sanity.io/manage) project
- A [Supabase](https://supabase.com/dashboard) project
- A [Vercel](https://vercel.com) account (recommended)

## 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Yes | Production URL, e.g. `https://naijagrillandspice.co.uk` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Usually `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key for form submissions |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | No | Microsoft Clarity project ID |

## 2. Sanity CMS Setup

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage)
2. Add your project ID and dataset to `.env.local`
3. Deploy the schema:

```bash
npm run sanity:schema
```

4. Start the embedded studio locally at `/studio`, or deploy it:

```bash
npm run sanity:deploy
```

5. Create singleton documents in Sanity:
   - **Homepage** (one document)
   - **Opening Hours** (one document)
   - **Contact Information** (one document)
   - **Explore Nigerian Cuisine** (one document)

6. Add content: menu items, testimonials, blog posts, events, gallery images.

The site falls back to curated placeholder content when Sanity is not configured.

## 3. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com/dashboard)
2. Run the migration in the SQL editor:

```
supabase/migrations/20260609000000_initial_schema.sql
```

Or via CLI:

```bash
supabase db push
```

3. Add your Supabase URL and keys to `.env.local`
4. Tables created: `reservations`, `event_inquiries`, `newsletter_leads`, `contact_messages`
5. RLS is enabled with anonymous insert policies for form submissions

## 4. Analytics Setup

### Google Analytics 4

1. Create a GA4 property at [analytics.google.com](https://analytics.google.com)
2. Copy the Measurement ID (format: `G-XXXXXXXXXX`)
3. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in your environment

### Microsoft Clarity

1. Create a project at [clarity.microsoft.com](https://clarity.microsoft.com)
2. Copy the Project ID
3. Set `NEXT_PUBLIC_CLARITY_PROJECT_ID` in your environment

Analytics scripts load automatically when these variables are set.

## 5. Local Development

```bash
npm install
npm run dev
```

- Site: http://localhost:3000
- Sanity Studio: http://localhost:3000/studio

## 6. Production Build

```bash
npm run build
npm run start
```

## 7. Deploy to Vercel

1. Push the repository to GitHub
2. Import the project in Vercel
3. Add all environment variables from `.env.example`
4. Deploy

Vercel will automatically:
- Generate `/sitemap.xml` and `/robots.txt`
- Serve the dynamic `/opengraph-image` for social sharing
- Statically generate blog posts and pages at build time

## 8. SEO Platform: Google Service Accounts (Optional, Phase 1)

Only needed once you're ready to test the GSC/GA4 sync jobs (`docs/seo-platform/PHASE_1_IMPLEMENTATION.md` Milestones 5-6). The site and its existing features work fully without this — `isGscConfigured()`/`isGa4Configured()` (`src/lib/seo/config.ts`) keep the pipeline inert until these are set.

GSC and GA4 use separate service accounts in this walkthrough (a single account with access to both APIs also works — same steps, reuse one JSON key for both sets of env vars).

### 8.1 Create the Google Cloud project and service account(s)

1. In the [Google Cloud Console](https://console.cloud.google.com), create a project (or reuse one) — the project doesn't need to be linked to the same Google account that owns the GSC property or GA4 account.
2. Enable the required APIs for that project:
   - **Search Console API** — for GSC
   - **Google Analytics Data API** — for GA4
3. Create a service account: **IAM & Admin → Service Accounts → Create Service Account**. Name it something identifiable (e.g. `seo-platform`).
4. Generate a key: open the service account → **Keys → Add Key → Create new key → JSON**. This downloads a `.json` file containing `client_email` and `private_key` — these map directly to `GSC_CLIENT_EMAIL`/`GSC_PRIVATE_KEY` (and `GA4_CLIENT_EMAIL`/`GA4_PRIVATE_KEY` if reusing the same account).

The service account itself has no access to your GSC property or GA4 data yet — that's granted separately in the next two steps, inside GSC/GA4 themselves, not in Google Cloud.

### 8.2 Grant Search Console access

1. Open [Search Console](https://search.google.com/search-console) for `naijagrillandspice.co.uk`.
2. **Settings → Users and permissions → Add user**.
3. Enter the service account's `client_email` (looks like `seo-platform@your-project.iam.gserviceaccount.com`).
4. Grant **Full** or **Restricted** — Restricted (read-only) is sufficient; the sync job only calls `searchanalytics.query`, never a write endpoint.
5. Set `GSC_PROPERTY_URL` to the exact property URL as it appears in Search Console (must match exactly — GSC properties are matched by exact URL, not domain).

### 8.3 Grant GA4 access

1. Open [Google Analytics](https://analytics.google.com) → **Admin → Property Access Management** for the relevant GA4 property.
2. **Add users**, enter the service account's `client_email`.
3. Role: **Viewer** — sufficient; the sync job only calls `runReport`, never a write/admin endpoint.
4. Set `GA4_PROPERTY_ID` to the numeric property ID (Admin → Property Settings → Property ID — not the Measurement ID used by `NEXT_PUBLIC_GA_MEASUREMENT_ID`, a different identifier for a different API).

### 8.4 Set environment variables

Add to `.env.local` (or your hosting platform's environment variables):

```
GSC_CLIENT_EMAIL=seo-platform@your-project.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GSC_PROPERTY_URL=https://www.naijagrillandspice.co.uk

GA4_CLIENT_EMAIL=seo-platform@your-project.iam.gserviceaccount.com
GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GA4_PROPERTY_ID=123456789
```

The private key from the downloaded JSON file already contains literal `\n` sequences when copied as a single line — paste it as-is, in quotes. `normalizePrivateKey()` (`src/lib/seo/config.ts`) handles both that form and a version with real newlines, so either works.

Also set `CRON_SECRET` (any random string — `openssl rand -hex 32`) before Milestone 4's cron routes exist; harmless to set now.

### 8.5 Verify parsing

No sync job reads this config yet (that's Milestones 5-6), but you can confirm the values parse correctly right now:

```bash
npx tsx -e "
import { isGscConfigured, isGa4Configured } from './src/lib/seo/config';
console.log('GSC configured:', isGscConfigured());
console.log('GA4 configured:', isGa4Configured());
"
```

`false` with no thrown error means something's missing or malformed but the app stays inert (by design) — check for a typo'd variable name or a private key missing its `BEGIN`/`END` markers before assuming a deeper problem.

## 9. Post-Deploy Checklist

- [ ] Verify all pages load with Sanity content
- [ ] Test reservation form submission in Supabase
- [ ] Test newsletter signup (£10 off offer)
- [ ] Test contact and event inquiry forms
- [ ] Confirm Google Search Console sitemap submission
- [ ] Validate structured data with [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Check mobile navigation and floating CTA (Call, Directions, Reserve)
