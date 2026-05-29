# EvalCap Task Prioritization (2026-05-29)

## Summary
MVP features (auth, checkin, history, summary, dashboard, cycles, goals, account) are complete.
This document tracks remaining work to polish, harden, and extend the product.

---

## Completed

### Core MVP
- [x] Auth (email/password login + signup + forgot/reset password)
- [x] Google OAuth sign-in on login and signup pages
- [x] Password visibility toggle on all password fields (login, signup, reset)
- [x] Journal check-in page with AI prompts (daily + weekly)
- [x] History page (list + view + edit + delete entries)
- [x] Summary generation page + save/view/delete summaries
- [x] Dashboard with stats, recent entries, active cycles, goals snapshot
- [x] Performance cycles (create, edit, delete, archive)
- [x] Evaluation goals + personal goals systems with AI integration
- [x] Profile page + account management (export data, delete account)
- [x] Settings page (default check-in type preference)
- [x] Onboarding modal (first-time user flow)
- [x] Navigation (responsive, active route highlighting)
- [x] Loading skeletons and empty states across all pages

### Hardening
- [x] Input validation (`lib/validation.ts`) with sanitizeText, validateJSON, etc.
- [x] Rate limiting (`lib/rate-limit.ts`) — namespaced per route+user, 10 req/min prompts, 5 req/min summary, per-method limits on all routes
- [x] Security headers (HSTS, CSP, X-Frame-Options) in `next.config.mjs`
- [x] Structured logging (`lib/logger.ts`) with level + category filtering
- [x] Sentry error monitoring — client/server/edge configs, `logger.error` forwards to Sentry in production, React error boundary auto-captured
- [x] Error boundary + 404 page
- [x] RLS on all Supabase tables
- [x] Fix `summaries/[id]` PATCH to return 400 (not 500) for invalid content

### Infrastructure
- [x] Cookie consent banner
- [x] OG image (`/opengraph-image`)
- [x] Health check endpoint (`/api/health`)
- [x] Terms of Service + Privacy Policy pages

### Bug Fixes
- [x] Dashboard showing 0 for all stats — removed `unstable_cache`/`createAdminClient`, now queries fresh with authenticated user client

### Testing (2026-05-29) — 417 tests, all passing
- [x] `test:coverage` and `test:ci` scripts in package.json
- [x] `lib/validation.ts` — 100% coverage
- [x] `lib/claude.ts` — 100% stmt/func/line coverage
- [x] `lib/rate-limit.ts` — 72% coverage + `.unref()` fix
- [x] `lib/logger.ts` — 86% coverage
- [x] `lib/fetcher.ts` — 100% coverage
- [x] `proxy.ts` (middleware) — 74% stmt / 100% branch coverage
- [x] `api/entries` POST — 90%
- [x] `api/entries/[id]` GET/PATCH/DELETE — 86%
- [x] `api/prompts` POST — 93%
- [x] `api/summary` POST — 90%
- [x] `api/account` DELETE — 91%
- [x] `api/account/export` GET — 87%
- [x] `api/health` GET — 100%
- [x] `api/profile` GET/PATCH — 71%
- [x] `api/summaries` POST — 88%
- [x] `api/summaries/[id]` PATCH/DELETE — 89%
- [x] `api/cycles` GET/POST — 85%
- [x] `api/cycles/[id]` PATCH/DELETE — 78%
- [x] `api/goals/evaluation` GET/POST — 84%
- [x] `api/goals/evaluation/[id]` PATCH/DELETE — 85%
- [x] `api/goals/personal` GET/POST — 84%
- [x] `api/goals/personal/[id]` PATCH/DELETE — 83%
- [x] `auth/callback/route.ts` — 82% coverage
- [x] `components/skeleton.tsx` — 100% coverage
- [x] `components/cookie-banner.tsx` — 100% coverage
- [x] `components/nav.tsx` — 91% coverage
- [x] `components/onboarding-modal.tsx` — 88% coverage
- [x] `components/theme-provider.tsx` — 89% coverage
- [x] `app/error.tsx` — covered (jsdom + RTL)
- [x] Install `jest-environment-jsdom` + fix `moduleNameMapper` for React 19 in monorepo

### Mobile App — MVP (2026-05-29)
- [x] Expo SDK 54 scaffold in `apps/mobile` (Expo Router v6, TypeScript, React 19, RN 0.81)
- [x] EAS Build config (`eas.json`) for TestFlight + internal Android
- [x] Auth: login + signup screens, persistent session via `expo-secure-store`
- [x] Auth context (`contexts/auth.tsx`) with auto-redirect on state change
- [x] Dashboard tab: entry count, summary count, streak, recent entries, nudge banner
- [x] Check-in tab: daily/weekly, AI prompts from web API, submit entry to Supabase
- [x] History tab: paginated FlatList + search, detail view with delete
- [x] Summary tab: date range picker, AI summary from web API, copy to clipboard
- [x] Profile tab: view/edit name + job title, sign out
- [x] `metro.config.js` with monorepo watchFolders + `@/` path alias
- [x] Web API patch: Bearer token support on `/api/prompts` + `/api/summary`

### Admin Panel — MVP (2026-05-29)
- [x] Schema: `profiles.status`, `credits`, `credit_events`, `admin_audit_log` tables
- [x] Middleware: `/admin/*` routes protected, role check in layout
- [x] `lib/admin-auth.ts` — `requireAdmin()` helper
- [x] `lib/admin-audit.ts` — `logAdminAction()` helper
- [x] `lib/supabase/admin.ts` — typed service-role client
- [x] `/admin/users` — paginated user list with search + status badge
- [x] `/admin/users/[id]` — user detail: profile, stats, recent entries, credits
- [x] Suspend / unsuspend user (POST `/api/admin/users/[id]/suspend`)
- [x] Add credits (POST `/api/admin/users/[id]/credits`) + credit_events ledger
- [x] `/admin/health` — Supabase latency + API key status
- [x] `/admin/audit` — last 100 audit events table
- [x] Tests: `admin-auth`, `admin-audit`, `admin-suspend`, `admin-credits` (22 tests)

---

## P1: High Priority

### Mobile Responsiveness Audit
- [x] Test all pages on mobile viewports (320px, 375px, 768px)
- [x] Fix layout issues (buttons, forms, text sizing)
- [x] Touch-friendly tap targets (44x44 min)
- [x] Verify modals and dialogs work on small screens

### Landing Page
- [x] Conversion-focused hero section with product mockup
- [x] Feature highlights (check-ins → AI prompts → review summary)
- [x] Trust bar + FAQ sections
- [x] SEO meta tags (keywords, OG, canonical)

---

## In Progress

### Payments & Subscriptions (planned)
- [ ] RevenueCat account + product setup (App Store + Play Store + web/Stripe)
- [ ] Schema: `profiles.subscription_status`, `profiles.rc_customer_id`
- [ ] `POST /api/webhooks/revenuecat` — update subscription on entitlement events
- [ ] Web paywall page + RevenueCat Billing embedded checkout
- [ ] Mobile paywall screen (react-native-purchases entitlement check)
- [ ] Gate AI credit usage behind subscription check
  - **Est**: 12–16h

---

## P2: Medium Priority

### Summary UX Improvements
- [ ] Date range picker (instead of manual text input)
- [ ] Copy-to-clipboard on summary generation page
- [ ] Shareable summary link

### Streak / Engagement
- [x] Track check-in streak (consecutive ISO weeks with at least one entry)
- [x] Display streak on dashboard (replaces "Last Check-in" stat)
- [x] In-app nudge when current week has no check-in yet

### History Improvements
- [x] Search/filter entries by keyword or date range

---

## P3: Low Priority / Roadmap

### Additional Test Coverage
- [x] E2E tests with Playwright — golden-path.spec.ts covers dashboard, check-in, history search, summary, profile, settings, mobile nav (runs when E2E_TEST_EMAIL/PASSWORD set; AI routes mocked)
- [ ] Increase `api/profile` coverage (currently 71%)
- [ ] Increase `api/cycles/[id]` coverage (currently 78%)
- [x] Component tests: skeleton, cookie-banner, nav, onboarding-modal, theme-provider, error
- [x] `lib/fetcher.ts`, `proxy.ts`, `auth/callback` route tests

### Integrations (Future)
- [ ] Calendar sync, Jira/Linear, Slack, PDF export
- **Est**: 15+ hours

### Mobile App (React Native)
- [ ] Scaffold with Expo, auth + core features, offline support
- **Est**: 40+ hours (Q3 2026)

---

## Test Coverage Summary (2026-05-29)

| Area | Stmt% | Notes |
|------|-------|-------|
| `lib/validation.ts` | 100% | full |
| `lib/claude.ts` | 100% | full |
| `lib/logger.ts` | 86% | Sentry forwarding tested via NODE_ENV=production isolation |
| `lib/rate-limit.ts` | 72% | cleanup interval not tested |
| `api/health` | 100% | full |
| `api/account` | 91% | |
| `api/account/export` | 87% | |
| `api/entries` | 90% | |
| `api/entries/[id]` | 86% | |
| `api/prompts` | 95% | +Bearer token tests |
| `api/summary` | 92% | +Bearer token tests |
| `api/summaries` | 88% | |
| `api/summaries/[id]` | 89% | |
| `api/cycles` | 85% | |
| `api/cycles/[id]` | 78% | |
| `api/goals/evaluation` | 84% | |
| `api/goals/evaluation/[id]` | 85% | |
| `api/goals/personal` | 84% | |
| `api/goals/personal/[id]` | 83% | |
| `api/profile` | 71% | on-demand create path complex |
| `auth/callback/route.ts` | 82% | |
| `proxy.ts` | 74% | |
| `components/skeleton.tsx` | 100% | full |
| `components/cookie-banner.tsx` | 100% | full |
| `components/nav.tsx` | 91% | |
| `components/onboarding-modal.tsx` | 88% | |
| `components/theme-provider.tsx` | 89% | |
| `app/error.tsx` | ~90% | |
| `lib/fetcher.ts` | 100% | full |

**Total: 452 tests, 0 failing**
