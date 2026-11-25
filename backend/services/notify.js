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

/** Send an email. Never throws; when email is disabled it only logs a summary (outside tests). */
export async function sendEmail({ to, subject, html }) {
  if (!to) return;
  try {
    if (!emailEnabled()) {
      if (process.env.NODE_ENV !== 'test') console.log(`[email:disabled] to=${to} subject="${subject}"`);
      return;
    }
    await getTransporter().sendMail({ from: `"SanjiBani" <${process.env.EMAIL}>`, to, subject, html });
  } catch (err) {
    console.error(`[email:error] to=${to} subject="${subject}": ${err.message}`);
  }
}

/** Fire-and-forget helper for request handlers. */
export function notify(message) {
  sendEmail(message).catch(() => {});
}

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
<tr><td style="background:#f97316;padding:18px 24px;color:#fff;font-size:22px;font-weight:bold">SanjiBani</td></tr>
<tr><td style="padding:24px"><h2 style="margin:0 0 12px;font-size:18px">${esc(title)}</h2>${bodyHtml}</td></tr>
<tr><td style="padding:14px 24px;background:#f0fdf4;color:#15803d;font-size:12px">Book lab tests from trusted labs near you · SanjiBani</td></tr>
</table></body></html>`;
}

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  sample_collected: 'Sample collected',
  report_ready: 'Report ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const COLLECTION_LABEL = { home: 'Home collection', lab_visit: 'Lab visit', assisted_visit: 'Assisted visit (pickup, lab visit & drop)' };

function bookingSummary(b, labName) {
  const items = b.items.map((i) => `<li>${esc(i.name)} — ₹${i.price}</li>`).join('');
  return `<p style="margin:0 0 8px"><b>Booking #${esc(b.code)}</b> at <b>${esc(labName)}</b></p>
<p style="margin:0 0 8px">${esc(b.slot.date)} · ${esc(b.slot.time)} · ${COLLECTION_LABEL[b.collectionType] || 'Lab visit'}</p>
<ul style="padding-left:18px;margin:8px 0">${items}</ul>
<p style="margin:8px 0 0"><b>Total: ₹${b.total}</b>${b.discount ? ` (you saved ₹${b.discount} with ${esc(b.couponCode)})` : ''}</p>`;
}

export const emails = {
  bookingPlacedPatient: (b, lab, to) => ({
    to,
    subject: `Booking #${b.code} placed with ${lab.name}`,
    html: layout('Your booking is placed', `<p>Hi ${esc(b.patient.name)}, the lab will confirm your booking shortly.</p>${bookingSummary(b, lab.name)}`),
  }),
  bookingPlacedLab: (b, lab, to) => ({
    to,
    subject: `New booking #${b.code} — ${b.patient.name}`,
    html: layout('You have a new booking', `<p>Please confirm it from your SanjiBani partner dashboard.</p>${bookingSummary(b, lab.name)}
<p style="margin:8px 0 0">Patient: ${esc(b.patient.name)}, ${b.patient.age} yrs, ${esc(b.patient.phone)}</p>`),
  }),
  bookingStatus: (b, labName, to, note) => ({
    to,
    subject: `Booking #${b.code} is now ${STATUS_LABEL[b.status] || b.status}`,
    html: layout(`Booking update: ${STATUS_LABEL[b.status] || b.status}`, `${note ? `<p>${esc(note)}</p>` : ''}${bookingSummary(b, labName)}`),
  }),
  labStatus: (lab, to) => ({
    to,
    subject: `Your lab ${lab.name} is ${lab.status === 'approved' ? 'now live on SanjiBani' : lab.status}`,
    html: layout(
      lab.status === 'approved' ? 'Your lab is live!' : `Lab status: ${lab.status}`,
      `<p>${lab.status === 'approved' ? 'Patients can now find and book tests at your lab.' : 'Please review the note below and update your lab profile.'}</p>${lab.statusNote ? `<p><b>Note:</b> ${esc(lab.statusNote)}</p>` : ''}`
    ),
  }),
  collectorAssigned: (b, labName, collector, to) => ({
    to,
    subject: `${collector.name} will ${b.collectionType === 'assisted_visit' ? 'escort you to the lab' : 'collect your sample'} — booking #${b.code}`,
    html: layout(
      'Your sample collector is assigned',
      `<p><b>${esc(collector.name)}</b> (${esc(collector.phone)}) from ${esc(labName)} will ${b.collectionType === 'assisted_visit' ? 'pick you up, stay with you at the lab and drop you back home' : 'visit you to collect your sample'}.</p>${bookingSummary(b, labName)}`
    ),
  }),
  collectorOnTheWay: (b, labName, collector, to) => ({
    to,
    subject: `Your collector is on the way — booking #${b.code}`,
    html: layout('Your collector is on the way', `<p><b>${esc(collector.name)}</b> (${esc(collector.phone)}) is on the way to you. Please keep your booking code <b>${esc(b.code)}</b> handy.</p>${bookingSummary(b, labName)}`),
  }),
  resetCode: (to, name, code) => ({
    to,
    subject: 'Your SanjiBani password reset code',
    html: layout('Reset your password', `<p>Hi ${esc(name)}, use this code to reset your password. It expires in 15 minutes.</p>
<p style="font-size:28px;letter-spacing:6px;font-weight:bold;color:#ea580c">${esc(code)}</p><p>If you didn't ask for this, you can ignore this email.</p>`),
  }),
};
