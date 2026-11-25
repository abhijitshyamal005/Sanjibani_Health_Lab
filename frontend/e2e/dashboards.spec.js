import { expect, test } from '@playwright/test';
import { login } from './helpers';

test.describe('Lab partner dashboard', () => {
  test('shows stats, charts and recent bookings', async ({ page }) => {
    await login(page, 'lab');
    await expect(page).toHaveURL(/\/partner/);
    await expect(page.getByRole('heading', { name: /Hello, Lifeline Pathology/ })).toBeVisible();
    for (const label of ['Total bookings', 'Revenue (completed)', 'Patients served', 'Active tests']) {
      await expect(page.getByText(label)).toBeVisible();
    }
    await expect(page.getByText('Bookings, last 7 days')).toBeVisible();
    await expect(page.getByText('Recent bookings')).toBeVisible();
  });

  test('edits a price and hides a test', async ({ page }) => {
    await login(page, 'lab');
    await page.goto('/partner/tests');
    const row = page.getByTestId('partner-test-row').filter({ hasText: 'Typhoid (Widal Test)' });
    await row.getByRole('button', { name: /Edit/ }).click();
    await page.getByRole('dialog').locator('input[name="price"]').fill('199');
    await page.getByTestId('save-test').click();
    await expect(row).toContainText('₹199');

    await row.getByRole('switch').click();
    await expect(row.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

    await page.goto('/tests?q=Typhoid');
    await expect(page.getByTestId('offer-card').filter({ hasText: 'Lifeline Pathology' })).toHaveCount(0);
  });
});

test.describe('Admin dashboard', () => {
  test('shows platform counts and users', async ({ page }) => {
    await login(page, 'admin');
    await expect(page.getByRole('heading', { name: 'Platform overview' })).toBeVisible();
    for (const label of ['Total users', 'Patients', 'Lab partners', 'Gross booking value']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await page.getByRole('link', { name: 'Users', exact: true }).click();
    await page.getByRole('tab', { name: 'Patients' }).click();
    await expect(page.getByTestId('admin-user-row').first()).toBeVisible();
    await expect(page.getByTestId('admin-user-row').filter({ hasText: 'patient@patholy.in' })).toBeVisible();
  });
});
