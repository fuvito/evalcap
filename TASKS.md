# EvalCap Task Prioritization (2026-05-27)

## Summary
MVP features (auth, checkin, history, summary, dashboard) appear complete. This document prioritizes work to stabilize, harden, test, and extend the product.

**Key Focus Areas**:
1. **Verification & Testing** — Unit + E2E tests to catch regressions with new Haiku model
2. **Security Hardening** — Input validation, rate limiting, headers
3. **UX Polish** — Loading states, empty states, error handling
4. **Feature Completeness** — Profile, edit/delete entries, save summaries

---

## 🔴 P0: Critical (Must Complete This Week)

### 1. Verify MVP Features Work End-to-End ✅
- [x] Test signup → login → checkin creation flow
- [x] Test smart prompt generation (is Haiku producing useful prompts?)
- [x] Test summary generation (quality check with new Haiku model)
- [x] Confirm all API routes return proper error handling
- [x] Manual test: check RLS policies prevent unauthorized data access
- **Status**: Complete — 25 E2E tests passing, Haiku model verified in production

### 2. Input Validation Hardening ✅
- [x] Add validation to `/api/prompts` endpoint (entries array validation)
- [x] Add validation to `/api/summary` endpoint (entries, timeframe, userInstructions)
- [x] Add validation to all auth-protected API routes
- [x] Sanitize user inputs before passing to Claude API (prevent prompt injection)
- [x] Return HTTP 400 with clear error messages for invalid input
- **Status**: Complete — `lib/validation.ts` created with 12+ tests

### 3. Error Boundary & 404 Handling ✅
- [x] Create error boundary component (catch React errors, show fallback UI)
- [x] Create 404 not-found page
- [x] Ensure all error states display user-friendly messages (not raw errors)
- [x] Test: navigate to invalid routes, trigger API errors
- **Status**: Complete — 404 page implemented, 7 error handling tests passing

### 4. Rate Limiting on API Routes ✅
- [x] Add rate limiting middleware (e.g., Upstash Redis or simple in-memory)
- [x] Limit `/api/prompts` to 10 req/min per user
- [x] Limit `/api/summary` to 5 req/min per user (expensive)
- [x] Return HTTP 429 when limit exceeded
- **Status**: Complete — `lib/rate-limit.ts` in-memory implementation, 14 tests

### 5. Unit Tests for Core Logic ✅
- [x] Add Jest + testing setup to `apps/web`
- [x] Test `generateSmartPrompts()` (mock Anthropic API, verify output structure)
- [x] Test `generateSummary()` (mock Claude, verify text extraction)
- [x] Test input validators (entries, timeframe, userInstructions)
- [x] Test RLS-safe queries (ensure user isolation)
- [x] Coverage target: 80% for `src/lib/` and `src/app/api/`
- **Status**: Complete — 33 unit tests written and passing

### 6. E2E Tests with Playwright ✅
- [x] Setup Playwright (testing framework + headless browser)
- [x] Test: Signup → create user in database
- [x] Test: Login → redirect to dashboard
- [x] Test: Checkin flow (select type → generate prompts → save entry)
- [x] Test: History page loads entries
- [x] Test: Summary generation works end-to-end
- [x] Test: Logout and auth redirect
- [x] Test: Invalid input rejected gracefully
- [x] Run in CI on every merge
- **Status**: Complete — 25 E2E tests, 100% passing

---

## 🟡 P1: High Priority (This Week if Time, Next Week Otherwise)

### 7. Security Headers & CSP ✅
- [x] Add HSTS, X-Frame-Options, X-Content-Type-Options headers
- [x] Add Content-Security-Policy header (block inline scripts, unsafe styles)
- [x] Test with browser dev tools
- **Status**: Complete — OWASP headers implemented in `next.config.mjs`

### 8. API Error Logging ✅
- [x] Ensure all `/api/*` routes log errors with context (user, endpoint, error details)
- [x] Structured logging format (JSON) for easy parsing in production
- [x] Log successful API calls (prompts generated, summaries created) at info level
- **Status**: Complete — logging wired into all API routes

### 9. Profile Page & API Endpoints ✅
- [x] Create `/profile` page UI (display user name, email, stats)
- [x] Create `/api/profile` GET endpoint (return user profile + stats)
- [x] Update `/api/profile` PATCH endpoint (edit name, title, background)
- [x] Update `profiles` table schema (add `job_title`, `department`, `manager_name`)
- [x] Update `src/types/database.ts` with new profile fields
- **Status**: Complete — Profile page and API endpoints fully implemented

### 10. Navigation Sidebar/Header Updates ✅
- [x] Add Profile link to nav
- [x] Add Settings link (prepare for future use)
- [x] Add Account link (prepare for future use)
- [x] Responsive nav for mobile screens
- [x] Active route highlighting
- **Status**: Complete — Navigation updated with account menu and active route highlighting

### 11. Loading States & Skeleton Screens ✅
- [x] Add loading skeleton to checkin page (while generating prompts)
- [x] Add loading state to history page (while fetching entries)
- [x] Add loading state to summary page (while generating summary)
- [x] Add spinner/toast for async operations
- **Status**: Complete — Skeleton component library created and integrated

### 12. Empty States ✅
- [x] Dashboard: "No entries yet. Start your first check-in" (with CTA)
- [x] History: "No entries. Create your first check-in" (with CTA)
- [x] Summary: "No entries in this timeframe. Create some check-ins first"
- [x] Profile: Enhance empty state messaging with first-time user guidance
- **Status**: Complete — Enhanced empty states on all pages with emojis, descriptions, and CTAs

---

## 🟠 P2: Medium Priority (Next Sprint, ~1-2 Weeks)

### 13. Edit & Delete Check-Ins ✅
- [x] Add `/history/[id]/edit` page (client component)
- [x] Wire up `PATCH /api/entries/[id]` endpoint (update content, preserve metadata)
- [x] Wire up `DELETE /api/entries/[id]` endpoint (hard delete for MVP)
- [x] Add GET `/api/entries/[id]` endpoint (fetch single entry)
- [x] Add confirmation dialog before delete
- [x] Test RLS policies work for edit/delete (user can only edit/delete own entries)
- [x] Update history page to show edit/delete buttons (hover reveal)
- **Status**: Complete — Edit/delete with inline confirmation and RLS protection

### 14. Save & View Summaries ✅
- [x] Create `/summaries` page (list all saved summaries)
- [x] Create `/summaries/[id]` page (view single summary)
- [x] Add delete button with confirmation
- [x] Add copy-to-clipboard button
- [x] Add regenerate button to reuse timeframe
- [x] Add Summaries link to navigation
- [x] POST /api/summary already saves to database
- [x] Types in database.ts (already done)
- **Status**: Complete — Full summary management with view, delete, copy, regenerate

### 15. Onboarding Flow ✅
- [x] Detect first-time user (no entries detected on dashboard)
- [x] Show onboarding carousel/modal on first login
- [x] Step 1: Welcome message with Get Started CTA
- [x] Step 2: How it works (check-ins, prompts, summaries)
- [x] Step 3: Why journaling helps (benefits explanation)
- [x] Skip button to bypass onboarding
- [x] Don't show again using localStorage dismissal flag
- [x] Navigate to check-in page on completion
- **Status**: Complete — 3-step onboarding flow with skip option

### 16. Check-In Type Preference (Settings) (IN PROGRESS)
- [ ] Create `/settings` page (client component with form)
- [ ] Option to set default check-in type (daily vs weekly)
- [ ] Add preference field to profiles table
- [ ] Wire `GET/PATCH /api/settings` endpoints (or reuse /api/profile)
- [ ] Save default preference to profiles table
- [ ] Use preference in check-in page default selection
- [ ] Add visual feedback when preference is saved
- **Why**: User customization, improves retention.
- **Status**: Starting implementation
- **Time Est**: 3 hours

### 17. Mobile Responsiveness Audit
- [ ] Test all pages on mobile (iOS Safari, Android Chrome)
- [ ] Fix layout issues (buttons, forms, text sizing)
- [ ] Ensure touch-friendly tap targets (44x44 min)
- [ ] Test navigation on mobile (hamburger menu if needed)
- **Why**: Users may access app on phone during work day.
- **Time Est**: 4 hours

---

## 🔵 P3: Low Priority (Roadmap, Nice-to-Have)

### 18. Advanced Features (Beyond MVP)

#### Evaluation Goals System
- [ ] Create `evaluation_goals` table
- [ ] Create `entry_goals` linking table
- [ ] UI: `/goals/evaluation` — create/edit/delete evaluation goals
- [ ] Link goals to entries when creating/editing check-in
- [ ] Summary generation: filter by goal
- **Est**: 8 hours

#### Personal Goals System
- [ ] Create `personal_goals` table
- [ ] UI: `/goals/personal` — create/edit/delete personal growth goals
- [ ] Set due date, priority, mark complete
- [ ] Use goals as context in AI prompts
- **Est**: 6 hours

#### Performance Cycles/Terms
- [ ] Create `performance_cycles` table (Q1 2026, H1 2026, etc.)
- [ ] Create `entry_cycles`, `summary_cycles` linking tables
- [ ] UI: `/cycles` — create/edit/duplicate/archive cycles
- [ ] Multi-cycle summary generation
- [ ] Update `evaluation_goals` with cycle_id FK
- **Est**: 10 hours

#### Account Management
- [ ] Change password
- [ ] Change email
- [ ] Delete account (cascade delete user data)
- [ ] Export data as JSON (GDPR)
- **Est**: 5 hours

### 19. Pre-Launch Legal & Marketing

#### Legal Pages
- [ ] Terms of Service (`/terms`)
- [ ] Privacy Policy (`/privacy`)
- [ ] Cookie consent banner
- **Est**: 4 hours

#### Marketing & Launch
- [ ] Landing page with SEO
- [ ] OG images for social sharing
- [ ] Help/FAQ documentation
- [ ] Waitlist or email capture
- **Est**: 6 hours

### 20. Integrations (Future)
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Jira/Linear integration (auto-suggest entries from tickets)
- [ ] Slack integration (share summaries, reminders)
- [ ] PDF export
- **Est**: 15+ hours (much later)

### 21. Mobile App (React Native)
- [ ] Scaffold React Native with Expo
- [ ] Auth screens (login, signup, password reset)
- [ ] Core features: checkin, history, summary
- [ ] Offline support (cache with SQLite/AsyncStorage)
- [ ] Push notifications
- [ ] Biometric auth (Face ID, Touch ID)
- **Est**: 40+ hours (Q3 2026 or later)

---

## 📊 Priority Summary

| Phase | Tasks | Estimated Time | Owner |
|-------|-------|-----------------|-------|
| **P0: Critical** | 1-6 | ~21 hours | TBD |
| **P1: High** | 7-12 | ~16 hours | TBD |
| **P2: Medium** | 13-17 | ~19 hours | TBD |
| **P3: Low** | 18-21 | 40+ hours | TBD |

**Total P0+P1**: ~37 hours (achievable in 1-2 weeks)
**Total P0+P1+P2**: ~56 hours (achievable in 2-3 weeks)

---

## Notes on Model Change (Sonnet → Haiku)

We just switched from `claude-sonnet-4-6` to `claude-haiku-4-5-20251001`.

**Pros**: Faster, cheaper
**Cons**: Potentially lower quality prompts/summaries

**Action**: After P0 #1 (verify MVP), evaluate whether Haiku is sufficient for this use case. If summaries are mediocre, consider:
- Reverting to Sonnet for summary generation only
- Fine-tuning Haiku prompts to be more explicit
- Increasing max_tokens for Haiku to compensate

---

## Definition of Done

A task is complete when:
- [ ] Code is written and tested locally
- [ ] Tests pass (if applicable)
- [ ] Code review approved
- [ ] Merged to main
- [ ] Deployed to staging (or verified in dev)
- [ ] Acceptance criteria met