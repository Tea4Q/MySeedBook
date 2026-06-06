/**
 * notify-deletion-request
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase Edge Function — sends an email to the app owner when a user
 * has failed repeated password attempts and requests manual account deletion.
 *
 * Required Supabase secrets (set via dashboard or CLI):
 *   RESEND_API_KEY   — your Resend API key (https://resend.com)
 *   FROM_EMAIL       — verified sender address (e.g. noreply@myseedbook.app)
 *
 * Deploy:
 *   npx supabase functions deploy notify-deletion-request --project-ref fodtwysfcqltykejkffn
 * ─────────────────────────────────────────────────────────────────────────────
 */

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@myseedbook.app';
const NOTIFICATION_EMAIL = 'info@ChandraSEssentials.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured — deletion logged to DB only');
      return new Response(
        JSON.stringify({ success: true, warning: 'RESEND_API_KEY not set' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [NOTIFICATION_EMAIL],
        subject: '⚠️ Manual Account Deletion Request — MySeedBook',
        html: `
          <h2 style="color:#c0392b">Manual Account Deletion Request</h2>
          <p>A user has requested manual account deletion after multiple failed password attempts.</p>
          <table style="border-collapse:collapse;margin-top:12px">
            <tr>
              <td style="padding:6px 16px 6px 0;font-weight:bold;color:#555">User ID:</td>
              <td style="font-family:monospace">${userId}</td>
            </tr>
            <tr>
              <td style="padding:6px 16px 6px 0;font-weight:bold;color:#555">Email:</td>
              <td>${email}</td>
            </tr>
            <tr>
              <td style="padding:6px 16px 6px 0;font-weight:bold;color:#555">Requested at:</td>
              <td>${new Date().toISOString()}</td>
            </tr>
          </table>
          <p style="margin-top:20px;padding:12px;background:#fff3cd;border-left:4px solid #f59e0b;border-radius:4px">
            Please manually delete this account within <strong>48 hours</strong>.
          </p>
          <p style="color:#888;font-size:13px">
            The request is also recorded in the <code>pending_deletion</code> table in Supabase.
          </p>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend API error:', errText);
      return new Response(
        JSON.stringify({ error: errText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
