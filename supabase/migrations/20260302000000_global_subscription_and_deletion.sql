-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: global_subscription_and_deletion
-- ─────────────────────────────────────────────────────────────────────────────
-- Adds profile columns for avatar, display name, and resubscribe block.
-- Creates a deletion log table (retained for legal/tax compliance).
-- Creates a service-role RPC for auth user deletion.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Extend profiles table ──────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name            text,
  ADD COLUMN IF NOT EXISTS avatar_url              text,
  ADD COLUMN IF NOT EXISTS resubscribe_blocked_until timestamptz;

-- ── 2. global_deletion_log ────────────────────────────────────────────────────
-- Retained for legal / tax compliance.
-- Contains no PII — only user_id (a UUID), deletion timestamp, and plan info.

CREATE TABLE IF NOT EXISTS public.global_deletion_log (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL,
  deleted_at          timestamptz NOT NULL DEFAULT now(),
  plan_at_deletion    text,
  transaction_history jsonb       DEFAULT '[]'::jsonb,
  notes               text
);

-- Only service role (server) can read this table.
-- Authenticated users can insert their own row but not read or update it.
ALTER TABLE public.global_deletion_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deletion_log_insert_own" ON public.global_deletion_log;
CREATE POLICY "deletion_log_insert_own"
  ON public.global_deletion_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "deletion_log_service_role_all" ON public.global_deletion_log;
CREATE POLICY "deletion_log_service_role_all"
  ON public.global_deletion_log
  FOR ALL
  TO service_role
  USING (true);

-- ── 3. Supabase Storage bucket for avatars ────────────────────────────────────
-- Creates the avatars bucket if it does not already exist.
-- Public read so avatar URLs work without a signed URL.

INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder only
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- ── 4. RPC: global_delete_auth_user ──────────────────────────────────────────
-- Deletes the Supabase auth user from the auth.users table.
-- Must be called by an authenticated session.
-- Uses security definer so it runs with the permissions of the function owner
-- (which needs to be a role that can delete from auth.users — typically postgres).
--
-- NOTE: In hosted Supabase you cannot directly delete from auth.users via SQL.
-- Instead, use the Supabase Admin API from an Edge Function.
-- This RPC serves as a placeholder that you replace with an Edge Function call
-- from globalAccountDeletion.ts if you need hard auth deletion.
-- For soft-deletion (profile PII cleared, signOut forced) this is sufficient.

CREATE OR REPLACE FUNCTION public.global_delete_auth_user(uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Guard: only the authenticated user can delete themselves
  IF auth.uid() <> uid THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Null out all PII on the profiles row (belt + suspenders)
  UPDATE public.profiles
  SET
    display_name   = NULL,
    avatar_url     = NULL,
    username       = NULL
  WHERE id = uid;

  -- Mark account as deleted in deletion log (if not already written by client)
  INSERT INTO public.global_deletion_log (user_id, deleted_at, plan_at_deletion)
  VALUES (uid, now(), 'rpc_initiated')
  ON CONFLICT DO NOTHING;

  -- Note: actual auth.users deletion must be done via Supabase Admin API
  -- (Edge Function with service_role key).  RPC handles the data cleanup only.
END;
$$;

-- Grant execute to authenticated users (they can only delete themselves due to guard)
GRANT EXECUTE ON FUNCTION public.global_delete_auth_user(uuid) TO authenticated;
