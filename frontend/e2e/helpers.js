import { expect } from '@playwright/test';

export const ACCOUNTS = {
  patient: { email: 'patient@sanjibani.in', password: 'Patient@123' },
  lab: { email: 'lab1@sanjibani.in', password: 'Lab@1234' },
  admin: { email: 'admin@sanjibani.in', password: 'Admin@123' },
};

export async function login(page, who, next) {
  const { email, password } = typeof who === 'string' ? ACCOUNTS[who] : who;
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : '/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function logout(page) {
  await page.evaluate(() => {
    localStorage.removeItem('sanjibani.token');
    localStorage.removeItem('sanjibani.cart');
  });
}

// The e2e API records every email it sends (EMAIL_CAPTURE) and lists them here.
const OUTBOX = 'http://localhost:5055/api/__e2e/outbox';

/** Wait until an email to `to` (any recipient when null) with a subject matching `subject` has been sent. */
export async function expectEmail(request, to, subject) {
  await expect
    .poll(async () => {
      const { items } = await (await request.get(OUTBOX)).json();
      return items.some((m) => (!to || m.to === to) && subject.test(m.subject));
    }, { message: `email to ${to || 'anyone'} matching ${subject}` })
    .toBe(true);
}
