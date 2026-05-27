# EvalCap

A performance review journaling app for individual contributors. Do smart daily/weekly check-ins and generate AI-powered performance review summaries before your eval sessions.

## Features

- **Smart Check-ins** — AI-generated prompts based on your recent journal entries
- **Journal History** — Browse and search past entries
- **Performance Summaries** — Generate honest, grounded performance review documents from your actual work
- **Secure by Design** — Row Level Security, no AI key exposure, verified auth on every request

## Architecture

Monorepo using [Turborepo](https://turbo.build/):

```
apps/
  web/           # Next.js 15 web app (primary product)
  mobile/        # React Native app (future)
packages/
  shared/        # Shared types and utilities
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Database + Auth | Supabase (PostgreSQL + RLS) |
| AI | Anthropic Claude API |
| Styling | Tailwind CSS 4 |
| Language | TypeScript (strict mode) |
| Monorepo | Turborepo 2 |

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase project
- Anthropic API key

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
   
   Fill in `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ANTHROPIC_API_KEY=          # Server-side only
   NEXT_PUBLIC_APP_URL=
   ```

3. **Set up database**
   - Run `docs/schema.sql` in your Supabase SQL editor
   - Enable Row Level Security policies

4. **Start development**
   ```bash
   npm run dev
   ```
   
   Web app runs at `http://localhost:3000`

## Development Commands

```bash
npm run dev          # Start all apps in dev mode
npm run build        # Build all apps
npm run lint         # Lint all apps
npm run type-check   # Type-check all apps
```

To run web only:
```bash
cd apps/web && npm run dev
```

## Project Structure

```
apps/web/src/
├── app/
│   ├── api/          # API routes (Claude calls, auth handlers)
│   ├── auth/         # Login and signup
│   ├── dashboard/    # Main dashboard
│   ├── checkin/      # Journal check-in with smart prompts
│   ├── history/      # Past journal entries
│   └── summary/      # Generate performance summaries
├── lib/
│   ├── claude.ts     # Claude API logic (server-side only)
│   └── supabase/     # Supabase clients (client.ts, server.ts)
├── types/
│   └── database.ts   # TypeScript types for Supabase schema
```

## API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/prompts` | POST | Generate smart check-in prompts |
| `/api/summary` | POST | Generate performance review summary |

## Security Rules

- **AI Key Protection** — `ANTHROPIC_API_KEY` never leaves the server
- **RLS Enforcement** — All Supabase queries rely on Row Level Security
- **Auth Verification** — Every API route verifies `supabase.auth.getUser()`

## AI Behavior Guidelines

Claude generates prompts and summaries. It must **never** exaggerate or inflate achievements. Summaries are compilations of real journal entries only — honest output protects the user's credibility with their manager.

## Documentation

- [CLAUDE.md](./CLAUDE.md) — Full development context and rules
- [docs/schema.sql](./docs/schema.sql) — Database schema

## License

MIT
