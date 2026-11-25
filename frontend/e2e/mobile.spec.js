import { expect, test } from '@playwright/test';

test('home page fits a phone screen without horizontal scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
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
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'test-results/mobile-multi-lab-cart.png', fullPage: true });
});
