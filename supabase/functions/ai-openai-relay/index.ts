// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return jsonResponse({ error: 'Server configuration is incomplete.' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized.' }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return jsonResponse({ error: 'Unauthorized.' }, 401);
  }

  const body = await req.json().catch(() => null);
  const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';
  const model = typeof body?.model === 'string' && body.model.trim() ? body.model.trim() : 'gpt-3.5-turbo';
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const temperature = typeof body?.temperature === 'number' ? body.temperature : undefined;
  const maxTokens = typeof body?.max_tokens === 'number' ? body.max_tokens : undefined;

  if (!apiKey || messages.length === 0) {
    return jsonResponse({ error: 'Missing AI request details.' }, 400);
  }

  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...(typeof temperature === 'number' ? { temperature } : {}),
      ...(typeof maxTokens === 'number' ? { max_tokens: maxTokens } : {}),
    }),
  });

  if (!openAIResponse.ok) {
    if (openAIResponse.status === 401) {
      return jsonResponse({ error: 'Your AI provider rejected the saved API key.' }, 401);
    }

    if (openAIResponse.status === 429) {
      return jsonResponse({ error: 'The AI provider is rate limiting requests right now.' }, 429);
    }

    return jsonResponse({ error: 'The AI provider request could not be completed.' }, 502);
  }

  const payload = await openAIResponse.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    return jsonResponse({ error: 'The AI provider returned an empty response.' }, 502);
  }

  return jsonResponse({ content });
});