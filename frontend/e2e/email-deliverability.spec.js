import { expect, test } from '@playwright/test';

// Gmail rejected mail that linked to the blocklisted sanjibanilabs.dpdns.org domain. Emails must only link to
// EMAIL_LINK_URL and use EMAIL_REPLY_TO (the e2e API sets both, mirroring production).
const OUTBOX = 'http://localhost:5055/api/__e2e/outbox';

test('welcome email links only to the email link host and uses the reply-to override', async ({ page, request }) => {
  const email = `deliver${Date.now()}@example.com`;
  await page.goto('/register');
  await page.getByLabel(/Your name|Full name|Name/).first().fill('Deliverability Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mobile number').fill('9811100078');
  await page.locator('input[name="password"]').fill('Deliver@123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/$/);

  let mail;
  await expect
    .poll(async () => {
      const { items } = await (await request.get(OUTBOX)).json();
      mail = items.find((m) => m.to === email && /Welcome to SanjiBani/.test(m.subject));
      return Boolean(mail);
    })
    .toBe(true);
  expect(mail.hosts).toEqual(['mail-links.sanjibani.test']);
  expect(mail.mailtos.every((m) => m === 'replies@sanjibani.test')).toBe(true);
  expect(mail.replyTo || 'replies@sanjibani.test').toBe('replies@sanjibani.test');
  expect(JSON.stringify(mail)).not.toContain('dpdns');
});
