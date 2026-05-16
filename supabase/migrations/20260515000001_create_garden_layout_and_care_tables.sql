/*
  # Garden Layout & Care Tracking Tables (v1.4.1 — Phase 1)

  Schema created now so the MCP server stubs have a valid target and no
  retrofitting is required when the garden layout UI ships in v1.5.0.
  No app feature uses these tables yet — they are purely additive.

  Hierarchy:
    Garden (named outdoor space, e.g. "Back Garden", "Allotment")
    └── Garden Bed / Plot (named raised bed or section, e.g. "Bed 1")
        └── Seed Location (grid cell within a bed)

  1. gardens          — named gardens owned by a user
  2. garden_plots     — named beds/plots within a garden
  3. seed_locations   — each seed assigned to a grid cell within a plot
  4. watering_logs    — per-seed watering events
  5. fertilizer_logs  — per-seed fertilizer events
  6. planting_logs    — per-seed planting events with optional photo

  All tables:
  - RLS enabled, user_id scoped
  - Soft delete via deleted_at on seed_locations only (others are append-only logs)
  - Cascade-delete from seeds and garden_plots where appropriate
*/

-- ── 0. gardens ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gardens (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  description     text,
  location_notes  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gardens_user_id ON public.gardens(user_id);

ALTER TABLE public.gardens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gardens_select_own" ON public.gardens;
CREATE POLICY "gardens_select_own"
  ON public.gardens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "gardens_insert_own" ON public.gardens;
CREATE POLICY "gardens_insert_own"
  ON public.gardens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gardens_update_own" ON public.gardens;
CREATE POLICY "gardens_update_own"
  ON public.gardens FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gardens_delete_own" ON public.gardens;
CREATE POLICY "gardens_delete_own"
  ON public.gardens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER gardens_updated_at
  BEFORE UPDATE ON public.gardens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 1. garden_plots ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.garden_plots (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  garden_id   uuid        REFERENCES public.gardens(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  width_units integer     NOT NULL DEFAULT 4 CHECK (width_units > 0),
  height_units integer    NOT NULL DEFAULT 4 CHECK (height_units > 0),
  unit_label  text        NOT NULL DEFAULT '30cm',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_garden_plots_user_id   ON public.garden_plots(user_id);
CREATE INDEX IF NOT EXISTS idx_garden_plots_garden_id ON public.garden_plots(garden_id);

ALTER TABLE public.garden_plots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "garden_plots_select_own" ON public.garden_plots;
CREATE POLICY "garden_plots_select_own"
  ON public.garden_plots FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "garden_plots_insert_own" ON public.garden_plots;
CREATE POLICY "garden_plots_insert_own"
  ON public.garden_plots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "garden_plots_update_own" ON public.garden_plots;
CREATE POLICY "garden_plots_update_own"
  ON public.garden_plots FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "garden_plots_delete_own" ON public.garden_plots;
CREATE POLICY "garden_plots_delete_own"
  ON public.garden_plots FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER garden_plots_updated_at
  BEFORE UPDATE ON public.garden_plots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 2. seed_locations ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.seed_locations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seed_id     uuid        NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  plot_id     uuid        NOT NULL REFERENCES public.garden_plots(id) ON DELETE CASCADE,
  grid_x      integer     NOT NULL CHECK (grid_x >= 0),
  grid_y      integer     NOT NULL CHECK (grid_y >= 0),
  planted_date date,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,

  -- A grid cell in a plot can only hold one active seed at a time
  CONSTRAINT seed_locations_unique_cell
    UNIQUE NULLS NOT DISTINCT (plot_id, grid_x, grid_y, deleted_at)
);

CREATE INDEX IF NOT EXISTS idx_seed_locations_user_id  ON public.seed_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_seed_locations_seed_id  ON public.seed_locations(seed_id);
CREATE INDEX IF NOT EXISTS idx_seed_locations_plot_id  ON public.seed_locations(plot_id);
CREATE INDEX IF NOT EXISTS idx_seed_locations_active   ON public.seed_locations(plot_id, deleted_at);

ALTER TABLE public.seed_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seed_locations_select_own" ON public.seed_locations;
CREATE POLICY "seed_locations_select_own"
  ON public.seed_locations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "seed_locations_insert_own" ON public.seed_locations;
CREATE POLICY "seed_locations_insert_own"
  ON public.seed_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "seed_locations_update_own" ON public.seed_locations;
CREATE POLICY "seed_locations_update_own"
  ON public.seed_locations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 3. watering_logs ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.watering_logs (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seed_id            uuid        NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  seed_location_id   uuid        REFERENCES public.seed_locations(id) ON DELETE SET NULL,
  logged_at          timestamptz NOT NULL DEFAULT now(),
  amount_ml          integer     CHECK (amount_ml > 0),
  notes              text
);

CREATE INDEX IF NOT EXISTS idx_watering_logs_user_id ON public.watering_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_watering_logs_seed_id ON public.watering_logs(seed_id);
CREATE INDEX IF NOT EXISTS idx_watering_logs_logged_at ON public.watering_logs(logged_at DESC);

ALTER TABLE public.watering_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "watering_logs_select_own" ON public.watering_logs;
CREATE POLICY "watering_logs_select_own"
  ON public.watering_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "watering_logs_insert_own" ON public.watering_logs;
CREATE POLICY "watering_logs_insert_own"
  ON public.watering_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "watering_logs_delete_own" ON public.watering_logs;
CREATE POLICY "watering_logs_delete_own"
  ON public.watering_logs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── 4. fertilizer_logs ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fertilizer_logs (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seed_id            uuid        NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  seed_location_id   uuid        REFERENCES public.seed_locations(id) ON DELETE SET NULL,
  logged_at          timestamptz NOT NULL DEFAULT now(),
  fertilizer_type    text        NOT NULL,
  amount             text,
  notes              text
);

CREATE INDEX IF NOT EXISTS idx_fertilizer_logs_user_id ON public.fertilizer_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fertilizer_logs_seed_id ON public.fertilizer_logs(seed_id);
CREATE INDEX IF NOT EXISTS idx_fertilizer_logs_logged_at ON public.fertilizer_logs(logged_at DESC);

ALTER TABLE public.fertilizer_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fertilizer_logs_select_own" ON public.fertilizer_logs;
CREATE POLICY "fertilizer_logs_select_own"
  ON public.fertilizer_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "fertilizer_logs_insert_own" ON public.fertilizer_logs;
CREATE POLICY "fertilizer_logs_insert_own"
  ON public.fertilizer_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "fertilizer_logs_delete_own" ON public.fertilizer_logs;
CREATE POLICY "fertilizer_logs_delete_own"
  ON public.fertilizer_logs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── 5. planting_logs ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.planting_logs (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seed_id            uuid        NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  seed_location_id   uuid        REFERENCES public.seed_locations(id) ON DELETE SET NULL,
  logged_at          timestamptz NOT NULL DEFAULT now(),
  image_url          text,
  notes              text
);

CREATE INDEX IF NOT EXISTS idx_planting_logs_user_id ON public.planting_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_planting_logs_seed_id ON public.planting_logs(seed_id);
CREATE INDEX IF NOT EXISTS idx_planting_logs_logged_at ON public.planting_logs(logged_at DESC);

ALTER TABLE public.planting_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planting_logs_select_own" ON public.planting_logs;
CREATE POLICY "planting_logs_select_own"
  ON public.planting_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "planting_logs_insert_own" ON public.planting_logs;
CREATE POLICY "planting_logs_insert_own"
  ON public.planting_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "planting_logs_delete_own" ON public.planting_logs;
CREATE POLICY "planting_logs_delete_own"
  ON public.planting_logs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
