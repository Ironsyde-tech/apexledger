import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL =
  Deno.env.get('SITE_URL') ?? 'https://primesociety.com';

// Brand
const NAVY = '#0B1F3A';
const GOLD = '#C9A24C';
const IVORY = '#F8F4EC';
const MUTED = '#5b6577';

function shell(title: string, bodyHtml: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${IVORY};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${NAVY};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${IVORY};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ece6d8;border-radius:8px;overflow:hidden;">
        <tr><td style="background:${NAVY};padding:24px 32px;">
          <div style="color:${GOLD};font-size:13px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">Apex Ledger</div>
        </td></tr>
        <tr><td style="padding:32px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #ece6d8;color:${MUTED};font-size:12px;line-height:1.6;">
          Apex Ledger &middot; This is an automated message.<br/>
          Need help? Reply to this email and our team will get back to you.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="background:${GOLD};border-radius:6px;">
    <a href="${href}" style="display:inline-block;padding:12px 22px;color:${NAVY};font-weight:700;text-decoration:none;font-size:14px;letter-spacing:.3px;">${label}</a>
  </td></tr></table>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;color:${MUTED};font-size:13px;width:140px;">${label}</td>
    <td style="padding:8px 0;color:${NAVY};font-size:14px;font-weight:600;">${value}</td>
  </tr>`;
}

function detailsTable(rows: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #ece6d8;border-bottom:1px solid #ece6d8;">${rows}</table>`;
}

async function callSendEmail(to: string, subject: string, html: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, subject, html }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`send-email failed: ${JSON.stringify(data)}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Auth guard: only accept calls bearing the service-role key
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${SERVICE_KEY}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.json();
    // Expected DB webhook payload: { type, table, record, old_record }
    const type: string = payload.type;
    const record = payload.record;
    const oldRecord = payload.old_record;

    if (!record || record.id === undefined) {
      return new Response(JSON.stringify({ skipped: 'no record' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decide which email to send
    let kind: 'pending' | 'confirmed' | 'rejected' | null = null;
    if (type === 'INSERT' && record.status === 'pending') kind = 'pending';
    else if (type === 'UPDATE' && oldRecord?.status !== record.status) {
      if (record.status === 'confirmed') kind = 'confirmed';
      else if (record.status === 'rejected') kind = 'rejected';
    }

    if (!kind) {
      return new Response(JSON.stringify({ skipped: 'no matching transition' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const [{ data: profile }, { data: course }, { data: payment }] = await Promise.all([
      supabase.from('profiles').select('email, full_name').eq('id', record.user_id).maybeSingle(),
      supabase.from('courses').select('title, slug').eq('id', record.course_id).maybeSingle(),
      supabase
        .from('payments')
        .select('usdt_network, usdt_tx_hash')
        .eq('order_id', record.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!profile?.email) {
      return new Response(JSON.stringify({ skipped: 'no recipient email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const studentName = profile.full_name || 'there';
    const courseTitle = course?.title || 'your course';
    const shortOrder = String(record.id).slice(0, 8).toUpperCase();
    const amount = `${Number(record.amount).toFixed(2)} ${record.currency || 'USD'}`;
    const network = payment?.usdt_network || '—';

    let subject = '';
    let html = '';

    if (kind === 'pending') {
      subject = `We received your payment for ${courseTitle}`;
      html = shell(
        subject,
        `<h1 style="margin:0 0 12px;font-size:22px;color:${NAVY};">Payment received, ${studentName}</h1>
         <p style="margin:0 0 12px;color:${MUTED};font-size:14px;line-height:1.6;">
           Thanks for your purchase. We've received your payment submission and our team is verifying the transaction on-chain.
         </p>
         ${detailsTable(
           row('Order ID', shortOrder) +
             row('Course', courseTitle) +
             row('Amount', amount) +
             row('Network', network),
         )}
         <p style="margin:0;color:${MUTED};font-size:14px;line-height:1.6;">
           You'll receive a confirmation email within <strong style="color:${NAVY};">6 hours</strong> once the payment is verified. Your course will unlock automatically.
         </p>`,
      );
    } else if (kind === 'confirmed') {
      subject = `Your course is unlocked: ${courseTitle}`;
      html = shell(
        subject,
        `<h1 style="margin:0 0 12px;font-size:22px;color:${NAVY};">Payment confirmed</h1>
         <p style="margin:0 0 12px;color:${MUTED};font-size:14px;line-height:1.6;">
           Welcome aboard, ${studentName}. Your payment for <strong style="color:${NAVY};">${courseTitle}</strong> has been verified and your course is now unlocked.
         </p>
         ${button(`${SITE_URL}/dashboard`, 'Go to Dashboard')}
         ${detailsTable(row('Order ID', shortOrder) + row('Course', courseTitle) + row('Amount', amount))}
         <p style="margin:0;color:${MUTED};font-size:14px;line-height:1.6;">
           Dive in whenever you're ready — your progress is saved automatically.
         </p>`,
      );
    } else if (kind === 'rejected') {
      subject = `We couldn't verify your payment for ${courseTitle}`;
      html = shell(
        subject,
        `<h1 style="margin:0 0 12px;font-size:22px;color:${NAVY};">Payment could not be verified</h1>
         <p style="margin:0 0 12px;color:${MUTED};font-size:14px;line-height:1.6;">
           Hi ${studentName}, unfortunately we were unable to verify the payment for the order below.
         </p>
         ${detailsTable(row('Order ID', shortOrder) + row('Course', courseTitle) + row('Amount', amount) + row('Network', network))}
         <p style="margin:0 0 12px;color:${MUTED};font-size:14px;line-height:1.6;">
           Please contact our support team and include your <strong style="color:${NAVY};">transaction hash</strong> so we can investigate. Just reply to this email.
         </p>`,
      );
    }

    await callSendEmail(profile.email, subject, html);

    return new Response(JSON.stringify({ ok: true, kind }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('order-email-dispatcher error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
