import { expect, test } from '@playwright/test';
import { bookingCode, expectEmail, login, logout } from './helpers';

const COLLECTOR = { email: 'collector1@sanjibani.in', password: 'Collector@123' };

test.describe.serial('Sample collector & assisted visit', () => {
  let code = '';

  test('patient books an assisted visit with live slot availability', async ({ page, request }) => {
    await login(page, 'patient');
    await page.goto('/labs');
    await page.getByTestId('lab-card').filter({ hasText: 'Lifeline Pathology' }).click();
    await page.getByTestId('test-row').filter({ hasText: 'Lipid Profile' }).getByTestId('add-to-cart').click();
    await page.getByTestId('view-cart-bar').click();

    await page.getByTestId('collection-assisted_visit').click();
    await expect(page.getByText('Pickup & drop address')).toBeVisible();
    const slot = page.getByTestId('time-slot').filter({ hasText: /available|left/ }).first();
    await expect(slot).toBeVisible();
    await slot.click();
    await page.locator('input[name="patientAge"]').fill('29');
    await page.getByTestId('place-booking').click();
    await expect(page).toHaveURL(/\/bookings\/[a-f0-9]{24}/);
    code = await bookingCode(page);
    expect(code).toMatch(/^SJB/);
    await expectEmail(request, 'patient@sanjibani.in', new RegExp(`Booking #${code} placed`));
    await expectEmail(request, null, new RegExp(`New booking #${code}`));
  });

  test('lab assigns a collector', async ({ page, request }) => {
    await login(page, 'lab');
    await page.goto('/partner/bookings');
    await page.getByLabel('Search bookings').fill(code);
    const card = page.getByTestId('partner-booking').filter({ hasText: code });
    await expect(card).toContainText('Assisted visit');
    const select = card.getByTestId('assign-collector');
    const value = await select.locator('option', { hasText: 'Bikash Mondal' }).getAttribute('value');
    await select.selectOption(value);
    await expect(card.getByTestId('assign-row')).toContainText('Bikash Mondal');
    await expectEmail(request, 'patient@sanjibani.in', new RegExp(`Bikash Mondal will take you to the lab — #${code}`));
    await expectEmail(request, COLLECTOR.email, new RegExp(`New job #${code}`));
    await page.getByRole('link', { name: 'Collectors', exact: true }).click();
    await expect(page.getByTestId('collector-card').filter({ hasText: 'Bikash Mondal' })).toBeVisible();
  });

  test('collector sees no prices, works through every step and earns', async ({ page, request }) => {
    await login(page, COLLECTOR);
    await expect(page).toHaveURL(/\/collector/);
    await page.getByRole('tab', { name: /Upcoming/ }).click();
    const job = page.getByTestId('collector-job').filter({ hasText: `#${code}` });
    await expect(job).toBeVisible();
    await expect(job).toContainText('Samples to collect');
    await expect(job).toContainText('Lipid Profile');
    await expect(job).toContainText('You earn');
    // Per-test prices must never be shown to collectors
    await expect(job).not.toContainText(/MRP|% off/);

    for (const label of ['Start — on the way', 'I have arrived', 'Patient picked up', 'Reached the lab with patient', 'Sample taken at the lab']) {
      await job.getByTestId('collector-next').click();
      if (label !== 'Sample taken at the lab') await expect(job.getByTestId('collector-next')).not.toHaveText(label);
    }
    // Every step emails the patient and the lab.
    for (const s of [/on the way — booking/, /has arrived — booking/, /On the way to the lab — booking/, /Reached the lab — booking/, /Sample collected — booking/]) {
      await expectEmail(request, 'patient@sanjibani.in', new RegExp(`${s.source.replace('booking', `booking #${code}`)}`));
    }
    for (const s of ['is on the way to', 'has reached', 'has picked up', 'has reached the lab with']) {
      await expectEmail(request, null, new RegExp(`Bikash Mondal ${s} .* — #${code}`));
    }
    await expectEmail(request, null, new RegExp(`Sample collected — booking #${code}`));
    await page.getByRole('tab', { name: 'Completed' }).click();
    const done = page.getByTestId('collector-job').filter({ hasText: `#${code}` });
    await done.getByTestId('collector-payment').click();
    await expect(done.getByTestId('collector-next')).toHaveText('Patient dropped home');
    await done.getByTestId('collector-next').click();
    await expect(done.getByTestId('collector-next')).toHaveCount(0);

    await page.getByRole('tab', { name: 'Earnings' }).click();
    await expect(page.getByTestId('earnings-month')).not.toHaveText('₹0');
    await logout(page);
  });

  test('patient sees the collector and live progress', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/bookings');
    await page.getByTestId('booking-card').filter({ hasText: code }).click();
    const tracker = page.getByTestId('collector-tracker');
    await expect(tracker).toContainText('Bikash Mondal');
    await expect(tracker).toContainText('Dropped home');
    await expect(page.getByText('Sample collected').first()).toBeVisible();
  });
});
