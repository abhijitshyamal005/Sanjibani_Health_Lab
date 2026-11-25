import { expect, test } from '@playwright/test';
import { login, logout } from './helpers';

test('free UPI: patient pays by QR + UTR, admin confirms, patient sees it paid', async ({ page }) => {
  await login(page, 'patient');
  await page.goto('/labs');
  await page.getByTestId('lab-card').filter({ hasText: 'Pulse Diagnostics' }).click();
  await page.getByTestId('test-row').first().getByTestId('add-to-cart').click();
  await page.getByTestId('view-cart-bar').click();
  await page.getByTestId('collection-lab_visit').click();
  await page.getByTestId('time-slot').filter({ hasText: /available|left/ }).nth(1).click();
  await page.locator('input[name="patientAge"]').fill('29');
  await page.getByTestId('pay-upi_direct').click();
  await expect(page.getByTestId('place-booking')).toContainText('via UPI');
  await page.getByTestId('place-booking').click();

  await expect(page).toHaveURL(/\/bookings\/[a-f0-9]{24}/);
  const upi = page.getByTestId('upi-pay');
  await expect(upi.getByRole('img', { name: /UPI QR code/ })).toBeVisible();
  await expect(upi).toContainText('sanjibani-test@okhdfcbank');
  const code = (await page.getByRole('heading', { level: 1 }).innerText()).replace('Booking #', '').trim();
  const utr = String(Date.now()).slice(-12).padStart(12, '7');
  await upi.locator('input[name="utr"]').fill(utr);
  await upi.getByTestId('submit-utr').click();
  await expect(page.getByText('UPI payment submitted')).toBeVisible();
  await logout(page);

  await login(page, 'admin');
  await page.goto('/admin/bookings');
  const row = page.getByTestId('admin-upi-queue').locator('div').filter({ hasText: code }).first();
  await expect(row).toContainText(utr);
  await row.getByTestId('admin-confirm-upi').click();
  await expect(page.getByRole('status').filter({ hasText: `Payment confirmed for #${code}` })).toBeVisible();
  await logout(page);

  await login(page, 'patient');
  await page.goto('/bookings');
  await page.getByTestId('booking-card').filter({ hasText: code }).click();
  await expect(page.getByText('Paid by UPI')).toBeVisible();
  await expect(page.getByText(`UPI transaction ID ${utr}`)).toBeVisible();
});
