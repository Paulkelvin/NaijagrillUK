# ADR-010: Signed-Cookie Sessions Replace HTTP Basic Auth for `/admin`

**Status:** Accepted
**Date:** 2026-07-20
**Author:** Claude, on behalf of Paul Kelvin

## Problem

ARCHITECTURE.md §7 specifies HTTP Basic Auth as the auth mechanism for `/admin` and its mutation routes — already built, pre-dating Phase 2. Two real problems surfaced once Phase 2's UI (Milestones 11–12) shipped and the user actually used it day to day:

1. **No persistent login.** Basic Auth's "session" is entirely the browser's own credential cache, with a lifetime the application has no control over. The user reported having to re-enter the admin username/password "every now and then" — an unpredictable, browser-controlled interval, not the reliable long-lived session a single-operator admin tool should have.
2. **No room for real navigation.** Basic Auth authenticates the whole origin via a native browser prompt before any HTML renders. There's no login *page* to add a nav bar to, no session state to key a "you are here" indicator off, and nothing for a proper site-wide `/admin` layout to hang off. The user's own screenshots showed the old Owner Dashboard with zero links to `/admin/seo` or `/admin/seo/settings` — those pages existed and were fully built, but nothing on the page the user actually lands on pointed to them.

Both are real, user-reported gaps, not speculative improvements.

## Considered Alternatives

1. **Keep Basic Auth, do nothing about session length.** Doesn't fix either problem — the browser still controls session lifetime, and Basic Auth still can't host a nav bar.
2. **Keep Basic Auth, add a separate app-level "remember me" mechanism layered on top.** Doesn't remove the fundamental issue that the browser's native auth prompt owns the UI before the app gets a chance to render anything, including a nav.
3. **A database-backed session table** (session id in a cookie, row in Postgres with `expires_at`, checked on every request). Works, but needs a migration, a table, and a DB round-trip on every proxy-layer check — real cost for a single-admin site with no legitimate concurrent-session-revocation requirement.
4. **A stateless, HMAC-signed session cookie**, verified entirely in `src/proxy.ts` (Next.js 16's renamed Middleware — see `AGENTS.md`) with no DB lookup and no new table. Token is `${expiresAtMs}.${hmac}`, where the HMAC key is `ADMIN_PASSWORD` itself.

## Decision

Option 4 — stateless HMAC-signed session cookie, backed by a real `/admin/login` form.

## Reasoning

Verified against Next.js 16's own current documentation before writing any code, per `AGENTS.md`'s explicit warning that this environment's conventions may not match training data (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`): a stateless signed cookie, verified directly in Proxy, is the framework's own recommended pattern — not a shortcut. The doc's "optimistic check" terminology refers to skipping a *database* lookup in the proxy layer for performance, not skipping full cryptographic verification; `verifySessionToken()` does a real HMAC comparison (via `timingSafeEqual`) on every request, not merely an "is a cookie present" check.

No new table or migration is needed because there is exactly one admin credential (`ADMIN_PASSWORD`) and no legitimate requirement to revoke one browser's session without affecting another's — a single-operator site has no multi-session-management use case to justify a `sessions` table. Using `ADMIN_PASSWORD` itself as the HMAC key gets credential rotation for free: changing the env var immediately invalidates every previously-issued session token, with no explicit revocation logic needed.

A real login page also directly resolves problem 2 above: `/admin/login` is an ordinary page that can be excluded from the shared nav layout, while every other `/admin/*` route is wrapped in a route-group layout (`src/app/admin/(dashboard)/layout.tsx`) that renders `AdminNav` — desktop inline links plus a mobile hamburger menu, exactly what the user asked for after their screenshots showed none existed.

90 days was chosen for `SESSION_DURATION_MS` as a deliberately long, single-operator-appropriate duration directly answering "I don't want to have to enter login details every now and then," bounded by the cookie's own `Max-Age` (no server-side idle timeout is layered on top, since none was requested and the stateless design has no session store to expire early anyway).

## Trade-offs

- **No server-side session revocation for a single stolen token before its 90-day expiry**, short of rotating `ADMIN_PASSWORD` (which invalidates *every* session, not just the compromised one). Accepted: this is a single-operator admin panel behind HTTPS, not a multi-user system with a real need for per-session revocation; rotating the one shared password is an acceptable response to a suspected compromise at this scale.
- **The cookie's expiry is fixed at issuance**, not sliding/refreshed on activity — a session created today expires in exactly 90 days regardless of how often it's used in between. Accepted: simpler to reason about and verify than a sliding-window scheme, and 90 days already comfortably covers real usage gaps.
- **Basic Auth is gone entirely for `/admin`**, so anyone with the old browser-cached Basic Auth credential will be prompted to use the new `/admin/login` form instead after this deploys — a one-time, expected re-login, not a regression.

## Related

- `src/lib/auth/session.ts` / `session.test.ts` — `createSessionToken()`/`verifySessionToken()`
- `src/proxy.ts` / `proxy.test.ts` — replaces `src/middleware.ts` (renamed per Next.js 16; same `config.matcher` shape)
- `src/app/admin/login/page.tsx`, `src/app/api/admin/login/route.ts`, `src/app/api/admin/logout/route.ts` — the login/logout flow
- `src/components/admin/AdminNav.tsx`, `src/app/admin/(dashboard)/layout.tsx` — the shared nav (desktop + mobile hamburger) this change made possible
- `src/lib/auth/basic-auth.ts` — deleted, no remaining references
- ARCHITECTURE.md §7 Authentication — updated to reflect this decision
