# EvalCap Task Prioritization (2026-05-28)

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
- [x] Rate limiting (`lib/rate-limit.ts`) — 10 req/min prompts, 5 req/min summary
- [x] Security headers (HSTS, CSP, X-Frame-Options) in `next.config.mjs`
- [x] Structured logging (`lib/logger.ts`) with level + category filtering
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

### Testing (2026-05-28) — 154 tests, all passing
- [x] `test:coverage` and `test:ci` scripts in package.json
- [x] `lib/validation.ts` — 100% coverage
- [x] `lib/claude.ts` — 100% stmt/func/line coverage
- [x] `lib/rate-limit.ts` — 72% coverage + `.unref()` fix
- [x] `lib/logger.ts` — 86% coverage
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

---

## P1: High Priority

### Mobile Responsiveness Audit
- [ ] Test all pages on mobile viewports (320px, 375px, 768px)
- [ ] Fix layout issues (buttons, forms, text sizing)
- [ ] Touch-friendly tap targets (44x44 min)
- [ ] Verify modals and dialogs work on small screens
- **Est**: 4 hours

### Landing Page
- [ ] Conversion-focused hero section
- [ ] Feature highlights (check-ins → AI prompts → review summary)
- [ ] Social proof / CTA
- [ ] SEO meta tags
- **Est**: 4 hours

---

## P2: Medium Priority

### Summary UX Improvements
- [ ] Date range picker (instead of manual text input)
- [ ] Copy-to-clipboard on summary generation page
- [ ] Shareable summary link

### Streak / Engagement
- [ ] Track check-in streak (consecutive days/weeks)
- [ ] Display streak on dashboard
- [ ] In-app nudge if streak broken

### History Improvements
- [ ] Search/filter entries by keyword or date range

---

## P3: Low Priority / Roadmap

### Additional Test Coverage
- [ ] E2E tests with Playwright (signup → checkin → summary flow)
- [ ] Increase `api/profile` coverage (currently 71%)
- [ ] Increase `api/cycles/[id]` coverage (currently 78%)

### Integrations (Future)
- [ ] Calendar sync, Jira/Linear, Slack, PDF export
- **Est**: 15+ hours

### Mobile App (React Native)
- [ ] Scaffold with Expo, auth + core features, offline support
- **Est**: 40+ hours (Q3 2026)

---

## Test Coverage Summary (2026-05-28)

| Area | Stmt% | Notes |
|------|-------|-------|
| `lib/validation.ts` | 100% | full |
| `lib/claude.ts` | 100% | full |
| `lib/logger.ts` | 86% | |
| `lib/rate-limit.ts` | 72% | cleanup interval not tested |
| `api/health` | 100% | full |
| `api/account` | 91% | |
| `api/account/export` | 87% | |
| `api/entries` | 90% | |
| `api/entries/[id]` | 86% | |
| `api/prompts` | 93% | |
| `api/summary` | 90% | |
| `api/summaries` | 88% | |
| `api/summaries/[id]` | 89% | |
| `api/cycles` | 85% | |
| `api/cycles/[id]` | 78% | |
| `api/goals/evaluation` | 84% | |
| `api/goals/evaluation/[id]` | 85% | |
| `api/goals/personal` | 84% | |
| `api/goals/personal/[id]` | 83% | |
| `api/profile` | 71% | on-demand create path complex |

**Total: 154 tests, 0 failing**
