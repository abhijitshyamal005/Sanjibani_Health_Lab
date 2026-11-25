import { expect, test } from '@playwright/test';
import { login, logout } from './helpers';

/**
 * The whole marketplace loop across all three roles:
 * new lab registers → admin approves → lab lists a test → patient books it →
 * lab moves it through the pipeline → patient sees the report and reviews.
 */
test.describe.serial('Marketplace end-to-end', () => {
  const stamp = Date.now().toString().slice(-6);
  const labName = `Sunrise Diagnostics ${stamp}`;
  const testName = `Sunrise Wellness Panel ${stamp}`;
  const owner = { email: `sunrise${stamp}@example.com`, password: 'Sunrise@123' };

  test('new lab partner registers and submits lab details', async ({ page }) => {
    await page.goto('/register?role=lab');
    await expect(page.getByRole('heading', { name: 'Register your lab' })).toBeVisible();
    await page.getByLabel(/Your name/).fill('Meera Joshi');
    await page.getByLabel('Email').fill(owner.email);
    await page.getByLabel('Mobile number').fill('9811122233');
    await page.locator('input[name="password"]').fill(owner.password);
    await page.getByRole('button', { name: 'Continue to lab details' }).click();

    await expect(page).toHaveURL(/\/partner/);
    await page.locator('input[name="labName"]').fill(labName);
    await page.locator('input[name="tagline"]').fill('Open 24×7 with free home collection');
    await page.locator('input[name="labPhone"]').fill('03344556677');
    await page.locator('input[name="labAddress"]').fill('7 Camac Street');
    await page.locator('input[name="labArea"]').fill('Camac Street');
    await page.locator('input[name="labCity"]').fill('Kolkata');
    await page.locator('input[name="labPincode"]').fill('700017');
    await page.getByRole('button', { name: 'NABL' }).click();
    await page.getByTestId('save-lab').click();

    await expect(page.getByText('Your lab is under review')).toBeVisible();
    await expect(page.getByText('Pending approval').first()).toBeVisible();
  });

  test('lab partner adds a test while pending', async ({ page }) => {
    await login(page, owner);
    await page.goto('/partner/tests');
    await page.getByTestId('add-test').click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[name="testName"]').fill(testName);
    await dialog.locator('select[name="category"]').selectOption('Full Body Checkup');
    await dialog.locator('input[name="mrp"]').fill('2000');
    await dialog.locator('input[name="price"]').fill('2500');
    await dialog.getByTestId('save-test').click();
    await expect(dialog.getByRole('alert')).toContainText('cannot be higher than MRP');
    await dialog.locator('input[name="price"]').fill('999');
    await dialog.getByTestId('save-test').click();
    await expect(page.getByTestId('partner-test-row').filter({ hasText: testName })).toBeVisible();

    // Not public yet
    await page.goto(`/tests?q=${encodeURIComponent(testName)}`);
    await expect(page.getByText('No tests found')).toBeVisible();
  });

  test('admin sees the pending lab and approves it', async ({ page }) => {
    await login(page, 'admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText(/waiting for approval/)).toBeVisible();
    await expect(page.getByText('Patients', { exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Labs', exact: true }).click();
    await page.getByRole('tab', { name: /Pending approval/ }).click();
    const card = page.getByTestId('admin-lab').filter({ hasText: labName });
    await expect(card).toContainText('Meera Joshi');
    await card.getByTestId('approve-lab').click();
    await expect(page.getByRole('status').filter({ hasText: `${labName} → Live` })).toBeVisible();
    await page.getByRole('tab', { name: /Live/ }).click();
    await expect(page.getByTestId('admin-lab').filter({ hasText: labName })).toBeVisible();
  });

  test('patient finds the new lab’s test and books it', async ({ page }) => {
    await login(page, 'patient');
    await page.goto(`/tests?q=${encodeURIComponent(testName)}`);
    const offer = page.getByTestId('offer-card').first();
    await expect(offer).toContainText(labName);
    await offer.getByTestId('add-to-cart').click();
    await page.goto('/cart');
    await page.getByTestId('collection-lab_visit').click();
    await page.getByTestId('time-slot').last().click();
    await page.locator('input[name="patientAge"]').fill('31');
    await page.locator('select[name="patientGender"]').selectOption('female');
    await expect(page.getByTestId('cart-total')).toHaveText('₹999');
    await page.getByTestId('place-booking').click();
    await expect(page).toHaveURL(/\/bookings\/[a-f0-9]{24}/);
  });

  test('lab moves the booking from pending to completed', async ({ page }) => {
    await login(page, owner);
    await expect(page.getByText('Total bookings')).toBeVisible();
    await page.getByRole('link', { name: 'Bookings', exact: true }).click();

    const booking = page.getByTestId('partner-booking').filter({ hasText: testName });
    await expect(booking).toContainText('Riya Sen');
    await booking.getByTestId('advance-booking').click(); // confirm

    await page.getByRole('tab', { name: /Confirmed/ }).click();
    await booking.getByTestId('advance-booking').click(); // sample collected

    await page.getByRole('tab', { name: /Sample collected/ }).click();
    await booking.getByTestId('advance-booking').click(); // report ready → dialog
    await page.getByRole('dialog').locator('textarea').fill('Report emailed. All values normal.');
    await page.getByTestId('confirm-status').click();

    await page.getByRole('tab', { name: /Report ready/ }).click();
    await booking.getByTestId('advance-booking').click(); // complete
    await page.getByRole('tab', { name: /Completed/ }).click();
    await expect(booking.getByText('Completed')).toBeVisible();

    await page.getByRole('link', { name: 'Patients', exact: true }).click();
    await expect(page.getByRole('cell', { name: /Riya Sen/ })).toBeVisible();
    await logout(page);
  });

  test('patient sees the report and leaves a review', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/bookings');
    await page.getByRole('tab', { name: /Past/ }).click();
    await page.getByTestId('booking-card').filter({ hasText: labName }).click();
    await expect(page.getByText('Your report is ready')).toBeVisible();
    await expect(page.getByText('Report emailed. All values normal.')).toBeVisible();

    await page.getByRole('radio', { name: '4 stars' }).click();
    await page.getByPlaceholder(/Tell other patients/).fill('Quick and professional.');
    await page.getByRole('button', { name: 'Submit review' }).click();
    await expect(page.getByText('You reviewed this booking')).toBeVisible();

    await page.goto('/labs?q=Sunrise');
    await page.getByTestId('lab-card').filter({ hasText: labName }).click();
    await expect(page.getByText('Quick and professional.')).toBeVisible();
  });
});
