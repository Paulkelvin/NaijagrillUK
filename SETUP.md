# NaijaGrill — Setup Guide

## Prerequisites

- Node.js 20+
- npm
- Sanity account
- Supabase account

## 1. Install dependencies

```bash
npm install
```

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

## 3. Sanity CMS

**Project ID:** `26qme93a`  
**Dataset:** `production`

1. Set in `.env.local`:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=26qme93a
   NEXT_PUBLIC_SANITY_DATASET=production
   ```
2. Log in to Sanity CLI (one-time): `npx sanity login`
3. Deploy schemas: `npm run sanity:schema`
4. Seed initial content: `npm run sanity:seed`
5. Open the embedded studio at http://localhost:3000/studio to upload images and edit copy

Until Sanity is configured, the site uses editorial fallback content.

**Cursor Sanity MCP:** When available, schema deploy, content queries, and document updates can be managed via the Sanity MCP tools in Cursor. This project also ships local Studio source in `sanity/` — keep those in sync.

## 4. Supabase (your action items)

You have already created the project and run the migration. Complete these remaining steps:

### A. Copy your API keys

In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings** → **API**:

| Key | Where to put it |
|-----|-----------------|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` |
| **anon public** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` |
| **service_role** (secret) | `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` only — never commit this |

### B. Verify tables exist

In **Table Editor**, confirm these tables exist:

- `reservations`
- `event_inquiries`
- `newsletter_leads`
- `contact_messages`

### C. Test a form locally

1. Add all three Supabase env vars to `.env.local`
2. Run `npm run dev`
3. Submit a test reservation at http://localhost:3000/reservations
4. Check the `reservations` table in Supabase Table Editor for the new row

### D. Production (Vercel)

Add the same three Supabase variables in Vercel → Project → Settings → Environment Variables. Use `SUPABASE_SERVICE_ROLE_KEY` for server-side form actions.

### E. Optional — view submissions

Use Supabase Table Editor or set up email notifications later via Supabase Edge Functions or a tool like Zapier.

Tables use RLS with anonymous **insert-only** policies — visitors can submit forms but cannot read other people's data.

## 5. Analytics (optional)

- **Google Analytics 4**: Create a property, copy Measurement ID to `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **Microsoft Clarity**: Create a project at [clarity.microsoft.com](https://clarity.microsoft.com), copy Project ID to `NEXT_PUBLIC_CLARITY_PROJECT_ID`

## 6. Development

```bash
npm run dev
```

- Site: http://localhost:3000
- CMS Studio: http://localhost:3000/studio

## 7. Production deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables from `.env.example`
4. Deploy

Recommended Vercel settings:

- Framework: Next.js
- Build command: `npm run build`
- Node.js 20.x

## Business address

NaijaGrill, 77B Rookery Road, Handsworth, Birmingham, B21 9QU, United Kingdom
