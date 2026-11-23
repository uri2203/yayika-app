-- ============================================================================
-- 010 — Add onboarding_preferences to yayika_profiles
-- Prepared: 2026-11-23
-- Status: NOT APPLIED. Review in staging before production.
--
-- Why:
--   yayika-app/src/config/api.ts (aiOnboarding) upserts this JSONB column, but
--   the live yayika_profiles table does not have it yet.
--
-- Safety:
--   Additive and idempotent. Does not rewrite existing rows and does not change
--   RLS policies (the existing profile policies apply to the new column).
-- ============================================================================

ALTER TABLE public.yayika_profiles
  ADD COLUMN IF NOT EXISTS onboarding_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.yayika_profiles.onboarding_preferences IS
  'Onboarding answers (lang, goals, cycle_phase, income_range, notifications) stored by the app.';
