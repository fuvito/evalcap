# EvalCap – MVP Documentation

## Product Vision
EvalCap helps individual contributors capture their daily/weekly achievements through smart AI-guided journal check-ins, then generates honest, professional performance review summaries before evaluation sessions.

## Core User Flow

```
Sign Up → Daily/Weekly Check-in → AI Smart Prompts → Save Entry
                                        ↓
                              History of Entries
                                        ↓
                          Generate Review Summary
                                        ↓
                          Edit & Refine Summary
                                        ↓
                          Ready for Performance Review
```

## MVP Features

### 1. Authentication
- Email/password sign up and login
- Powered by Supabase Auth
- Auto-create profile on signup

### 2. Smart Check-ins
- User chooses daily or weekly check-in
- AI reads previous entries and generates 3 contextual follow-up prompts
- Example: if user mentioned starting a project last week, AI asks how it went
- User answers prompts in free-form text
- Entry saved to database

### 3. Journal History
- List view of all past check-ins
- Filter by date range or check-in type
- Read individual entries

### 4. Summary Generation
- User selects timeframe (e.g. last 6 months)
- Optional: user adds extra instructions ("focus on the Q2 launch")
- AI compiles and rewrites entries into professional performance review language
- IMPORTANT: No exaggeration — honest, factual, well-written
- User can edit the summary directly
- User can regenerate with different instructions

### 5. Dashboard
- Overview of check-in streak
- Quick stats (total entries, summaries generated)
- Recent entries preview
- CTA to start new check-in or generate summary

## Design Principles
- **Honest AI**: summaries are rewrites, not inventions — user's credibility matters
- **Low friction**: check-ins should take under 5 minutes
- **Smart context**: prompts feel like a conversation, not a form
- **Professional tone**: this is a work tool, not a diary app

## Database Tables
- `profiles` — user info (name, role)
- `journal_entries` — check-in entries (content, type, date, prompt used)
- `summaries` — generated summaries (content, timeframe, user instructions)

## Security Model
- All data is private per user (Supabase Row Level Security)
- Claude API key is server-side only
- No data sharing between users

## Post-MVP Roadmap
- React Native mobile app
- Calendar/Jira/Slack integrations for auto-suggested entries
- Quarterly/annual review templates
- Export summary to PDF or Word
- Manager view (opt-in sharing)
- Reminder notifications

## Setup Instructions

### 1. Supabase
1. Create a project at https://supabase.com
2. Run `docs/schema.sql` in the SQL editor
3. Copy project URL and anon key

### 2. Anthropic API
1. Get API key at https://console.anthropic.com
2. Add to `.env.local` as `ANTHROPIC_API_KEY`

### 3. Local Development
```bash
cp apps/web/.env.example apps/web/..env.local
# Fill in your keys in ..env.local
npm install
npm run dev
```

Open http://localhost:3000

### 4. Deploy to Vercel
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy
