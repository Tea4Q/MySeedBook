/*
  # MCP Token Management (v1.4.1 — Phase 1)

  Stores personal access tokens users generate to connect Claude Desktop,
  Claude.ai, or ChatGPT to their MySeedBook garden data via the BYOAI MCP
  server. Raw tokens are never stored — only a SHA-256 hex digest.

  1. New table: mcp_tokens
     - token_hash   : SHA-256 hex of the raw token (used for lookup)
     - token_prefix : first 12 chars of the raw token for display (e.g. "msb_abc12345")
     - scopes       : '{read}' or '{read,write}'
     - expires_at   : NULL = never expires
     - last_used_at : updated on each successful MCP request
     - revoked_at   : soft-revoke; NULL means active

  2. RPC: create_mcp_token(p_label, p_scopes, p_expires_at)
     - Atomically revokes any existing active token for the user
     - Generates msb_ + 32 random hex chars server-side
     - Returns the raw token once — the caller must store it immediately

  3. Security
     - RLS enabled: authenticated users can only access their own rows
     - SECURITY DEFINER RPC so token generation is always server-side
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mcp_tokens (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash   text        NOT NULL,
  token_prefix text        NOT NULL,
  label        text        NOT NULL DEFAULT 'My Token',
  scopes       text[]      NOT NULL DEFAULT '{read,write}',
  expires_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at   timestamptz,

  -- A user can have at most one active token at a time (enforced by the RPC)
  CONSTRAINT mcp_tokens_scopes_valid CHECK (
    scopes <@ ARRAY['read', 'write']::text[] AND array_length(scopes, 1) > 0
  )
);

CREATE INDEX IF NOT EXISTS idx_mcp_tokens_user_id    ON public.mcp_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_token_hash ON public.mcp_tokens(token_hash);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.mcp_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mcp_tokens_select_own" ON public.mcp_tokens;
CREATE POLICY "mcp_tokens_select_own"
  ON public.mcp_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "mcp_tokens_insert_own" ON public.mcp_tokens;
CREATE POLICY "mcp_tokens_insert_own"
  ON public.mcp_tokens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mcp_tokens_update_own" ON public.mcp_tokens;
CREATE POLICY "mcp_tokens_update_own"
  ON public.mcp_tokens FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy — tokens are revoked via revoked_at, not hard-deleted.
-- Service role can still delete for maintenance purposes.

-- ── RPC ───────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_mcp_token(
  p_label      text        DEFAULT 'My Token',
  p_scopes     text[]      DEFAULT '{read,write}',
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw_token text;
  v_hash      text;
  v_prefix    text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate scopes
  IF NOT (p_scopes <@ ARRAY['read', 'write']::text[]) OR array_length(p_scopes, 1) IS NULL THEN
    RAISE EXCEPTION 'Invalid scopes: must be a non-empty subset of {read, write}';
  END IF;

  -- Revoke any existing active token for this user
  UPDATE public.mcp_tokens
  SET    revoked_at = now()
  WHERE  user_id    = auth.uid()
    AND  revoked_at IS NULL;

  -- Generate: msb_ + 32 hex chars (16 random bytes)
  v_raw_token := 'msb_' || encode(gen_random_bytes(16), 'hex');
  v_hash      := encode(digest(v_raw_token, 'sha256'), 'hex');
  v_prefix    := substring(v_raw_token from 1 for 12); -- 'msb_' + 8 chars

  INSERT INTO public.mcp_tokens (user_id, token_hash, token_prefix, label, scopes, expires_at)
  VALUES (auth.uid(), v_hash, v_prefix, p_label, p_scopes, p_expires_at);

  RETURN v_raw_token;
END;
$$;

-- Revoke function — callable by authenticated user to invalidate their own token
CREATE OR REPLACE FUNCTION public.revoke_mcp_token()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.mcp_tokens
  SET    revoked_at = now()
  WHERE  user_id    = auth.uid()
    AND  revoked_at IS NULL;
END;
$$;
