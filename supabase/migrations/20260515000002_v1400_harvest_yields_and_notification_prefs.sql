/*
  # v1.4.0 — Harvest Yield Tracking & Notification Preferences

  1. harvest_yields
     Tracks actual harvest records per seed per season so users can compare
     expected vs. actual yields over time (Essential tier feature).

  2. seeds.low_stock_threshold
     Per-seed quantity threshold that triggers a low-stock alert.
     NULL = use the global default (5 units) defined in notification_preferences.

  3. notification_preferences
     One row per user controlling push notification behaviour:
     - push_enabled              : whether push notifications are active
     - planting_reminder_days    : how many days before a sow/transplant date to alert
     - low_stock_default_threshold: global fallback when seed has no individual threshold
     - reorder_reminder_enabled  : whether to show reorder suggestions

  All tables use RLS (user_id scoped).
*/

-- ── 1. harvest_yields ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.harvest_yields (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seed_id         uuid        NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  harvest_date    date        NOT NULL,
  -- Weight-based yield
  yield_weight    numeric     CHECK (yield_weight > 0),
  yield_weight_unit text,     -- 'kg', 'g', 'lb', 'oz'
  -- Count-based yield (e.g. 12 tomatoes)
  yield_quantity  integer     CHECK (yield_quantity > 0),
  yield_quantity_unit text,   -- 'fruit', 'heads', 'bunches', etc.
  -- Season label for grouping (e.g. 'Spring 2026')
  season_label    text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT harvest_yields_has_yield CHECK (
    yield_weight IS NOT NULL OR yield_quantity IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_harvest_yields_user_id   ON public.harvest_yields(user_id);
CREATE INDEX IF NOT EXISTS idx_harvest_yields_seed_id   ON public.harvest_yields(seed_id);
CREATE INDEX IF NOT EXISTS idx_harvest_yields_date      ON public.harvest_yields(harvest_date DESC);

ALTER TABLE public.harvest_yields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "harvest_yields_select_own" ON public.harvest_yields;
CREATE POLICY "harvest_yields_select_own"
  ON public.harvest_yields FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "harvest_yields_insert_own" ON public.harvest_yields;
CREATE POLICY "harvest_yields_insert_own"
  ON public.harvest_yields FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "harvest_yields_update_own" ON public.harvest_yields;
CREATE POLICY "harvest_yields_update_own"
  ON public.harvest_yields FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "harvest_yields_delete_own" ON public.harvest_yields;
CREATE POLICY "harvest_yields_delete_own"
  ON public.harvest_yields FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER harvest_yields_updated_at
  BEFORE UPDATE ON public.harvest_yields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 2. seeds.low_stock_threshold ─────────────────────────────────────────────

ALTER TABLE public.seeds
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer CHECK (low_stock_threshold >= 0);

-- ── 3. notification_preferences ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled                boolean     NOT NULL DEFAULT false,
  -- Planting reminders: days before indoor_sow_date or transplant_date
  planting_reminder_days      integer     NOT NULL DEFAULT 3 CHECK (planting_reminder_days >= 0),
  -- Low-stock alerts: fallback threshold when seed has no individual threshold
  low_stock_default_threshold integer     NOT NULL DEFAULT 5 CHECK (low_stock_default_threshold >= 0),
  -- Reorder suggestions when quantity drops below threshold
  reorder_reminder_enabled    boolean     NOT NULL DEFAULT true,
  -- Harvest alerts: days before expected harvest_season end
  harvest_reminder_enabled    boolean     NOT NULL DEFAULT true,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON public.notification_preferences(user_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_prefs_select_own" ON public.notification_preferences;
CREATE POLICY "notification_prefs_select_own"
  ON public.notification_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_prefs_insert_own" ON public.notification_preferences;
CREATE POLICY "notification_prefs_insert_own"
  ON public.notification_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_prefs_update_own" ON public.notification_preferences;
CREATE POLICY "notification_prefs_update_own"
  ON public.notification_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Convenience RPC: upsert_notification_preferences ─────────────────────────
-- Called on first open of the notification settings screen to ensure a row exists.

CREATE OR REPLACE FUNCTION public.upsert_notification_preferences(
  p_push_enabled                boolean     DEFAULT false,
  p_planting_reminder_days      integer     DEFAULT 3,
  p_low_stock_default_threshold integer     DEFAULT 5,
  p_reorder_reminder_enabled    boolean     DEFAULT true,
  p_harvest_reminder_enabled    boolean     DEFAULT true
)
RETURNS public.notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.notification_preferences;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.notification_preferences (
    user_id,
    push_enabled,
    planting_reminder_days,
    low_stock_default_threshold,
    reorder_reminder_enabled,
    harvest_reminder_enabled
  )
  VALUES (
    auth.uid(),
    p_push_enabled,
    p_planting_reminder_days,
    p_low_stock_default_threshold,
    p_reorder_reminder_enabled,
    p_harvest_reminder_enabled
  )
  ON CONFLICT (user_id) DO UPDATE SET
    push_enabled                = EXCLUDED.push_enabled,
    planting_reminder_days      = EXCLUDED.planting_reminder_days,
    low_stock_default_threshold = EXCLUDED.low_stock_default_threshold,
    reorder_reminder_enabled    = EXCLUDED.reorder_reminder_enabled,
    harvest_reminder_enabled    = EXCLUDED.harvest_reminder_enabled,
    updated_at                  = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
