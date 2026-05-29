# EvalCap Mobile App — Task Specification

## Overview

React Native app (Expo) for iOS and Android. Feature-parity with the web app for core flows.
Mobile-specific additions: push notifications, offline drafts, biometric auth, home screen widget.

**Location:** `apps/mobile` in the monorepo (scaffold not yet started).
**Target:** Q3 2026. Estimate: 40+ hours.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Expo SDK 52+ (managed workflow) | EAS Build for distribution |
| Navigation | Expo Router (file-based, mirrors web) | Tab + stack layout |
| Auth | Supabase JS client (`@supabase/supabase-js`) | Same project as web |
| Storage | AsyncStorage + expo-secure-store | Tokens in SecureStore |
| Styling | NativeWind (Tailwind for RN) | Shared design tokens |
| State | React Query (TanStack) | Cache + background sync |
| Notifications | expo-notifications | Push via Supabase Edge Function or Expo push service |
| Offline | expo-sqlite or MMKV | Draft entries survive no-connection |
| AI calls | Hits same `/api/*` routes on the web backend | No direct Anthropic calls from mobile |

---

## Shared Package

`packages/shared` should hold:
- TypeScript types (`database.ts`, entry/summary types)
- Validation helpers (`validateEntry`, `sanitizeText`)
- Streak calculation (`calculateStreak` from `lib/streak.ts` — already pure TS, no DOM)
- API client helpers (typed fetch wrappers)

This avoids duplicating logic between `apps/web` and `apps/mobile`.

---

## Function List

### 1. Auth

| Function | Description | Priority |
|---|---|---|
| Email/password login | Same Supabase auth flow as web | MVP |
| Email/password signup | With job title field | MVP |
| Google OAuth | `expo-auth-session` + Supabase OAuth | MVP |
| Biometric unlock | Face ID / fingerprint via `expo-local-authentication` — skips re-entry after app background | P2 |
| Forgot / reset password | Deep link from email → reset screen | P2 |
| Persistent session | Token stored in `expo-secure-store`, auto-refresh | MVP |
| Sign out | Clear token + navigate to login | MVP |

---

### 2. Check-In

| Function | Description | Priority |
|---|---|---|
| Daily check-in | Multi-question form, same prompts as web | MVP |
| Weekly check-in | Longer reflection form | MVP |
| AI smart prompts | Calls `/api/prompts`, shown above the text area | MVP |
| Draft save | Auto-save in progress entry to local storage — survives app close | P2 |
| Offline draft | Queue entry locally when offline, sync on reconnect | P2 |
| Check-in reminder | Push notification — configurable time (default: Fri 4pm) | P2 |

---

### 3. History

| Function | Description | Priority |
|---|---|---|
| Entry list | Paginated, grouped by week | MVP |
| Entry detail | Full text view | MVP |
| Edit entry | Inline edit with save | P2 |
| Delete entry | Swipe-to-delete with confirmation | P2 |
| Search | Keyword search (client-side filter, same logic as web) | P2 |
| Date filter | Filter by date range | P2 |

---

### 4. Summary

| Function | Description | Priority |
|---|---|---|
| Generate summary | Date range picker → calls `/api/summary` | MVP |
| View saved summaries | List + detail view | MVP |
| Copy to clipboard | One-tap copy of summary text | MVP |
| Delete summary | With confirmation | P2 |
| Share sheet | iOS/Android share to notes, email, etc. | P2 |

---

### 5. Dashboard

| Function | Description | Priority |
|---|---|---|
| Stats overview | Entry count, current cycle, streak, last check-in | MVP |
| Active cycle display | Name + date range | MVP |
| Streak widget | Same ISO-week streak as web | MVP |
| Goals snapshot | Top 3 active goals | P2 |
| Nudge banner | "No check-in this week" prompt | P2 |

---

### 6. Cycles & Goals

| Function | Description | Priority |
|---|---|---|
| View cycles | List of performance cycles | P2 |
| Create/edit cycle | Form with name, start, end date | P2 |
| View goals | Evaluation + personal goals list | P2 |
| Create/edit goal | Title, description, type | P2 |

---

### 7. Profile & Settings

| Function | Description | Priority |
|---|---|---|
| View / edit profile | Name, job title | MVP |
| Notification settings | Enable/disable, set reminder time | P2 |
| Default check-in type | Daily or weekly preference | P2 |
| Theme | System / light / dark | P2 |
| Export data | Triggers `/api/account/export`, share sheet for JSON | P3 |
| Delete account | Calls `/api/account` DELETE, clears local data | P3 |

---

### 8. Push Notifications

| Function | Description | Priority |
|---|---|---|
| Weekly check-in reminder | "Time to reflect — your weekly check-in is waiting" | P2 |
| Streak at-risk nudge | "You haven't checked in this week yet" — Friday afternoon | P2 |
| Summary ready (if async) | If summary generation is moved to a background job | P3 |

Push tokens registered via `expo-notifications`, stored in `profiles.push_token` column.
Send via Expo Push Service (server-side) or Supabase Edge Function on a schedule.

---

### 9. Home Screen Widget

| Function | Description | Priority |
|---|---|---|
| Streak widget (iOS) | Shows current streak count, taps into check-in | P3 |
| Quick check-in widget (iOS/Android) | Single button deep-link to check-in screen | P3 |

Requires `expo-widgets` or custom native module. Out of scope until P3.

---

## Schema Changes Needed

| Table / Column | Purpose |
|---|---|
| `profiles.push_token` | Expo push token for notifications |
| `profiles.notification_enabled` | Boolean, default `true` |
| `profiles.reminder_time` | Time string e.g. `'16:00'`, default `'16:00'` |
| `offline_drafts` (local only) | SQLite table on device — not synced to Supabase |

---

## MVP Scope (implement first)

1. Expo project scaffold with Expo Router tab layout
2. Auth screens (login, signup) + persistent session
3. Check-in screen with AI prompts
4. History list + detail view
5. Summary generation + view saved summaries
6. Dashboard with stats + streak
7. Profile edit screen
8. EAS Build config for TestFlight / internal Android testing

Everything else is P2/P3 — build once core flows are stable on device.

---

## Shared API Contract

Mobile calls the same API routes as the web app. No mobile-specific backend needed for MVP.

| Route | Usage |
|---|---|
| `/api/prompts` POST | Smart check-in prompts |
| `/api/summary` POST | Generate summary |
| `/api/entries` GET/POST | Fetch + create entries |
| `/api/entries/[id]` PATCH/DELETE | Edit/delete entry |
| `/api/summaries` GET/POST | List + create summaries |
| `/api/profile` GET/PATCH | Profile read/write |
| `/api/cycles` GET/POST | Cycles |
| `/api/goals/evaluation` GET/POST | Evaluation goals |
| `/api/goals/personal` GET/POST | Personal goals |
| `/api/account` DELETE | Delete account |
| `/api/account/export` GET | Export data |

All routes already require a valid Supabase JWT in the `Authorization` header or cookie — mobile sends it as a Bearer token.

---

## Estimated Effort

| Phase | Est. Hours |
|---|---|
| Scaffold + auth + navigation | 6h |
| Check-in + history + summary | 12h |
| Dashboard + cycles + goals | 8h |
| Push notifications | 4h |
| Polish + offline drafts | 6h |
| EAS Build + TestFlight | 4h |
| **Total** | **~40h** |
