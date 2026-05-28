# EvalCap Task Prioritization (2026-05-28)

## Summary
MVP features (auth, checkin, history, summary, dashboard, cycles, goals, account) are complete.
This document tracks remaining work to polish, harden, and extend the product.

**Key Focus Areas**:
1. **Testing** — Unit test coverage now solid; E2E tests remain
2. **UX Polish** — Mobile responsiveness, landing page
3. **Feature Completeness** — Export, streak tracking, summary sharing

---

## ✅ Completed

### Core MVP
- [x] Auth (email/password login + signup + forgot/reset password)
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
- [x] Input validation (`lib/validation.ts`) with `sanitizeText`, `validateJSON`, etc.
- [x] Rate limiting (`lib/rate-limit.ts`) — 10 req/min prompts, 5 req/min summary
- [x] Security headers (HSTS, CSP, X-Frame-Options) in `next.config.mjs`
- [x] Structured logging (`lib/logger.ts`) with level + category filtering
- [x] Error boundary + 404 page
- [x] RLS on all Supabase tables

### Infrastructure
- [x] Cookie consent banner
- [x] OG image (`/opengraph-image`)
- [x] Health check endpoint (`/api/health`)
- [x] Terms of Service + Privacy Policy pages

### Testing ✅ (2026-05-28)
- [x] Jest + ts-jest setup with coverage
- [x] `test:coverage` and `test:ci` scripts added to package.json
- [x] `validation.ts` — 100% coverage (sanitizeText, validateJSON, validateCheckInType, validateDateString, validateOptionalString)
- [x] `claude.ts` — 100% statement/function/line coverage (generateSmartPrompts, generateSummary, formatGoalsContext, fallback handling, goals context)
- [x] `rate-limit.ts` — 72% coverage (checkRateLimit, getRateLimitInfo, per-user isolation, window reset, cleanup timer .unref() fix)
- [x] `logger.ts` — 86% coverage (all log levels, category prefix, data passthrough)
- [x] `POST /api/entries` — 90% coverage (auth, validation, create, DB error)
- [x] `GET/PATCH/DELETE /api/entries/[id]` — 86% coverage (auth, 404, success, validation, DB error)
- [x] `POST /api/prompts` — 93% coverage (auth, rate limit, validation, goals, DB error)
- [x] `POST /api/summary` — 90% coverage (auth, rate limit, validation, date range, no entries, success, userInstructions)
- [x] **Total: 85 tests, all passing**

---

## 🔴 P0: Fix Now

### Dashboard data staleness ✅ (2026-05-28)
- [x] Remove `unstable_cache` / `createAdminClient` from dashboard — was serving stale zeros
- [x] Query directly with authenticated user client for always-fresh data

---

## 🟡 P1: High Priority

### Mobile Responsiveness Audit
- [ ] Test all pages on mobile viewports (320px, 375px, 768px)
- [ ] Fix layout issues (buttons, forms, text sizing)
- [ ] Touch-friendly tap targets (44×44 min)
- [ ] Verify modals and dialogs work on small screens
- **Est**: 4 hours

### Landing Page
- [ ] Conversion-focused hero section
- [ ] Feature highlights (check-ins → AI prompts → review summary)
- [ ] Social proof / CTA
- [ ] SEO meta tags
- **Est**: 4 hours

---

## 🟠 P2: Medium Priority

### Summary UX Improvements
- [ ] Date range picker (instead of manual text input)
- [ ] Preview summary before saving
- [ ] Copy-to-clipboard button on summary generation page
- [ ] Shareable summary link (optional, with expiry)
- **Est**: 5 hours

### Streak / Engagement
- [ ] Track check-in streak (consecutive days/weeks)
- [ ] Display streak on dashboard
- [ ] Nudge if streak broken (browser notification or in-app banner)
- **Est**: 3 hours

### History Improvements
- [ ] Search/filter entries by keyword
- [ ] Filter by check-in type (daily/weekly)
- [ ] Filter by date range
- **Est**: 4 hours

---

## 🔵 P3: Low Priority / Roadmap

### Export & Sharing
- [ ] Export summary as PDF
- [ ] Export all entries as JSON (GDPR — partial: export data exists in account)
- [ ] Shareable summary link

### Additional Test Coverage
- [ ] `POST /api/summaries` (save summary route)
- [ ] `GET/DELETE /api/summaries/[id]`
- [ ] `POST/PATCH/DELETE /api/cycles`
- [ ] `POST/PATCH/DELETE /api/goals/evaluation` and `/personal`
- [ ] E2E tests with Playwright (signup → checkin → summary flow)
- **Target**: 70%+ statement coverage across all API routes

### Integrations (Future)
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Jira/Linear integration
- [ ] Slack integration
- **Est**: 15+ hours

### Mobile App (React Native)
- [ ] Scaffold with Expo
- [ ] Auth + core features
- [ ] Offline support + push notifications
- **Est**: 40+ hours (Q3 2026)

---

## 📊 Test Coverage Summary (2026-05-28)

| File | Statements | Branches | Functions | Lines |
|------|-----------|---------|-----------|-------|
| `lib/validation.ts` | **100%** | **100%** | **100%** | **100%** |
| `lib/claude.ts` | **100%** | 91% | **100%** | **100%** |
| `lib/logger.ts` | 86% | 68% | 86% | 93% |
| `lib/rate-limit.ts` | 72% | 63% | 67% | 72% |
| `api/entries` | 90% | 90% | **100%** | 90% |
| `api/entries/[id]` | 86% | 92% | **100%** | 86% |
| `api/prompts` | 93% | 59% | **100%** | 93% |
| `api/summary` | 90% | 68% | **100%** | 90% |

**Total tests: 85 passing, 0 failing**

---

## Definition of Done
- Code written and tested locally
- Tests pass (`npm run test:coverage`)
- No TypeScript errors (`npm run type-check`)
- Merged to main
