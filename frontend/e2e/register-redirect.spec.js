import { expect, test } from '@playwright/test';

async function fillRegister(page, email) {
  await page.getByLabel(/Your name|Full name|Name/).first().fill('Redirect Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mobile number').fill('9811100077');
  await page.locator('input[name="password"]').fill('Redirect@123');
  await page.getByRole('button', { name: 'Create account' }).click();
}

test('signing up after opening a booking link lands on home, not that booking', async ({ page }) => {
  // A logged-out visitor opens a booking link (e.g. from an email) and is sent to login.
  await page.goto('/bookings/64b000000000000000000000');
  await expect(page).toHaveURL(/\/login\?next=%2Fbookings%2F/);
  await page.getByRole('link', { name: 'Create an account' }).click();
  await expect(page).toHaveURL(/\/register\?next=/);

  await fillRegister(page, `redir${Date.now()}@example.com`);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Booking not found')).toHaveCount(0);
});

test('signing up from the cart still returns to the cart', async ({ page }) => {
  await page.goto('/register?next=/cart');
  await fillRegister(page, `cartredir${Date.now()}@example.com`);
  await expect(page).toHaveURL(/\/cart$/);
});
