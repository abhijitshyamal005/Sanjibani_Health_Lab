import { expect, test } from '@playwright/test';
import { login } from './helpers.js';

// The e2e API records every email it sends (EMAIL_CAPTURE) and lists them here.
const OUTBOX = 'http://localhost:5055/api/__e2e/outbox';

async function expectEmail(request, to, subject) {
  await expect
    .poll(async () => {
      const { items } = await (await request.get(OUTBOX)).json();
      return items.some((m) => (!to || m.to === to) && subject.test(m.subject));
    }, { message: `email to ${to || 'anyone'} matching ${subject}` })
    .toBe(true);
}

test('admin deactivating and reactivating a patient emails that patient', async ({ page, request }) => {
  await login(page, 'admin');
  await page.goto('/admin/users');
  await page.getByRole('tab', { name: 'Patients' }).click();
  const row = page.getByTestId('admin-user-row').filter({ hasText: 'sneha@example.com' });
  await row.getByRole('button', { name: 'Active' }).click();
  await expect(row.getByRole('button', { name: 'Deactivated' })).toBeVisible();
  await expectEmail(request, 'sneha@example.com', /account has been deactivated/);

  await row.getByRole('button', { name: 'Deactivated' }).click();
  await expect(row.getByRole('button', { name: 'Active' })).toBeVisible();
  await expectEmail(request, 'sneha@example.com', /account is active again/);
});

test('lab adding and removing a test emails the lab', async ({ page, request }) => {
  const name = `Email Check Panel ${Date.now()}`;
  await login(page, 'lab');
  await page.goto('/partner/tests');
  await page.getByTestId('add-test').click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('input[name="testName"]').fill(name);
  await dialog.locator('select[name="category"]').selectOption('Full Body Checkup');
  await dialog.locator('input[name="mrp"]').fill('900');
  await dialog.locator('input[name="price"]').fill('700');
  await dialog.getByTestId('save-test').click();
  const row = page.getByTestId('partner-test-row').filter({ hasText: name });
  await expect(row).toBeVisible();
  await expectEmail(request, null, new RegExp(`Test added: ${name}`));

  await row.getByRole('button', { name: `Delete ${name}` }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(row).toHaveCount(0);
  await expectEmail(request, null, new RegExp(`Test removed: ${name}`));
});

test('patient saving their profile gets an email', async ({ page, request }) => {
  await login(page, 'patient');
  await page.goto('/profile');
  await page.getByLabel('Area').fill('Salt Lake');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expectEmail(request, 'patient@sanjibani.in', /profile was updated/);
});
