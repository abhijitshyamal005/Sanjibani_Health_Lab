import nodemailer from 'nodemailer';

let transporter = null;

function emailEnabled() {
  return process.env.EMAIL_ENABLED === 'true' && process.env.EMAIL && process.env.EMAIL_PASSWORD;
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
    });
  }
  return transporter;
}

/** Emails "sent" while NODE_ENV=test, so tests can assert who was notified. */
export const outbox = [];

/** Send an email. Never throws; when email is disabled it only logs a summary (outside tests). */
export async function sendEmail({ to, subject, html }) {
  if (!to) return;
  try {
    if (process.env.NODE_ENV === 'test') {
      outbox.push({ to, subject, html });
      return;
    }
    if (!emailEnabled()) {
      if (process.env.NODE_ENV !== 'test') console.log(`[email:disabled] to=${to} subject="${subject}"`);
      return;
    }
    await getTransporter().sendMail({ from: `"${BRAND.name}" <${process.env.EMAIL}>`, to, subject, html, replyTo: BRAND.supportEmail || undefined });
  } catch (err) {
    console.error(`[email:error] to=${to} subject="${subject}": ${err.message}`);
  }
}

/** Fire-and-forget helper for request handlers. */
export function notify(message) {
  sendEmail(message).catch(() => {});
}

export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const BRAND = {
  name: process.env.COMPANY_NAME || 'SanjiBani Health',
  supportEmail: process.env.SUPPORT_EMAIL || process.env.EMAIL || '',
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
    subject: 'Your SanjiBani password reset code',
    html: layout(
      'Reset your password',
      `<p style="margin:0 0 10px">Hi ${esc(name)}, use this code to reset your password. It expires in <b>15 minutes</b>.</p>
<p style="margin:18px 0;font-size:32px;letter-spacing:8px;font-weight:800;color:#ea580c;background:#fff7ed;border-radius:12px;padding:14px 0;text-align:center">${esc(code)}</p>
<p style="margin:0">If you didn't ask for this, you can ignore this email — your password won't change.</p>`
    ),
  }),
};
