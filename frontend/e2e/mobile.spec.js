import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('home page fits a phone screen without horizontal scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - 412);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('link', { name: 'Compare tests' }).last()).toBeVisible();
});

test('header logo and menu button fit side by side on a phone', async ({ page }) => {
  await page.goto('/');
  const logo = page.getByRole('banner').getByRole('link', { name: 'Sanjibani home' });
  await expect(logo).toBeVisible();
  await expect(logo.getByTestId('logo-tagline')).toBeVisible();
  const menu = page.getByRole('button', { name: 'Menu' });
  const [l, m] = [await logo.boundingBox(), await menu.boundingBox()];
  expect(l.x + l.width).toBeLessThanOrEqual(m.x);
  await page.screenshot({ path: 'test-results/mobile-logo.png', clip: { x: 0, y: 0, width: 412, height: 80 } });
});

test('multi-lab checkout fits a phone screen', async ({ page }) => {
  await page.goto('/tests?q=Vitamin D');
  const offers = page.getByTestId('offer-card');
  await offers.nth(0).getByTestId('add-to-cart').click();
  await offers.nth(1).getByTestId('add-to-cart').click();
  await page.goto('/cart');
  await expect(page.getByTestId('lab-part')).toHaveCount(2);
  await expect(page.getByTestId('multi-lab-note')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - 412);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'test-results/mobile-multi-lab-cart.png', fullPage: true });
});

test('family members and reschedule dialog fit a phone screen', async ({ page }) => {
  await login(page, 'patient');
  await page.goto('/profile#family');
  await expect(page.getByTestId('family-section')).toBeVisible();
  await page.getByTestId('add-family').click();
  await expect(page.getByRole('dialog', { name: 'Add family member' })).toBeVisible();
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth - 412);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.keyboard.press('Escape');

  // Book a fresh lab visit so there is always a booking that can be rescheduled.
  await page.goto('/labs');
  await page.getByTestId('lab-card').filter({ hasText: 'Lifeline Pathology' }).click();
  await page.getByTestId('test-row').filter({ hasText: 'Complete Blood Count' }).getByTestId('add-to-cart').click();
  await page.goto('/cart');
  await page.getByTestId('collection-lab_visit').click();
  await page.getByTestId('time-slot').first().click();
  await page.locator('input[name="patientAge"]').fill('29');
  await page.locator('select[name="patientGender"]').selectOption('female');
  await page.getByTestId('place-booking').click();
  await expect(page).toHaveURL(/\/bookings\/[a-f0-9]{24}/);

  await page.getByTestId('reschedule-booking').click();
  const dialog = page.getByRole('dialog', { name: 'Reschedule booking' });
  await expect(dialog.getByTestId('reschedule-slot').first()).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box.width).toBeLessThanOrEqual(412);
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - 412);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'test-results/mobile-reschedule.png' });
  await dialog.getByRole('button', { name: 'Keep current slot' }).click();
  await page.getByTestId('cancel-booking').click();
  await page.getByTestId('confirm-cancel').click();
  await expect(page.getByText('Booking cancelled by patient')).toBeVisible();
});

// Phones widen the layout viewport when content overflows, so compare with the device width, not innerWidth.
async function expectNoSideScroll(page, label) {
  const { width } = page.viewportSize();
  const wide = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(wide, `${label} is wider than the phone`).toBeLessThanOrEqual(width);
}

test('main pages never scroll sideways on a phone', async ({ page }) => {
  for (const path of ['/', '/labs', '/tests?q=Vitamin D', '/legal/terms']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSideScroll(page, path);
  }
  await page.goto('/labs');
  await page.getByTestId('lab-card').filter({ hasText: 'Lifeline Pathology' }).click();
  await expect(page.getByTestId('test-row').first()).toBeVisible();
  await expectNoSideScroll(page, 'lab page');

  await login(page, 'patient');
  for (const path of ['/profile', '/bookings', '/cart']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expectNoSideScroll(page, path);
  }
  await page.goto('/bookings');
  await page.getByTestId('booking-card').first().click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Booking #');
  await expectNoSideScroll(page, 'booking detail');
});
