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

### 1. Verify MVP Features Work End-to-End
- [ ] Test signup → login → checkin creation flow
- [ ] Test smart prompt generation (is Haiku producing useful prompts?)
- [ ] Test summary generation (quality check with new Haiku model)
- [ ] Confirm all API routes return proper error handling
- [ ] Manual test: check RLS policies prevent unauthorized data access
- **Why**: New model change (Sonnet → Haiku) may impact prompt/summary quality. Need confirmation before declaring MVP stable.
- **Time Est**: 4 hours

### 2. Input Validation Hardening
- [ ] Add validation to `/api/prompts` endpoint (entries array validation)
- [ ] Add validation to `/api/summary` endpoint (entries, timeframe, userInstructions)
- [ ] Add validation to all auth-protected API routes
- [ ] Sanitize user inputs before passing to Claude API (prevent prompt injection)
- [ ] Return HTTP 400 with clear error messages for invalid input
- **Why**: Security boundary — user input is untrusted.
- **Time Est**: 3 hours

### 3. Error Boundary & 404 Handling
- [ ] Create error boundary component (catch React errors, show fallback UI)
- [ ] Create 404 not-found page
- [ ] Ensure all error states display user-friendly messages (not raw errors)
- [ ] Test: navigate to invalid routes, trigger API errors
- **Why**: Poor UX and leaks error details to users.
- **Time Est**: 2 hours

### 4. Rate Limiting on API Routes
- [ ] Add rate limiting middleware (e.g., Upstash Redis or simple in-memory)
- [ ] Limit `/api/prompts` to 10 req/min per user
- [ ] Limit `/api/summary` to 5 req/min per user (expensive)
- [ ] Return HTTP 429 when limit exceeded
- [ ] **Why**: Prevent abuse of Claude API (cost and quotas).
- **Time Est**: 2 hours

### 5. Unit Tests for Core Logic
- [ ] Add Jest + testing setup to `apps/web`
- [ ] Test `generateSmartPrompts()` (mock Anthropic API, verify output structure)
- [ ] Test `generateSummary()` (mock Claude, verify text extraction)
- [ ] Test input validators (entries, timeframe, userInstructions)
- [ ] Test RLS-safe queries (ensure user isolation)
- [ ] Coverage target: 80% for `src/lib/` and `src/app/api/`
- **Why**: Catch regressions early, especially critical with Haiku model.
- **Time Est**: 4 hours

### 6. E2E Tests with Playwright
- [ ] Setup Playwright (testing framework + headless browser)
- [ ] Test: Signup → create user in database
- [ ] Test: Login → redirect to dashboard
- [ ] Test: Checkin flow (select type → generate prompts → save entry)
- [ ] Test: History page loads entries
- [ ] Test: Summary generation works end-to-end
- [ ] Test: Logout and auth redirect
- [ ] Test: Invalid input rejected gracefully
- [ ] Run in CI on every merge
- **Why**: Catch integration issues that unit tests miss.
- **Time Est**: 6 hours

---

## 🟡 P1: High Priority (This Week if Time, Next Week Otherwise)

### 7. Security Headers & CSP
- [ ] Add HSTS, X-Frame-Options, X-Content-Type-Options headers
- [ ] Add Content-Security-Policy header (block inline scripts, unsafe styles)
- [ ] Test with browser dev tools
- **Why**: OWASP standard hardening.
- **Time Est**: 1 hour

### 8. API Error Logging (Already Have Logger, Just Wire It)
- [ ] Ensure all `/api/*` routes log errors with context (user, endpoint, error details)
- [ ] Structured logging format (JSON) for easy parsing in production
- [ ] Log successful API calls (prompts generated, summaries created) at info level
- **Why**: Production debugging and monitoring.
- **Time Est**: 1 hour

### 9. Profile Page & API Endpoints
- [ ] Create `/profile` page UI (display user name, email, stats)
- [ ] Create `/api/profile` GET endpoint (return user profile + stats)
- [ ] Update `/api/profile` PATCH endpoint (edit name, title, background)
- [ ] Update `profiles` table schema (add `job_title`, `department`, `manager_name`)
- [ ] Update `src/types/database.ts` with new profile fields
- **Why**: MVP needs profile data for context in AI prompts/summaries.
- **Time Est**: 4 hours

### 10. Navigation Sidebar/Header Updates
- [ ] Add Profile link to nav
- [ ] Add Settings link (prepare for future use)
- [ ] Add Account link (prepare for future use)
- [ ] Responsive nav for mobile screens
- [ ] Active route highlighting
- **Why**: Core UX — users need to navigate between pages.
- **Time Est**: 2 hours

### 11. Loading States & Skeleton Screens
- [ ] Add loading skeleton to checkin page (while generating prompts)
- [ ] Add loading state to history page (while fetching entries)
- [ ] Add loading state to summary page (while generating summary)
- [ ] Add spinner/toast for async operations
- **Why**: Smooth UX — users need feedback that something is happening.
- **Time Est**: 3 hours

### 12. Empty States
- [ ] Dashboard: "No entries yet. Start your first check-in" (with CTA)
- [ ] History: "No entries. Create your first check-in" (with CTA)
- [ ] Summary: "No entries in this timeframe. Create some check-ins first"
- **Why**: UX — guides first-time users.
- **Time Est**: 2 hours

---

## 🟠 P2: Medium Priority (Next Sprint, ~1-2 Weeks)

### 13. Edit & Delete Check-Ins
- [ ] Add `/history/[id]/edit` page
- [ ] Wire up `PATCH /api/entries/[id]` endpoint
- [ ] Wire up `DELETE /api/entries/[id]` endpoint (with soft delete or hard delete?)
- [ ] Add confirmation dialog before delete
- [ ] Test RLS policies work for edit/delete
- **Why**: Users need to fix typos or change entries.
- **Time Est**: 4 hours

### 14. Save & View Summaries
- [ ] Create `summaries` table (if not exists) with: user_id, content, created_at, timeframe, user_instructions
- [ ] Update types in `src/types/database.ts`
- [ ] Wire `POST /api/summary` to save generated summary
- [ ] Create `/summaries` page (list all saved summaries)
- [ ] Create `/summaries/[id]` page (view single summary, allow edit/regenerate/copy)
- [ ] Add copy-to-clipboard button
- **Why**: Core feature — users want to preserve summaries, not regenerate each time.
- **Time Est**: 5 hours

### 15. Onboarding Flow
- [ ] Detect first-time user (no entries, maybe a flag in profiles table)
- [ ] Show onboarding carousel/modal on first login
- [ ] Explain: what is EvalCap, how to use it, why journaling helps
- [ ] Skip/done button
- [ ] Don't show again after completion
- **Why**: First-time UX — helps users understand the product.
- **Time Est**: 3 hours

### 16. Check-In Type Preference (Settings)
- [ ] Create `/settings` page
- [ ] Option to set default check-in type (daily vs weekly)
- [ ] Option for theme (light/dark mode) — wire to Tailwind
- [ ] Wire `GET/PATCH /api/settings` endpoints
- [ ] Update `profiles` table to store these preferences
- **Why**: User customization, improves retention.
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