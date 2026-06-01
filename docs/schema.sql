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
  id                      UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email                   TEXT        NOT NULL,
  full_name               TEXT,
  role                    TEXT,
  job_title               TEXT,
  department              TEXT,
  manager_name            TEXT,
  default_check_in_type   TEXT        DEFAULT 'weekly' CHECK (default_check_in_type IN ('daily', 'weekly')),
  onboarding_completed    BOOLEAN     DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- INSERT is handled by the handle_new_user trigger (SECURITY DEFINER) on signup.
-- We also allow authenticated users to insert their own profile (for on-demand creation).

DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;


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
-- performance_cycles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_cycles (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT        NOT NULL,
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE performance_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cycles"   ON performance_cycles;
DROP POLICY IF EXISTS "Users can insert own cycles" ON performance_cycles;
DROP POLICY IF EXISTS "Users can update own cycles" ON performance_cycles;
DROP POLICY IF EXISTS "Users can delete own cycles" ON performance_cycles;

CREATE POLICY "Users can view own cycles"
  ON performance_cycles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycles"
  ON performance_cycles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycles"
  ON performance_cycles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycles"
  ON performance_cycles FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER performance_cycles_updated_at
  BEFORE UPDATE ON performance_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON performance_cycles TO authenticated;

CREATE INDEX IF NOT EXISTS performance_cycles_user_idx
  ON performance_cycles(user_id, created_at DESC);


-- ─────────────────────────────────────────────────────────────
-- evaluation_goals
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evaluation_goals (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cycle_id    UUID        REFERENCES performance_cycles(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE evaluation_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own evaluation goals"   ON evaluation_goals;
DROP POLICY IF EXISTS "Users can insert own evaluation goals" ON evaluation_goals;
DROP POLICY IF EXISTS "Users can update own evaluation goals" ON evaluation_goals;
DROP POLICY IF EXISTS "Users can delete own evaluation goals" ON evaluation_goals;

CREATE POLICY "Users can view own evaluation goals"
  ON evaluation_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own evaluation goals"
  ON evaluation_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evaluation goals"
  ON evaluation_goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own evaluation goals"
  ON evaluation_goals FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER evaluation_goals_updated_at
  BEFORE UPDATE ON evaluation_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON evaluation_goals TO authenticated;
CREATE INDEX IF NOT EXISTS evaluation_goals_user_idx ON evaluation_goals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS evaluation_goals_cycle_idx ON evaluation_goals(cycle_id);


-- ─────────────────────────────────────────────────────────────
-- personal_goals
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_goals (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  category    TEXT        CHECK (category IN ('promotion', 'certification', 'skill', 'habit', 'other')),
  priority    TEXT        NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
  due_date    DATE,
  status      TEXT        NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own personal goals"   ON personal_goals;
DROP POLICY IF EXISTS "Users can insert own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Users can update own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Users can delete own personal goals" ON personal_goals;

CREATE POLICY "Users can view own personal goals"
  ON personal_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own personal goals"
  ON personal_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personal goals"
  ON personal_goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own personal goals"
  ON personal_goals FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER personal_goals_updated_at
  BEFORE UPDATE ON personal_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON personal_goals TO authenticated;
CREATE INDEX IF NOT EXISTS personal_goals_user_idx ON personal_goals(user_id, created_at DESC);


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


-- ─────────────────────────────────────────────────────────────
-- Ensure user profile exists (called by API if missing)
-- ─────────────────────────────────────────────────────────────
-- SECURITY DEFINER allows authenticated users to ensure their profile exists
CREATE OR REPLACE FUNCTION ensure_profile_exists(user_id UUID, user_email TEXT)
RETURNS TABLE(id UUID, email TEXT, full_name TEXT, role TEXT, job_title TEXT, department TEXT, manager_name TEXT, default_check_in_type TEXT, onboarding_completed BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ) AS $$
BEGIN
  -- Try to insert if not exists
  INSERT INTO public.profiles (id, email)
  VALUES (user_id, user_email)
  ON CONFLICT (id) DO NOTHING;

  -- Return the profile (now guaranteed to exist)
  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.role, p.job_title, p.department, p.manager_name, p.default_check_in_type, p.onboarding_completed, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION ensure_profile_exists(UUID, TEXT) TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- Admin schema additions
-- Run these after the base schema if upgrading an existing project.
-- ─────────────────────────────────────────────────────────────

-- admins — identity table for admin users (separate from profiles/role).
-- Admin identity is determined by presence in this table, not profiles.role.
-- More admin-specific columns will be added here over time.
CREATE TABLE IF NOT EXISTS admins (
  id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
-- No user-facing RLS policy — service role access only.

CREATE OR REPLACE TRIGGER admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add status to profiles (active | suspended)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'suspended'));

-- subscriptions — tracks plan and billing status per user
-- Stripe webhook keeps this in sync; plan is 'free' | 'pro'
CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan                     TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status                   TEXT        NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'incomplete')),
  stripe_customer_id       TEXT,
  stripe_subscription_id   TEXT,
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  cancel_at_period_end     BOOLEAN     NOT NULL DEFAULT FALSE,
  cancelled_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON subscriptions TO authenticated;

CREATE OR REPLACE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- admin_audit_log — immutable record of every admin action
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action         TEXT        NOT NULL,
  target_user_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  detail         JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- No user-facing RLS policy — service role only

CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_idx   ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx  ON admin_audit_log(target_user_id);
