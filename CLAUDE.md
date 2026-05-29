# EvalCap – Claude Code Context

## Project Overview
EvalCap is a performance review journaling app for individual contributors.
Users do smart daily/weekly check-ins and generate AI-powered performance review summaries before their eval sessions.

## Architecture
- **Monorepo** using Turborepo
- `apps/web` — Next.js 15 web app (primary product)
- `apps/mobile` — React Native app (future, not started)
- `packages/shared` — shared types and utilities

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database + Auth**: Supabase (PostgreSQL + Row Level Security)
- **AI**: Anthropic Claude API (`claude-sonnet-4-6`)
- **Styling**: Tailwind CSS
- **Language**: TypeScript (strict mode)
- **Deployment**: Vercel

## Project Structure
```
apps/web/src/
├── app/
│   ├── api/          # Server-side API routes (Claude API calls go here)
│   ├── auth/         # Login and signup pages
│   ├── dashboard/    # Main dashboard
│   ├── checkin/      # Journal check-in with smart prompts
│   ├── history/      # Past journal entries
│   └── summary/      # Generate performance review summaries
├── lib/
│   ├── claude.ts     # All Claude API logic (server-side only)
│   └── supabase/     # Supabase client (client.ts and server.ts)
├── types/
│   └── database.ts   # TypeScript types mirroring Supabase schema
```

## Key Rules

### Security
- NEVER expose `ANTHROPIC_API_KEY` to the client — it must only be used in `src/app/api/` routes or `src/lib/claude.ts`
- All Supabase queries must rely on Row Level Security (RLS) — never bypass with service role key on client
- All API routes must verify `supabase.auth.getUser()` before doing anything

### AI Behavior (CRITICAL)
- Claude generates prompts and summaries — it must NEVER exaggerate or inflate achievements
- Summaries are compilations and rewrites of real journal entries only
- This is a trust-critical feature — honest output protects the user's credibility with their manager

### Code Style
- Use TypeScript strict mode — no `any` types
- Use ES modules (`import/export`), not CommonJS
- Use `async/await`, not `.then()` chains
- Server components by default; add `'use client'` only when needed (interactivity/hooks)
- Keep API routes thin — business logic goes in `src/lib/`

### Database
- Schema is in `docs/schema.sql`
- Types are in `src/types/database.ts` — update both when schema changes
- Always use RLS policies — no admin bypasses
- `journal_entries.check_in_type` must be `'daily'` or `'weekly'`

## Environment Variables
Required in `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=       # Server-side only, never NEXT_PUBLIC_
NEXT_PUBLIC_APP_URL=
```

## API Endpoints
| Route | Method | Description |
|---|---|---|
| `/api/prompts` | POST | Generate smart check-in prompts using recent entries |
| `/api/summary` | POST | Generate performance review summary from entries |

## MVP Scope (build these first)
1. Auth (Supabase email/password login + signup)
2. Journal check-in page with AI prompts
3. History page (list of past entries)
4. Summary generation page
5. Basic dashboard

## Out of Scope for MVP
- Mobile app (React Native — future)
- Integrations (Jira, Slack, calendar)
- Team/manager features
- Sharing summaries
- Export to PDF

## Planning Documents

| Document | Description |
|---|---|
| [`TASKS.md`](TASKS.md) | Feature backlog and completion status for the web app |
| [`TASKS-ADMIN.md`](TASKS-ADMIN.md) | Internal admin interface spec — user management, credits, audit log (implementation pending) |
| [`TASKS-MOBILE.md`](TASKS-MOBILE.md) | React Native / Expo mobile app spec — auth, check-in, push notifications, offline (Q3 2026) |

## Commands
```bash
npm run dev          # Start all apps in dev mode
npm run build        # Build all apps
npm run lint         # Lint all apps
```

To run web only:
```bash
cd apps/web && npm run dev
```
