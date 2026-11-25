import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emailChannel, fromAddress, httpRequest, sendViaHttp } from '../services/notify.js';

test('picks an HTTPS provider before SMTP, and nothing when disabled', () => {
  assert.equal(emailChannel({ EMAIL_ENABLED: 'false', BREVO_API_KEY: 'k' }), null);
  assert.equal(emailChannel({ EMAIL_ENABLED: 'true', BREVO_API_KEY: 'k', EMAIL: 'a@b.c', EMAIL_PASSWORD: 'p' }), 'brevo');
  assert.equal(emailChannel({ EMAIL_ENABLED: 'true', RESEND_API_KEY: 'k' }), 'resend');
  assert.equal(emailChannel({ EMAIL_ENABLED: 'true', EMAIL: 'a@b.c', EMAIL_PASSWORD: 'p' }), 'smtp');
  assert.equal(emailChannel({ EMAIL_ENABLED: 'true' }), null);
});

test('EMAIL_FROM overrides the Gmail account as sender', () => {
  assert.equal(fromAddress({ EMAIL: 'g@gmail.com' }), 'g@gmail.com');
  assert.equal(fromAddress({ EMAIL: 'g@gmail.com', EMAIL_FROM: ' care@x.org ' }), 'care@x.org');
});

test('builds the Brevo request', () => {
  const r = httpRequest('brevo', { to: 'p@x.com', subject: 'Hi', html: '<b>x</b>', replyTo: 'care@x.org' }, { BREVO_API_KEY: 'key1', EMAIL_FROM: 'noreply@x.org', COMPANY_NAME: 'SanjiBani' });
  assert.equal(r.url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(r.headers['api-key'], 'key1');
  assert.deepEqual(r.body, { sender: { name: 'SanjiBani', email: 'noreply@x.org' }, to: [{ email: 'p@x.com' }], subject: 'Hi', htmlContent: '<b>x</b>', replyTo: { email: 'care@x.org' } });
});

test('builds the Resend request', () => {
  const r = httpRequest('resend', { to: 'p@x.com', subject: 'Hi', html: 'h' }, { RESEND_API_KEY: 'rk', EMAIL_FROM: 'n@x.org' });
  assert.equal(r.headers.authorization, 'Bearer rk');
  assert.deepEqual(r.body, { from: 'SanjiBani Health <n@x.org>', to: ['p@x.com'], subject: 'Hi', html: 'h' });
});

test('sendViaHttp posts JSON and surfaces provider errors', async () => {
  let seen;
  const ok = async (url, init) => ((seen = { url, init }), { ok: true });
  await sendViaHttp('brevo', { to: 'p@x.com', subject: 's', html: 'h' }, { BREVO_API_KEY: 'k', EMAIL_FROM: 'f@x.org' }, ok);
  assert.equal(seen.init.method, 'POST');
  assert.equal(JSON.parse(seen.init.body).to[0].email, 'p@x.com');
  const bad = async () => ({ ok: false, status: 401, text: async () => '{"message":"Key not found"}' });
  await assert.rejects(sendViaHttp('brevo', { to: 'p@x.com', subject: 's', html: 'h' }, { BREVO_API_KEY: 'k', EMAIL_FROM: 'f' }, bad), /brevo 401: .*Key not found/);
});
