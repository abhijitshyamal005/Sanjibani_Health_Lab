/**
 * Gmail relay for the SanjiBani API (Google Apps Script).
 *
 * Why: Render's free tier blocks SMTP, and mail from a new/free domain is often rejected by Gmail.
 * This web app sends from the owner's Gmail over HTTPS instead.
 *
 * Setup: script.google.com → New project → paste this file → set SECRET (same value as GMAIL_SCRIPT_SECRET)
 * → Deploy → New deployment → Web app, Execute as: Me, Who has access: Anyone → copy the URL into GMAIL_SCRIPT_URL.
 * Quota: about 100 recipients/day on a personal Gmail account.
 */
const SECRET = 'REPLACE_WITH_GMAIL_SCRIPT_SECRET';

function doPost(e) {
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'invalid JSON' });
  }
  if (!d || d.secret !== SECRET) return json({ ok: false, error: 'unauthorized' });
  if (!d.to || !d.subject) return json({ ok: false, error: 'to and subject are required' });
  try {
    const options = { htmlBody: d.html || '', name: d.name || 'SanjiBani Health' };
    if (d.replyTo) options.replyTo = d.replyTo;
    MailApp.sendEmail(d.to, d.subject, d.text || 'Please open this email in an app that shows HTML.', options);
    return json({ ok: true, remaining: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
