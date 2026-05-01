/*
  # Create Seeds Table

  1. New Tables
    - `seeds`
      - `id` (uuid, primary key)
      - `seed_name` (text, required)
      - `type` (text)
      - `quantity` (integer)
      - `quantity_unit` (text)
      - `supplier_id` (uuid, FK to suppliers, nullable)
      - `date_purchased` (timestamptz)
      - `seed_price` (numeric)
      - `storage_location` (text)
      - `storage_requirements` (text)
      - `germination_rate` (integer)
      - `planting_depth` (text)
      - `spacing` (text)
      - `watering_requirements` (text)
      - `sunlight_requirements` (text)
      - `soil_type` (text)
      - `fertilizer_requirements` (text)
      - `days_to_germinate` (text)
      - `days_to_harvest` (text)
      - `planting_season` (text)
      - `harvest_season` (text)
      - `notes` (text)
      - `description` (text)
      - `seed_images` (jsonb)
      - `deleted_at` (timestamptz, soft delete)
      - `user_id` (uuid, FK to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Policies for authenticated users (CRUD scoped to own data)

  NOTE: indoor_sow_date and transplant_date are added in a later migration.
*/

-- Create seeds table
CREATE TABLE IF NOT EXISTS public.seeds (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_name               text        NOT NULL,
  type                    text,
  quantity                integer     NOT NULL DEFAULT 0,
  quantity_unit           text        DEFAULT 'seeds',
  supplier_id             uuid        REFERENCES public.suppliers(id),
  date_purchased          timestamptz,
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

-- Indices
CREATE INDEX IF NOT EXISTS idx_seeds_user_id     ON public.seeds(user_id);
CREATE INDEX IF NOT EXISTS idx_seeds_deleted_at  ON public.seeds(deleted_at);
CREATE INDEX IF NOT EXISTS idx_seeds_supplier_id ON public.seeds(supplier_id);

-- Enable RLS
ALTER TABLE public.seeds ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own seeds" ON public.seeds;
CREATE POLICY "Users can view their own seeds"
  ON public.seeds FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own seeds" ON public.seeds;
CREATE POLICY "Users can insert their own seeds"
  ON public.seeds FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own seeds" ON public.seeds;
CREATE POLICY "Users can update their own seeds"
  ON public.seeds FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own seeds" ON public.seeds;
CREATE POLICY "Users can delete their own seeds"
  ON public.seeds FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_seeds_updated_at ON public.seeds;
CREATE TRIGGER update_seeds_updated_at
  BEFORE UPDATE ON public.seeds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
