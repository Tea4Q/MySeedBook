-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: seed_schedule_dates
-- ─────────────────────────────────────────────────────────────────────────────
-- Adds optional schedule dates for indoor sowing and outdoor transplanting.
-- These fields are intentionally nullable so existing records remain valid.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.seeds
  ADD COLUMN IF NOT EXISTS indoor_sow_date timestamptz,
  ADD COLUMN IF NOT EXISTS transplant_date timestamptz;