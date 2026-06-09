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
| `NEXT_PUBLIC_SITE_URL` | Yes | Production URL, e.g. `https://naijagrill.co.uk` |
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

## 8. Post-Deploy Checklist

- [ ] Verify all pages load with Sanity content
- [ ] Test reservation form submission in Supabase
- [ ] Test newsletter signup (£10 off offer)
- [ ] Test contact and event inquiry forms
- [ ] Confirm Google Search Console sitemap submission
- [ ] Validate structured data with [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Check mobile navigation and floating CTA (Call, Directions, Reserve)
