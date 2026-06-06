/*
  # Seed voice notes storage and metadata

  1. New table
    - seed_voice_notes: multiple recordings per seed

  2. Security
    - RLS enabled
    - authenticated users can only read/write their own records

  3. Storage
    - new voice-notes bucket
    - users can only access objects in their own top-level folder (auth.uid)
*/

CREATE TABLE IF NOT EXISTS public.seed_voice_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id uuid NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_mode text NOT NULL CHECK (storage_mode IN ('local', 'cloud')),
  storage_path text,
  storage_url text,
  transcription_text text,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seed_voice_notes_seed_id ON public.seed_voice_notes(seed_id);
CREATE INDEX IF NOT EXISTS idx_seed_voice_notes_user_id ON public.seed_voice_notes(user_id);

ALTER TABLE public.seed_voice_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Users can read own seed voice notes"
    ON public.seed_voice_notes
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  CREATE POLICY "Users can insert own seed voice notes"
    ON public.seed_voice_notes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  CREATE POLICY "Users can update own seed voice notes"
    ON public.seed_voice_notes
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  CREATE POLICY "Users can delete own seed voice notes"
    ON public.seed_voice_notes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  CREATE POLICY "Users can upload own voice notes"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'voice-notes'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  CREATE POLICY "Users can read own voice notes"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'voice-notes'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  CREATE POLICY "Users can update own voice notes"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'voice-notes'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  CREATE POLICY "Users can delete own voice notes"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'voice-notes'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;
