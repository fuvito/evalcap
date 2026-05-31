# EvalCap Admin Interface — Task Specification

## Overview

Internal web app for support and admin operations. Not user-facing.
Access restricted to internal team via role check (`profiles.role = 'admin'`) or a separate auth layer.

**Likely location:** `/admin/*` section inside `apps/web`, behind middleware that checks admin role.
**Alternative:** Separate `apps/admin` in the monorepo if access control needs to be fully isolated.

---

## Function List

### 1. User Management

| Function | Description | Priority |
|---|---|---|
| User list | Paginated table: email, name, job title, joined date, last active, entry count, status | MVP |
| User search | Search by email or name | MVP |
| User detail view | Full profile: stats, recent entries, cycles, goals, subscription plan/status, auth events | MVP |
| Suspend user | Block login without deleting account. Suspended users see a "account paused" message | MVP |
| Unsuspend user | Restore access | MVP |
| Delete user | Hard delete with confirmation — cascades all data | MVP |
| Add user manually | Create account without going through signup flow (useful for onboarding enterprise users) | P2 |
| Edit user profile | Correct name, email, job title on behalf of user | P2 |
| Impersonate user | "View as this user" for support debugging — read-only, logged in audit trail | P3 |

---

### 2. Subscriptions

Users are on a plan: `free` or `pro`. Subscriptions are managed via Stripe; the admin panel provides visibility and override capability for support workflows.

| Function | Description | Priority |
|---|---|---|
| View subscription status | Current plan, billing status, renewal date for each user | MVP |
| Override plan | Manually set a user's plan (e.g. comping a pro account for support goodwill) | MVP |
| Cancel subscription | Cancel on behalf of user at period end | P2 |
| Subscription history | Log of plan changes and billing events per user | P2 |
| Revenue overview | Active pro subscribers, MRR estimate, churn this month | P2 |
| Bulk plan change | Set plan for a cohort of users (e.g. all beta testers → pro) | P3 |

> **Note:** Requires a `subscriptions` table (user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_end). Schema added. Stripe webhooks keep status in sync; admin overrides write directly via service role.

---

### 3. Content & Data

| Function | Description | Priority |
|---|---|---|
| View user entries | Read user's journal entries for support context (visible only to admins, logged) | MVP |
| View user summaries | Read generated summaries | MVP |
| Delete specific entry | Remove a single entry at user request | P2 |
| Export user data | Trigger a full data export for a user (same as `/api/account/export`) | P2 |
| Wipe user data | Delete all entries/summaries/goals but keep account | P3 |

---

### 4. AI & Usage Monitoring

| Function | Description | Priority |
|---|---|---|
| Usage dashboard | Total AI calls today / this week / this month. Cost estimate. | MVP |
| Per-user usage | How many prompts/summaries a user has generated | P2 |
| Rate limit overrides | Temporarily raise or remove rate limits for a specific user | P2 |
| Token usage log | Approximate token counts per AI call (if logged) | P3 |

---

### 5. System Health

| Function | Description | Priority |
|---|---|---|
| Health status | Live check of Supabase connection, Anthropic API, app uptime | MVP |
| Error log | Recent server errors pulled from Sentry or internal log table | MVP |
| Active user count | Users active in last 24h / 7d / 30d | P2 |
| Signup trend | Daily/weekly new signups chart | P2 |
| Check-in frequency | Entries created per day — signals engagement health | P3 |

---

### 6. Support Tools

| Function | Description | Priority |
|---|---|---|
| User activity timeline | Chronological view of a user's actions: signups, logins, entries, summaries | MVP |
| Internal notes | Attach private notes to a user account (visible only in admin panel) | P2 |
| Auth event log | Login attempts, password resets, OAuth events for a user | P2 |
| Send email to user | Trigger a transactional email (support reply, notice) from admin panel | P3 |

---

### 7. Audit Log

Every admin action is logged to an `admin_audit_log` table. Immutable, append-only.

| Field | Description |
|---|---|
| `id` | UUID |
| `admin_id` | Which admin performed the action |
| `action` | e.g. `suspend_user`, `add_credits`, `delete_entry` |
| `target_user_id` | User affected |
| `detail` | JSON payload (e.g. `{ "credits_added": 50 }`) |
| `created_at` | Timestamp |

Admin panel features:
- Filter audit log by admin, action type, date range
- Export audit log as CSV

---

## UI Approach

- Clean data-dense tables, not cards — admins scan many rows
- Confirmation dialogs for destructive actions (suspend, delete, deduct credits)
- Toast notifications for success/error
- Every destructive action shows what will happen before confirming
- Mobile not required — internal tool, desktop only

---

## Schema Changes Needed

| Table | Purpose |
|---|---|
| `profiles.role` | Add `role` column (`'user'` \| `'admin'`), default `'user'` |
| `profiles.status` | Add `status` column (`'active'` \| `'suspended'`), default `'active'` |
| `subscriptions` | `user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, cancelled_at` |
| `admin_notes` | `user_id, admin_id, body, created_at` |
| `admin_audit_log` | See Audit Log section above |

---

## Access Control

- Middleware checks `profiles.role = 'admin'` for all `/admin/*` routes
- Service role key used for admin queries (bypasses RLS intentionally)
- Admin users must be created manually in the database — no self-service admin signup
- Impersonate actions use a separate read-only client, never a write client

---

## MVP Scope (implement first)

1. User list with search + status badge
2. User detail view (profile + stats + recent entries)
3. Suspend / unsuspend user
4. View subscription status
5. Override plan (manual pro grant)
6. Usage dashboard (AI calls, cost estimate)
7. System health check
8. Audit log (view only)

Everything else is P2/P3 — build once the core ops workflow is stable.
