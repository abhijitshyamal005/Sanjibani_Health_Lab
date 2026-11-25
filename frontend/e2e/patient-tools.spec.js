import { expect, test } from '@playwright/test';
import { bookingCode, expectEmail, login, logout } from './helpers';

const MEMBER = { name: 'Mita Sen', relation: 'mother', gender: 'female', dob: '1962-04-11' };
const ageOf = (dob) => {
  const [y, m, d] = dob.split('-').map(Number);
  const now = new Date();
  return now.getFullYear() - y - (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d) ? 1 : 0);
};

test.describe('Patient tools: family, reschedule, book again', () => {
  test('save a family member, book for them, reschedule, cancel and book again', async ({ page, request }) => {
    await login(page, 'patient');

    // 1. Save a family member on the profile.
    await page.goto('/profile');
    const family = page.getByTestId('family-section');
    await family.getByTestId('add-family').click();
    const dialog = page.getByRole('dialog', { name: 'Add family member' });
    await dialog.locator('input[name="familyName"]').fill(MEMBER.name);
    await dialog.locator('select[name="familyRelation"]').selectOption(MEMBER.relation);
    await dialog.locator('select[name="familyGender"]').selectOption(MEMBER.gender);
    await dialog.locator('input[name="familyDob"]').fill(MEMBER.dob);
    await dialog.getByTestId('save-family').click();
    await expect(dialog).toBeHidden();
    const card = family.getByTestId('family-member').filter({ hasText: MEMBER.name });
    await expect(card).toContainText(`Mother · ${ageOf(MEMBER.dob)} yrs`);

    // Edit keeps the list in sync.
    await card.getByRole('button', { name: `Edit ${MEMBER.name}` }).click();
    await page.getByRole('dialog', { name: 'Edit family member' }).locator('input[name="familyPhone"]').fill('9876500002');
    await page.getByTestId('save-family').click();
    await expect(card).toContainText('9876500002');

    // 2. Book a lab visit for them — one tap fills the patient details.
    await page.goto('/labs');
    await page.getByTestId('lab-card').filter({ hasText: 'Lifeline Pathology' }).click();
    await page.getByTestId('test-row').filter({ hasText: 'Complete Blood Count' }).getByTestId('add-to-cart').click();
    await page.goto('/cart');
    await page.getByTestId('patient-choice').filter({ hasText: MEMBER.name }).click();
    await expect(page.locator('input[name="patientName"]')).toHaveValue(MEMBER.name);
    await expect(page.locator('input[name="patientAge"]')).toHaveValue(String(ageOf(MEMBER.dob)));
    await expect(page.locator('select[name="patientGender"]')).toHaveValue('female');
    await expect(page.locator('input[name="patientPhone"]')).toHaveValue('9876500002');
    // Switching back to "Myself" restores the account holder.
    await page.getByTestId('patient-choice').filter({ hasText: 'Myself' }).click();
    await expect(page.locator('input[name="patientName"]')).not.toHaveValue(MEMBER.name);
    await page.getByTestId('patient-choice').filter({ hasText: MEMBER.name }).click();

    await page.getByTestId('collection-lab_visit').click();
    await page.getByTestId('time-slot').first().click();
    await page.getByTestId('place-booking').click();
    await expect(page).toHaveURL(/\/bookings\/[a-f0-9]{24}/);
    await expect(page.getByText(`Patient: ${MEMBER.name}`)).toBeVisible();
    const code = await bookingCode(page);

    // 3. Reschedule to another day.
    await page.getByTestId('reschedule-booking').click();
    const rs = page.getByRole('dialog', { name: 'Reschedule booking' });
    await expect(rs).toContainText('You can reschedule 3 more times');
    await rs.getByTestId('reschedule-date').nth(3).click();
    await rs.getByTestId('reschedule-slot').filter({ hasText: 'available' }).first().click();
    await rs.locator('input').last().fill('Travelling');
    await rs.getByTestId('confirm-reschedule').click();
    await expect(rs).toBeHidden();
    await expect(page.getByTestId('rescheduled-note')).toBeVisible();
    await expectEmail(request, 'patient@sanjibani.in', new RegExp(`Booking #${code} moved to`));
    await expectEmail(request, null, new RegExp(`Booking #${code} rescheduled to`));

    // The lab sees the change on its board.
    const patientUrl = page.url();
    await logout(page);
    await login(page, 'lab');
    await page.goto('/partner/bookings');
    await expect(page.getByTestId('partner-booking').filter({ hasText: code })).toContainText('Rescheduled');
    await logout(page);

    // 4. Cancel, then book the same tests again.
    await login(page, 'patient');
    await page.goto(patientUrl);
    await expect(page.getByTestId('book-again')).toHaveCount(0); // not while the booking is active
    await page.getByTestId('cancel-booking').click();
    await page.getByTestId('confirm-cancel').click();
    await expect(page.getByText('Booking cancelled by patient')).toBeVisible();
    await expect(page.getByTestId('reschedule-booking')).toHaveCount(0);
    await page.getByTestId('book-again').click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
    await expect(page.getByTestId('cart-item')).toContainText('Complete Blood Count');

    // 5. Remove the family member.
    await page.goto('/profile');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: `Remove ${MEMBER.name}` }).click();
    await expect(page.getByTestId('family-member')).toHaveCount(0);
  });
});
