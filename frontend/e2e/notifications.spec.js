import { expect, test } from '@playwright/test';
import { expectEmail, login } from './helpers.js';

test('a new patient gets a welcome email', async ({ page, request }) => {
  const email = `welcome${Date.now()}@example.com`;
  await page.goto('/register');
  await page.getByLabel(/Your name|Full name|Name/).first().fill('Welcome Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mobile number').fill('9811100099');
  await page.locator('input[name="password"]').fill('Welcome@123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).not.toHaveURL(/\/register/);
  await expectEmail(request, email, /^Welcome to SanjiBani$/);
});

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
