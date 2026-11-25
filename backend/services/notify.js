import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Delivery channels, first match wins:
 *  - BREVO_API_KEY  → Brevo HTTPS API (free 300/day)
 *  - RESEND_API_KEY → Resend HTTPS API
 *  - EMAIL + EMAIL_PASSWORD → Gmail SMTP (local only: Render's free tier blocks SMTP ports 25/465/587)
 * HTTPS providers use port 443, which hosting platforms never block.
 */
export function emailChannel(env = process.env) {
  if (env.EMAIL_ENABLED !== 'true') return null;
  if (env.BREVO_API_KEY) return 'brevo';
  if (env.RESEND_API_KEY) return 'resend';
  if (env.EMAIL && env.EMAIL_PASSWORD) return 'smtp';
  return null;
}

/** The From address: EMAIL_FROM (a verified sender at the provider), else the Gmail account. */
export function fromAddress(env = process.env) {
  return (env.EMAIL_FROM || env.EMAIL || '').trim();
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
      connectionTimeout: 15000,
    });
  }
  return transporter;
}

/** Build the HTTPS request for an API provider (exported for tests). */
export function httpRequest(channel, { to, subject, html, replyTo }, env = process.env) {
  const from = fromAddress(env);
  const name = env.COMPANY_NAME || 'Patholy';
  if (channel === 'brevo') {
    return {
      url: 'https://api.brevo.com/v3/smtp/email',
      headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: { sender: { name, email: from }, to: [{ email: to }], subject, htmlContent: html, ...(replyTo ? { replyTo: { email: replyTo } } : {}) },
    };
  }
  return {
    url: 'https://api.resend.com/emails',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: { from: `${name} <${from}>`, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) },
  };
}

/** Send through an HTTPS API provider. Throws with the provider's message on failure. */
export async function sendViaHttp(channel, message, env = process.env, fetchImpl = fetch) {
  const { url, headers, body } = httpRequest(channel, message, env);
  const res = await fetchImpl(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${channel} ${res.status}: ${text.slice(0, 300)}`);
  }
  return res;
}

/** Emails "sent" while NODE_ENV=test, so tests can assert who was notified. */
export const outbox = [];

/** Send an email. Never throws; when email is disabled it only logs a summary (outside tests). */
export async function sendEmail({ to, subject, html, replyTo }) {
  if (!to) return;
  try {
    if (process.env.NODE_ENV === 'test') {
      outbox.push({ to, subject, html, replyTo });
      return;
    }
    const channel = emailChannel();
    if (!channel) {
      console.log(`[email:disabled] to=${to} subject="${subject}"`);
      return;
    }
    const reply = replyTo || BRAND.supportEmail || undefined;
    if (channel === 'smtp') {
      await getTransporter().sendMail({ from: `"${BRAND.name}" <${fromAddress()}>`, to, subject, html, replyTo: reply });
    } else {
      await sendViaHttp(channel, { to, subject, html, replyTo: reply });
    }
    console.log(`[email:sent] via=${channel} to=${to} subject="${subject}"`);
  } catch (err) {
    console.error(`[email:error] to=${to} subject="${subject}": ${err.message}`);
  }
}

/** Fire-and-forget helper for request handlers. */
export function notify(message) {
  sendEmail(message).catch(() => {});
}

export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const BRAND = {
  name: process.env.COMPANY_NAME || 'Patholy',
  supportEmail: process.env.SUPPORT_EMAIL || process.env.EMAIL || '',
  labsEmail: process.env.LABS_EMAIL || '',
  paymentsEmail: process.env.PAYMENTS_EMAIL || '',
  supportPhone: process.env.SUPPORT_PHONE || '',
  url: () => (process.env.APP_URL || (process.env.CLIENT_ORIGINS || '').split(',')[0] || '').trim().replace(/\/$/, ''),
};

/** Branded, mobile-friendly email shell used by every message (table layout for email clients). */
export function layout(title, bodyHtml) {
  const site = BRAND.url();
  const contact = [BRAND.supportPhone && `📞 ${esc(BRAND.supportPhone)}`, BRAND.supportEmail && `✉️ ${esc(BRAND.supportEmail)}`].filter(Boolean).join(' &nbsp;·&nbsp; ');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#1f2937">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(title)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb">
  <tr><td style="background:linear-gradient(90deg,#ea580c,#fb923c);background-color:#f97316;padding:20px 28px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:.3px">Sanji<span style="color:#dcfce7">Bani</span></td>
      <td align="right" style="font-size:12px;color:#ffedd5">Lab tests · Home collection · Reports</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 8px">
    <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#111827">${esc(title)}</h1>
    <div style="font-size:15px;line-height:1.55;color:#374151">${bodyHtml}</div>
  </td></tr>
  <tr><td style="padding:8px 28px 24px">
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:16px 0">
    <p style="margin:0;font-size:13px;color:#6b7280">Need help? ${contact || 'Reply to this email.'}</p>
  </td></tr>
  <tr><td style="background:#14532d;background-image:linear-gradient(90deg,#14532d,#0f766e);padding:16px 28px;color:#d1fae5;font-size:12px;line-height:1.6">
    <b style="color:#ffffff">${esc(BRAND.name)}</b> — compare prices from verified labs and book tests near you.<br>
    ${site ? `<a href="${site}" style="color:#bbf7d0">${esc(site.replace(/^https?:\/\//, ''))}</a> · <a href="${site}/legal/privacy" style="color:#bbf7d0">Privacy</a> · <a href="${site}/legal/terms" style="color:#bbf7d0">Terms</a>` : ''}<br>
    <span style="color:#a7f3d0">You received this email because of activity on your ${esc(BRAND.name)} account.</span>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

export const emails = {
  resetCode: (to, name, code) => ({
    to,
    subject: 'Your Patholy password reset code',
    html: layout(
      'Reset your password',
      `<p style="margin:0 0 10px">Hi ${esc(name)}, use this code to reset your password. It expires in <b>15 minutes</b>.</p>
<p style="margin:18px 0;font-size:32px;letter-spacing:8px;font-weight:800;color:#ea580c;background:#fff7ed;border-radius:12px;padding:14px 0;text-align:center">${esc(code)}</p>
<p style="margin:0">If you didn't ask for this, you can ignore this email — your password won't change.</p>`
    ),
  }),
};
