/*
  # Repair: Create seeds table if missing

  The original migration (20250617120000_create_seeds_table.sql) was empty,
  so the seeds table was never created on existing Supabase instances.
  This repair migration creates it if absent, with all columns including
  those added by later migrations (indoor_sow_date, transplant_date).
  All guards use IF NOT EXISTS so it is safe to run on any environment.
*/

-- Ensure the updated_at trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create seeds table (no-op if it already exists)
CREATE TABLE IF NOT EXISTS public.seeds (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_name               text        NOT NULL,
  type                    text,
  quantity                integer     NOT NULL DEFAULT 0,
  quantity_unit           text        DEFAULT 'seeds',
  supplier_id             uuid        REFERENCES public.suppliers(id),
  date_purchased          timestamptz,
  indoor_sow_date         timestamptz,
  transplant_date         timestamptz,
  seed_price              numeric,
  storage_location        text,
  storage_requirements    text,
  germination_rate        integer,
  planting_depth          text,
  spacing                 text,
  watering_requirements   text,
  sunlight_requirements   text,
  soil_type               text,
  fertilizer_requirements text,
  days_to_germinate       text,
  days_to_harvest         text,
  planting_season         text,
  harvest_season          text,
  notes                   text,
  description             text,
  seed_images             jsonb       DEFAULT '[]'::jsonb,
  deleted_at              timestamptz DEFAULT NULL,
  user_id                 uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Indices (all guarded)
CREATE INDEX IF NOT EXISTS idx_seeds_user_id     ON public.seeds(user_id);
CREATE INDEX IF NOT EXISTS idx_seeds_deleted_at  ON public.seeds(deleted_at);
CREATE INDEX IF NOT EXISTS idx_seeds_supplier_id ON public.seeds(supplier_id);

-- Enable RLS (idempotent)
ALTER TABLE public.seeds ENABLE ROW LEVEL SECURITY;

-- Policies (guarded to avoid duplicate errors)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seeds'
      AND policyname = 'Users can view their own seeds'
  ) THEN
    CREATE POLICY "Users can view their own seeds"
      ON public.seeds FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seeds'
      AND policyname = 'Users can insert their own seeds'
  ) THEN
    CREATE POLICY "Users can insert their own seeds"
      ON public.seeds FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seeds'
      AND policyname = 'Users can update their own seeds'
  ) THEN
    CREATE POLICY "Users can update their own seeds"
      ON public.seeds FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seeds'
      AND policyname = 'Users can delete their own seeds'
  ) THEN
    CREATE POLICY "Users can delete their own seeds"
      ON public.seeds FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger (drop and recreate to be idempotent)
DROP TRIGGER IF EXISTS update_seeds_updated_at ON public.seeds;
CREATE TRIGGER update_seeds_updated_at
  BEFORE UPDATE ON public.seeds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
