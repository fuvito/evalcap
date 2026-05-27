-- EvalCap Database Schema
-- Run in the Supabase SQL editor on a fresh project.
-- Safe to re-run: tables use IF NOT EXISTS, functions/triggers use CREATE OR REPLACE,
-- policies use DROP IF EXISTS before CREATE.

-- ─────────────────────────────────────────────────────────────
-- Shared helper: keeps updated_at current on every UPDATE
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────────────────────
-- profiles  (extends auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  role        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- INSERT is handled exclusively by the handle_new_user trigger (SECURITY DEFINER).
-- No INSERT policy is intentional — users cannot insert their own profile row.

DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

GRANT SELECT, UPDATE ON profiles TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- journal_entries
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content        TEXT        NOT NULL,
  check_in_type  TEXT        CHECK (check_in_type IN ('daily', 'weekly')) NOT NULL DEFAULT 'weekly',
  prompt_used    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own journal entries"   ON journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;

CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entries TO authenticated;

-- Composite index covers the dominant query: WHERE user_id = $1 ORDER BY created_at DESC
DROP INDEX IF EXISTS journal_entries_user_id_idx;
DROP INDEX IF EXISTS journal_entries_created_at_idx;
CREATE INDEX IF NOT EXISTS journal_entries_user_created_idx
  ON journal_entries(user_id, created_at DESC);


-- ─────────────────────────────────────────────────────────────
-- summaries
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS summaries (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content             TEXT        NOT NULL,
  timeframe_start     DATE        NOT NULL,
  timeframe_end       DATE        NOT NULL,
  user_instructions   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own summaries"   ON summaries;
DROP POLICY IF EXISTS "Users can insert own summaries" ON summaries;
DROP POLICY IF EXISTS "Users can update own summaries" ON summaries;
DROP POLICY IF EXISTS "Users can delete own summaries" ON summaries;

CREATE POLICY "Users can view own summaries"
  ON summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
  ON summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries"
  ON summaries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own summaries"
  ON summaries FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER summaries_updated_at
  BEFORE UPDATE ON summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON summaries TO authenticated;

DROP INDEX IF EXISTS summaries_user_id_idx;
CREATE INDEX IF NOT EXISTS summaries_user_created_idx
  ON summaries(user_id, created_at DESC);


-- ─────────────────────────────────────────────────────────────
-- Auto-create profile row on signup
-- ─────────────────────────────────────────────────────────────
-- SECURITY DEFINER so the trigger runs as the owner and bypasses RLS.
-- SET search_path = public prevents search-path hijacking.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
