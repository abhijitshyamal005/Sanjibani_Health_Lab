import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Delivery channels, first match wins:
 *  - GMAIL_SCRIPT_URL + GMAIL_SCRIPT_SECRET → Gmail via a Google Apps Script web app (see scripts/gmail-relay.gs);
 *    mail comes from a real @gmail.com sender, which Gmail trusts far more than a new or free domain
 *  - BREVO_API_KEY  → Brevo HTTPS API (free 300/day)
 *  - RESEND_API_KEY → Resend HTTPS API
 *  - EMAIL + EMAIL_PASSWORD → Gmail SMTP (local only: Render's free tier blocks SMTP ports 25/465/587)
 * HTTPS providers use port 443, which hosting platforms never block.
 */
export function emailChannel(env = process.env) {
  if (env.EMAIL_ENABLED !== 'true') return null;
  if (env.GMAIL_SCRIPT_URL && env.GMAIL_SCRIPT_SECRET) return 'gscript';
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

/** Plain-text alternative of an HTML email (spam filters penalise HTML-only mail). */
export function htmlToText(html = '') {
  return html
    .replace(/<(style|title|head)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<span style="display:none[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
      const t = label.replace(/<[^>]+>/g, '').trim();
      return !t || href.startsWith('mailto:') || href === t ? t : `${t} (${href})`;
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h1|h2|tr|div|table)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Build the HTTPS request for an API provider (exported for tests). */
export function httpRequest(channel, { to, subject, html, replyTo }, env = process.env) {
  const from = fromAddress(env);
  const name = env.COMPANY_NAME || 'SanjiBani Health';
  if (channel === 'gscript') {
    return {
      url: env.GMAIL_SCRIPT_URL,
      headers: { 'content-type': 'application/json' },
      body: { secret: env.GMAIL_SCRIPT_SECRET, to, subject, html, text: htmlToText(html), name, ...(replyTo ? { replyTo } : {}) },
    };
  }
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
  if (channel === 'gscript') {
    // Apps Script answers 200 even when the script fails, so read its own ok flag.
    const data = await res.json().catch(() => null);
    if (!data?.ok) throw new Error(`gscript: ${data?.error || 'unexpected response (is the web app deployed for "Anyone"?)'}`);
  }
  return res;
}

/** Emails "sent" while NODE_ENV=test (or EMAIL_CAPTURE=true on the e2e server), so tests can assert who was notified. */
export const outbox = [];

/** Send an email. Never throws; when email is disabled it only logs a summary (outside tests). */
export async function sendEmail({ to, subject, html, replyTo }) {
  if (!to) return;
  try {
    if (process.env.NODE_ENV === 'test') {
      outbox.push({ to, subject, html, replyTo });
      return;
    }
    if (process.env.EMAIL_CAPTURE === 'true') outbox.push({ to, subject, html, replyTo });
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
  name: process.env.COMPANY_NAME || 'SanjiBani Health',
  // EMAIL_REPLY_TO overrides every reply/contact address in emails (use it when the site domain hurts deliverability).
  supportEmail: process.env.EMAIL_REPLY_TO || process.env.SUPPORT_EMAIL || process.env.EMAIL || '',
  labsEmail: process.env.EMAIL_REPLY_TO || process.env.LABS_EMAIL || '',
  paymentsEmail: process.env.EMAIL_REPLY_TO || process.env.PAYMENTS_EMAIL || '',
  supportPhone: process.env.SUPPORT_PHONE || '',
  url: () => (process.env.APP_URL || (process.env.CLIENT_ORIGINS || '').split(',')[0] || '').trim().replace(/\/$/, ''),
};

/**
 * Base URL for every link and image inside emails. EMAIL_LINK_URL wins: spam filters check each linked domain
 * against blocklists, so emails can point at a clean host (e.g. the onrender.com URL) even if the main domain is listed.
 */
export function emailBaseUrl(env = process.env) {
  return (env.EMAIL_LINK_URL || env.APP_URL || (env.CLIENT_ORIGINS || '').split(',')[0] || 'http://localhost:5173').trim().replace(/\/$/, '');
}

/** Public site used for the logo and footer links — inbox images must load from a real https URL, never localhost. */
const CANONICAL = 'https://sanjibanilabs.onrender.com';
function publicSite() {
  const site = emailBaseUrl();
  return /^https:\/\//.test(site) ? site : CANONICAL;
}

/** Shared email colours: neutral greys, orange only for the call to action. */
export const MAIL = {
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
  accent: '#ea580c',
};

/** Branded, mobile-friendly email shell used by every message (table layout for email clients). */
export function layout(title, bodyHtml, { banner } = {}) {
  const site = publicSite();
  const host = site.replace(/^https?:\/\//, '');
  const contact = [BRAND.supportPhone && esc(BRAND.supportPhone), BRAND.supportEmail && `<a href="mailto:${esc(BRAND.supportEmail)}" style="color:${MAIL.muted}">${esc(BRAND.supportEmail)}</a>`]
    .filter(Boolean)
    .join(' &nbsp;|&nbsp; ');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${MAIL.text};-webkit-font-smoothing:antialiased">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(title)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
  <tr><td style="padding:0 0 28px">
    <a href="${site}" style="text-decoration:none;color:${MAIL.text}">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle"><img src="${site}/logo-512.png" width="36" height="36" alt="${esc(BRAND.name)}" style="display:block;border:0;border-radius:8px"></td>
        <td style="vertical-align:middle;padding-left:10px;font-size:18px;font-weight:700;letter-spacing:-.2px;color:${MAIL.text}">${esc(BRAND.name)}</td>
      </tr></table>
    </a>
  </td></tr>
  ${banner ? `<tr><td style="padding:0 0 28px"><img src="${site}/email/${banner}.jpg" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:8px"></td></tr>` : ''}
  <tr><td style="padding:0">
    <h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;font-weight:700;color:#111827">${esc(title)}</h1>
    <div style="font-size:15px;line-height:1.6;color:#374151">${bodyHtml}</div>
    <p style="margin:28px 0 0;font-size:15px;line-height:1.6;color:#374151">Regards,<br><b style="color:#111827">Team ${esc(BRAND.name)}</b></p>
  </td></tr>
  <tr><td style="padding:32px 0 0"><hr style="border:none;border-top:1px solid ${MAIL.border};margin:0 0 16px"></td></tr>
  <tr><td style="padding:0;font-size:12px;line-height:1.7;color:${MAIL.muted}">
    ${contact ? `Questions? ${contact}<br>` : 'Questions? Reply to this email.<br>'}
    You are receiving this email because of activity on your ${esc(BRAND.name)} account.<br>
    <a href="${site}" style="color:${MAIL.muted}">${esc(host)}</a> &nbsp;|&nbsp; <a href="${site}/legal/privacy" style="color:${MAIL.muted}">Privacy</a> &nbsp;|&nbsp; <a href="${site}/legal/terms" style="color:${MAIL.muted}">Terms</a>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

export const emails = {
  resetCode: (to, name, code) => ({
    to,
    subject: 'Your SanjiBani password reset code',
    html: layout(
      'Reset your password',
      `<p style="margin:0 0 10px">Hi ${esc(name)}, use this code to reset your password. It expires in <b>15 minutes</b>.</p>
<p style="margin:20px 0;font-size:30px;letter-spacing:8px;font-weight:700;color:#111827;font-family:Menlo,Consolas,monospace">${esc(code)}</p>
<p style="margin:0">If you didn't ask for this, you can ignore this email — your password won't change.</p>`
    ),
  }),
};
