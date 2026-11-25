import { expect, test } from '@playwright/test';
import { login, logout } from './helpers';

test.describe('Invite & earn on a phone', () => {
  test('the invite button and page fit a phone screen', async ({ page }) => {
    await login(page, 'patient');
    const button = page.getByTestId('invite-button');
    await expect(button).toBeVisible();
    await button.click();
    await expect(page).toHaveURL(/\/invite$/);
    await expect(page.getByTestId('invite-link')).toBeVisible();
    await expect(page.getByTestId('invite-whatsapp')).toBeVisible();
    // No sideways scrolling.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await logout(page);
  });

  test('the invite banner shows on sign-up', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/invite');
    const link = await page.getByTestId('invite-link').inputValue();
    await logout(page);
    await page.goto(new URL(link).pathname + new URL(link).search);
    await expect(page.getByTestId('invite-banner')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
