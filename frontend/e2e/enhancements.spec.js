import { expect, test } from '@playwright/test';
import { login, logout } from './helpers';

// Minimal valid PDF for upload tests.
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'
);

test('search suggestions appear while typing', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('search-input').fill('thyr');
  const list = page.getByTestId('search-suggestions');
  await expect(list).toBeVisible();
  await list.getByRole('option').first().click();
  await expect(page).toHaveURL(/\/tests\?q=/);
  await expect(page.getByTestId('compare-group').first()).toBeVisible();
});

test('home shows offer strip, reviews and FAQ', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('offer-strip')).toContainText('SANJI15');
  await expect(page.getByTestId('testimonial').first()).toBeVisible();
  await page.getByRole('button', { name: 'Are the labs on Patholy verified?' }).click();
  await expect(page.getByText(/reviewed by our team before it goes live/)).toBeVisible();
});

test('coupon reduces the total and is saved on the booking', async ({ page }) => {
  await login(page, 'patient');
  await page.goto('/tests?q=Vitamin D');
  await page.getByTestId('offer-card').first().getByTestId('add-to-cart').click();
  await page.goto('/cart');
  const before = Number((await page.getByTestId('cart-total').innerText()).replace(/[^\d]/g, ''));

  await page.getByLabel('Coupon code').fill('NOPE99');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid coupon code');

  await page.getByLabel('Coupon code').fill('sanji15');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByTestId('coupon-applied')).toContainText('SANJI15');
  const discount = Number((await page.getByTestId('coupon-discount').innerText()).replace(/[^\d]/g, ''));
  expect(discount).toBeGreaterThan(0);
  await expect(page.getByTestId('cart-total')).toHaveText(`₹${(before - discount).toLocaleString('en-IN')}`);

  await page.getByTestId('collection-lab_visit').click();
  await page.getByTestId('time-slot').nth(2).click();
  await page.locator('input[name="patientAge"]').fill('29');
  await page.getByTestId('place-booking').click();
  await expect(page).toHaveURL(/\/bookings\/[a-f0-9]{24}/);
  await expect(page.getByText('Booking placed successfully!')).toBeVisible();
  await expect(page.getByText('Coupon SANJI15')).toBeVisible();
});

test('forgot password resets with the emailed code', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await page.getByLabel('Email').fill('amit@example.com');
  await page.getByRole('button', { name: 'Send code' }).click();
  // Email isn't configured in the test server, so the API returns the code for local development.
  const code = (await page.getByTestId('dev-code').locator('b').innerText()).trim();
  await page.getByLabel('6-digit code').fill('000000');
  await page.locator('input[name="newPassword"]').fill('NewPass@123');
  await page.getByRole('button', { name: 'Set new password' }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid or expired code');
  await page.getByLabel('6-digit code').fill(code);
  await page.getByRole('button', { name: 'Set new password' }).click();
  await expect(page).toHaveURL('/');
  await logout(page);
  await login(page, { email: 'amit@example.com', password: 'NewPass@123' });
});

test('lab uploads a PDF report and the patient downloads it', async ({ page }) => {
  await login(page, 'lab');
  await page.goto('/partner/bookings');
  await page.getByRole('tab', { name: /Sample collected/ }).click();
  const card = page.getByTestId('partner-booking').first();
  const patientName = (await card.locator('p.font-bold').first().innerText()).trim();
  await card.getByTestId('report-input').setInputFiles({ name: 'report.pdf', mimeType: 'application/pdf', buffer: PDF });
  await expect(card.getByText('Report uploaded')).toBeVisible();
  await card.getByTestId('advance-booking').click();
  await page.getByTestId('confirm-status').click();
  await logout(page);

  const emailFor = { 'Riya Sen': 'patient@patholy.in' };
  const email = emailFor[patientName] || `${patientName.split(' ')[0].toLowerCase()}@example.com`;
  const password = email === 'amit@example.com' ? 'NewPass@123' : 'Patient@123';
  await login(page, { email, password });
  await page.goto('/bookings');
  await page.getByTestId('booking-card').filter({ hasText: 'Lifeline Pathology' }).filter({ hasText: 'Report ready' }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('download-report').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^Patholy-Report-PTL.+\.pdf$/);
});

test('legal pages and help button', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Refunds & cancellation' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Refund & Cancellation Policy');
  await page.getByRole('link', { name: 'Privacy' }).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy Policy');
  await page.getByRole('button', { name: 'Get help' }).click();
  await expect(page.getByRole('link', { name: 'Chat on WhatsApp' })).toHaveAttribute('href', /wa\.me/);
});
