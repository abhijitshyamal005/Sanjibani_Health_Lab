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
