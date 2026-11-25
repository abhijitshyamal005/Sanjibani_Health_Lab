import { expect, test } from '@playwright/test';
import { ACCOUNTS, login } from './helpers';

test.describe('Patholy brand', () => {
  test('the site shows the Patholy name and never the old one', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Patholy home' }).first()).toBeVisible();
    await expect(page).toHaveTitle(/Patholy/);
    await expect(page.getByRole('heading', { name: 'How Patholy works' })).toBeVisible();

    for (const path of ['/', '/labs', '/terms', '/privacy', '/contact', '/login']) {
      await page.goto(path);
      await expect(page.locator('main, body').first()).toBeVisible();
      const text = await page.locator('body').innerText();
      expect(text, `old brand on ${path}`).not.toMatch(/sanji\s*bani/i);
    }
  });

  test('demo accounts use the patholy.in addresses', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(ACCOUNTS.patient.email)).toBeVisible();
    await login(page, 'patient');
  });

  test('a visitor logged in under the old storage keys stays logged in', async ({ page }) => {
    await login(page, 'patient');
    // Put the session back under the pre-rename key, as an existing visitor would have it.
    await page.evaluate(() => {
      const token = localStorage.getItem('patholy.token');
      localStorage.removeItem('patholy.token');
      localStorage.setItem('sanjibani.token', token);
    });
    await page.goto('/bookings');
    await expect(page).toHaveURL(/\/bookings/);
    const keys = await page.evaluate(() => [localStorage.getItem('patholy.token') !== null, localStorage.getItem('sanjibani.token')]);
    expect(keys).toEqual([true, null]);
  });

  test('share image is served', async ({ request }) => {
    const res = await request.get('/og-image.png');
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('image/png');
  });
});

test.describe('Patholy brand on mobile', () => {
  test.use({ viewport: { width: 412, height: 915 } });
  test('logo fits on a phone', async ({ page }) => {
    await page.goto('/');
    const logo = page.getByRole('link', { name: 'Patholy home' }).first();
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('Patholy');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});
