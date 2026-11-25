import { expect, test } from '@playwright/test';
import { expectEmail, login, logout } from './helpers';

const LAB2 = { email: 'lab2@sanjibani.in', password: 'Lab@1234' }; // CarePoint Diagnostics

/** Open a lab page and add its first home-collection test to the cart. Returns the test name. */
async function addFromLab(page, labName) {
  await page.goto('/labs');
  await page.getByTestId('lab-card').filter({ hasText: labName }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(labName);
  const row = page.getByTestId('test-row').filter({ hasNotText: 'Lab visit only' }).first();
  const name = (await row.locator('h3').innerText()).trim();
  await row.getByTestId('add-to-cart').click();
  await expect(page.getByTestId('view-cart-bar')).toBeVisible();
  return name;
}

async function assign(page, code, collector) {
  await page.goto('/partner/bookings');
  await page.getByLabel('Search bookings').fill(code);
  const card = page.getByTestId('partner-booking').filter({ hasText: code });
  await expect(card.getByTestId('multi-lab-tag')).toBeVisible();
  const select = card.getByTestId('assign-collector');
  const value = await select.locator('option', { hasText: collector }).getAttribute('value');
  await select.selectOption(value);
  await expect(card.getByTestId('assign-row')).toContainText(collector);
}

test.describe.serial('One patient, tests from several labs', () => {
  const codes = {};

  test('patient books tests from two labs in one checkout', async ({ page, request }) => {
    await login(page, 'patient');
    await addFromLab(page, 'Lifeline Pathology');
    await addFromLab(page, 'CarePoint Diagnostics');
    // No "replace cart" prompt — both labs stay in the cart.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByTestId('view-cart-bar')).toContainText('from 2 labs');
    await page.getByTestId('view-cart-bar').click();

    await expect(page.getByTestId('multi-lab-note')).toContainText('2 labs');
    const parts = page.getByTestId('lab-part');
    await expect(parts).toHaveCount(2);
    const lifeline = page.locator('[data-testid="lab-part"][data-lab="Lifeline Pathology"]');
    const carepoint = page.locator('[data-testid="lab-part"][data-lab="CarePoint Diagnostics"]');
    await expect(page.getByTestId('summary-lab')).toHaveCount(2);

    // Two lab visits at the same time are blocked: the patient can't be in two places at once.
    await lifeline.getByTestId('collection-lab_visit').click();
    await carepoint.getByTestId('collection-lab_visit').click();
    await lifeline.getByTestId('time-slot').filter({ hasText: /available|left/ }).first().click();
    await carepoint.getByTestId('time-slot').filter({ hasText: /available|left/ }).first().click();
    await page.locator('input[name="patientAge"]').fill('34');
    await page.locator('select[name="patientGender"]').selectOption('male');
    await page.getByTestId('place-booking').click();
    await expect(carepoint.getByRole('alert')).toContainText('Same time as Lifeline Pathology');

    // Home collection from each lab, at different times.
    await lifeline.getByTestId('collection-home').click();
    await carepoint.getByTestId('collection-home').click();
    await lifeline.getByTestId('time-slot').filter({ hasText: /available|left/ }).nth(0).click();
    await carepoint.getByTestId('time-slot').filter({ hasText: /available|left/ }).nth(1).click();
    await expect(page.getByText('Collection address')).toBeVisible();
    await expect(page.getByTestId('place-booking')).toHaveText('Place 2 bookings');
    await page.getByTestId('place-booking').click();

    await expect(page).toHaveURL(/\/bookings\/[a-f0-9]{24}/);
    await expect(page.getByText('2 bookings placed — one with each lab')).toBeVisible();
    codes.lifeline = (await page.getByRole('heading', { level: 1 }).innerText()).replace('Booking #', '').trim();
    const sibling = page.getByTestId('order-sibling');
    await expect(sibling).toHaveCount(1);
    await expect(sibling).toContainText('CarePoint Diagnostics');
    await sibling.click();
    await expect(page.getByTestId('order-sibling')).toContainText('Lifeline Pathology');
    codes.carepoint = (await page.getByRole('heading', { level: 1 }).innerText()).replace('Booking #', '').trim();
    expect(codes.carepoint).not.toBe(codes.lifeline);
    await expect(page.getByTestId('cart-link')).not.toContainText(/\d/);

    // Each lab is told about its own booking.
    await expectEmail(request, 'patient@sanjibani.in', new RegExp(`Booking #${codes.lifeline} placed with Lifeline Pathology`));
    await expectEmail(request, 'patient@sanjibani.in', new RegExp(`Booking #${codes.carepoint} placed with CarePoint Diagnostics`));
    await expectEmail(request, null, new RegExp(`New booking #${codes.lifeline}`));
    await expectEmail(request, null, new RegExp(`New booking #${codes.carepoint}`));

    await page.goto('/bookings');
    await expect(page.getByTestId('booking-card').filter({ has: page.getByTestId('order-tag') })).toHaveCount(2);
    await logout(page);
  });

  test('each lab assigns its own sample collector', async ({ page }) => {
    await login(page, 'lab');
    await assign(page, codes.lifeline, 'Bikash Mondal');
    // Lifeline cannot see CarePoint's part of the order.
    await page.getByLabel('Search bookings').fill(codes.carepoint);
    await expect(page.getByTestId('partner-booking')).toHaveCount(0);
    await logout(page);

    await login(page, LAB2);
    await assign(page, codes.carepoint, 'Tanmoy Paul');
    await logout(page);
  });

  test('patient sees a different collector for each lab', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/bookings');
    await page.getByTestId('booking-card').filter({ hasText: codes.lifeline }).click();
    await expect(page.getByTestId('collector-tracker')).toContainText('Bikash Mondal');
    await expect(page.getByTestId('order-sibling')).toContainText('Collector: Tanmoy Paul');

    await page.getByTestId('order-sibling').click();
    await expect(page.getByTestId('collector-tracker')).toContainText('Tanmoy Paul');
    await expect(page.getByTestId('order-sibling')).toContainText('Collector: Bikash Mondal');
  });
});
