# EvalCap MVP TODO

## User Profile (`/profile`)
- [ ] Profile page UI
- [ ] Edit name/title
- [ ] Resume/background field
- [ ] View profile stats (entry count, streak, etc.)
- [ ] API endpoint: `GET /api/profile`
- [ ] API endpoint: `PATCH /api/profile`

## Goals System

### Evaluation Goals (`/goals/evaluation`)
- [ ] Create evaluation goal
- [ ] Edit/delete evaluation goal
- [ ] Link goals to journal entries (tagging)
- [ ] Progress tracking (% complete)
- [ ] Filter summary generation by goal
- [ ] Database: `evaluation_goals` table
- [ ] Database: `entry_goals` linking table

### Personal Goals (`/goals/personal`)
- [ ] Create personal growth goal (promotion, certification, skill)
- [ ] Set due date and priority
- [ ] Mark goals as complete
- [ ] Use goals as context in AI prompts
- [ ] Use goals as context in summary generation
- [ ] Database: `personal_goals` table

## Account Management (`/account`)
- [ ] Change password
- [ ] Change email
- [ ] Delete account
- [ ] Export data (GDPR compliance)

## Settings (`/settings`)
- [ ] Default check-in type preference
- [ ] Notification settings
- [ ] Theme toggle (light/dark)

## Database Schema
- [ ] Update `profiles`: add `job_title`, `department`, `manager_name`
- [ ] New `resumes` table: `user_id`, `content`, `updated_at`
- [ ] New `evaluation_goals` table
- [ ] New `personal_goals` table
- [ ] New `entry_goals` linking table
- [ ] Update `src/types/database.ts` with new types

## Journal Entry Enhancements
- [ ] Edit previous check-in (`/history/[id]/edit`)
- [ ] Delete check-in with confirmation
- [ ] Rich text editor for entries

## Summary Enhancements
- [ ] View saved summaries (`/summaries`)
- [ ] View single summary (`/summaries/[id]`)
- [ ] Re-edit/regenerate summary
- [ ] Copy summary to clipboard
- [ ] Export summary as markdown

## Performance Cycles (Terms)
- [ ] Create new performance cycle (`/cycles`)
- [ ] Define cycle name: "Q1 2026", "H1 2026", "FY2026"
- [ ] Set cycle start/end dates
- [ ] Archive old cycle (freeze entries, preserve summaries)
- [ ] Auto-archive when starting new cycle (optional)
- [ ] View cycle history
- [ ] **Multiple active cycles** — can have overlapping cycles (e.g., "Q1 2026" + "H1 2026")
- [ ] Tag entries with multiple cycles
- [ ] Generate summary across **multiple selected cycles**
- [ ] **Duplicate cycle** — clone a cycle with new name/dates (useful for recurring quarters)
- [ ] **Goals tied to cycles** — evaluation goals belong to a specific cycle
- [ ] Carry over incomplete goals when duplicating a cycle
- [ ] Database: `performance_cycles` table
- [ ] Database: `entry_cycles` linking table (many-to-many)
- [ ] Database: `summary_cycles` linking table (which cycles were included)
- [ ] Update `evaluation_goals`: add `cycle_id` foreign key

## Navigation Updates
- [ ] Add Profile link to Nav
- [ ] Add Goals section to Nav
- [ ] Add Cycles/Periods link to Nav
- [ ] Add Account link (dropdown or section)
- [ ] Add Settings link

## Mobile App (React Native / Expo)

### Auth
- [ ] Login screen
- [ ] Signup screen
- [ ] Password reset
- [ ] Biometric auth (Face ID / Touch ID / fingerprint)
- [ ] Token refresh handling
- [ ] Auto-redirect to dashboard if logged in

### Core Features
- [ ] Dashboard view (stats, recent entries, summaries)
- [ ] Check-in creation (daily/weekly)
- [ ] View history (list of entries)
- [ ] Edit/delete entries
- [ ] Generate summary
- [ ] View saved summaries

### Offline Support
- [ ] Cache entries locally (AsyncStorage/SQLite)
- [ ] Queue check-ins when offline
- [ ] Sync when connection restored
- [ ] Show offline indicator

### Mobile-Specific
- [ ] Push notifications (reminders for check-ins)
- [ ] Deep linking (shared summaries)
- [ ] Share summary to other apps (email, Slack, etc.)
- [ ] Voice-to-text for quick check-ins

---

# Pre-Launch (Required for Production/Marketing)

## Legal & Compliance
- [ ] Terms of Service page (`/terms`)
- [ ] Privacy Policy page (`/privacy`)
- [ ] Cookie consent banner
- [ ] Data retention policy documentation

## Trust & Safety
- [ ] Rate limiting on API routes (prevent abuse)
- [ ] Input validation/sanitization hardening
- [ ] Content Security Policy (CSP) headers
- [ ] Security headers (HSTS, X-Frame-Options, X-Content-Type-Options)

## User Experience
- [ ] Onboarding flow for first-time users
- [ ] Empty states for all pages (no entries, no cycles, etc.)
- [ ] Loading states/skeleton screens
- [ ] Error boundaries (prevent app crashes)
- [ ] 404 Not Found page
- [ ] Mobile responsiveness audit
- [ ] Form validation with user-friendly error messages

## Marketing & Launch
- [ ] Landing page with SEO meta tags
- [ ] OG images for social sharing
- [ ] Pricing page (if freemium)
- [ ] Help/FAQ documentation (`/help`)
- [ ] Feedback/support mechanism (chat, email, or form)
- [ ] Analytics integration (Plausible, PostHog, or Google Analytics)
- [ ] Waitlist or email capture (pre-launch)

## Operations & Reliability
- [ ] Database backup strategy
- [ ] Error monitoring (Sentry)
- [ ] Health check endpoint (`/api/health`)
- [ ] Environment validation on startup
- [ ] Logging aggregation for production debugging
