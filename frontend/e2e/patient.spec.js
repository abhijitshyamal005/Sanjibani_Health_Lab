import { expect, test } from '@playwright/test';
import { expectEmail, login } from './helpers';

test.describe('Patient', () => {
  test('home page shows categories, popular tests and labs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Lab tests from labs you trust');
    await expect(page.getByRole('button', { name: /Thyroid/ }).first()).toBeVisible();
    await expect(page.getByText('Most booked tests')).toBeVisible();
    await expect(page.getByTestId('lab-card').first()).toBeVisible();
    expect(await page.getByTestId('lab-card').count()).toBeGreaterThanOrEqual(5);
    // Pending lab must not be listed publicly
    await expect(page.getByText('Wellness Path Lab')).toHaveCount(0);
  });

  test('compare a test across labs, sorted by lowest price', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('search-input').fill('Lipid Profile');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/tests\?q=Lipid/);

    const group = page.getByTestId('compare-group').first();
    await expect(group.getByRole('heading')).toHaveText('Lipid Profile');
    const offers = group.getByTestId('offer-card');
    await expect(offers).toHaveCount(5);
    const prices = await offers.locator('p.text-lg').allInnerTexts();
    const nums = prices.map((p) => Number(p.replace(/[^\d]/g, '')));
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
  });

  test('city filter limits labs', async ({ page }) => {
    await page.goto('/labs');
    await page.getByTestId('city-select').first().selectOption('Kolkata');
    await expect(page.getByTestId('lab-card').first()).toBeVisible();
    const cards = await page.getByTestId('lab-card').allInnerTexts();
    expect(cards.length).toBeGreaterThanOrEqual(2);
    for (const c of cards) expect(c).toContain('Kolkata');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('in Kolkata');
  });

  test('cart holds tests from several labs, grouped by lab', async ({ page }) => {
    await page.goto('/tests?q=Vitamin D');
    const offers = page.getByTestId('offer-card');
    await offers.nth(0).getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-link')).toContainText('1');

    // A second lab is added alongside the first — no "replace cart" prompt.
    await offers.nth(1).getByTestId('add-to-cart').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('cart-link')).toContainText('2');

    await page.goto('/cart');
    await expect(page.getByTestId('lab-part')).toHaveCount(2);
    await expect(page.getByTestId('multi-lab-note')).toBeVisible();
    await page.getByTestId('lab-part').first().getByTestId('remove-lab').click();
    await expect(page.getByTestId('lab-part')).toHaveCount(1);
    await expect(page.getByTestId('multi-lab-note')).toHaveCount(0);
    await expect(page.getByTestId('cart-link')).toContainText('1');
  });

  test('book home collection, then cancel', async ({ page, request }) => {
    await page.goto('/labs');
    await page.getByTestId('lab-card').filter({ hasText: 'Lifeline Pathology' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lifeline Pathology');

    const row = page.getByTestId('test-row').filter({ hasText: 'Complete Blood Count' });
    await row.getByTestId('add-to-cart').click();
    await page.getByTestId('view-cart-bar').click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByTestId('cart-item')).toHaveCount(1);

    // Logged-out users are sent to log in and come back to the cart.
    await page.getByTestId('place-booking').click();
    await expect(page).toHaveURL(/\/login\?next=(%2F|\/)cart/);
    await page.getByLabel('Email').fill('patient@sanjibani.in');
    await page.getByLabel('Password', { exact: true }).fill('Patient@123');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/cart/);

    await page.getByTestId('collection-home').click();
    await page.getByTestId('time-slot').first().click();
    await page.locator('input[name="patientAge"]').fill('29');
    await page.locator('select[name="patientGender"]').selectOption('female');
    await page.getByTestId('place-booking').click();

    await expect(page).toHaveURL(/\/bookings\/[a-f0-9]{24}/);
    await expect(page.getByText('Pending').first()).toBeVisible();
    await expect(page.getByText('Complete Blood Count (CBC)')).toBeVisible();
    const code = (await page.getByRole('heading', { level: 1 }).innerText()).replace('Booking #', '').trim();
    await expectEmail(request, 'patient@sanjibani.in', new RegExp(`Booking #${code} placed with Lifeline Pathology`));
    await expectEmail(request, null, new RegExp(`New booking #${code}`));
    await expect(page.getByTestId('cart-link')).not.toContainText(/\d/);

    await page.getByTestId('cancel-booking').click();
    await page.getByTestId('confirm-cancel').click();
    await expect(page.getByText('Booking cancelled by patient')).toBeVisible();
    await expectEmail(request, 'patient@sanjibani.in', new RegExp(`Booking #${code} cancelled$`));
    await expectEmail(request, null, new RegExp(`Booking #${code} cancelled by patient`));
  });

  test('profile shows stats and saves changes', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/profile');
    await expect(page.getByText('Total bookings')).toBeVisible();
    await page.getByLabel('Area').fill('Gariahat');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Profile saved' })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Area')).toHaveValue('Gariahat');
  });

  test('patients cannot open lab or admin dashboards', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/admin');
    await expect(page).toHaveURL('/');
    await page.goto('/partner');
    await expect(page).toHaveURL('/');
  });
});
