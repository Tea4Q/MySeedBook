// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const REVENUECAT_SECRET_KEY = Deno.env.get('REVENUECAT_SECRET_KEY') ?? '';
const ENTITLEMENT_ESSENTIAL = Deno.env.get('REVENUECAT_ENTITLEMENT_ESSENTIAL') ?? 'essential';
const ENTITLEMENT_VOICE = Deno.env.get('REVENUECAT_ENTITLEMENT_VOICE') ?? 'voice';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function getPlanType(productIdentifier?: string | null): 'monthly' | 'yearly' | null {
  const normalized = productIdentifier?.toLowerCase() ?? '';
  if (!normalized) {
    return null;
  }

  if (normalized.includes('monthly') || normalized.includes('.month') || normalized.includes('_month')) {
    return 'monthly';
  }

  if (
    normalized.includes('yearly') ||
    normalized.includes('annual') ||
    normalized.includes('.year') ||
    normalized.includes('_year')
  ) {
    return 'yearly';
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !REVENUECAT_SECRET_KEY) {
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
  const user = authData?.user;

  if (authError || !user) {
    return jsonResponse({ error: 'Unauthorized.' }, 401);
  }

  const revenueCatResponse = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`,
    {
      headers: {
        Authorization: `Bearer ${REVENUECAT_SECRET_KEY}`,
      },
    }
  );

  if (!revenueCatResponse.ok) {
    return jsonResponse({ error: 'Could not refresh subscription access.' }, revenueCatResponse.status === 404 ? 200 : 502);
  }

  const revenueCatData = await revenueCatResponse.json();
  const entitlements = revenueCatData?.subscriber?.entitlements ?? {};
  const voiceEntitlement = entitlements[ENTITLEMENT_VOICE] ?? null;
  const essentialEntitlement = entitlements[ENTITLEMENT_ESSENTIAL] ?? null;
  const activeEntitlement = voiceEntitlement ?? essentialEntitlement;
  const tier = voiceEntitlement ? 'voice' : essentialEntitlement ? 'essential' : 'free';
  const productIdentifier = activeEntitlement?.product_identifier ?? activeEntitlement?.productIdentifier ?? null;
  const expirationDate = activeEntitlement?.expires_date ?? activeEntitlement?.expirationDate ?? null;

  return jsonResponse({
    tier,
    isPremium: tier !== 'free',
    isVoice: tier === 'voice',
    aiVoiceActive: tier === 'voice',
    planType: getPlanType(productIdentifier),
    expirationDate,
    productIdentifier,
  });
});