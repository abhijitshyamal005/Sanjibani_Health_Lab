import { expect, test } from '@playwright/test';
import { expectEmail, login, logout } from './helpers';

const API = 'http://localhost:5055/api';
const FRIEND = { name: 'Asha Roy', email: 'asha.invite@example.org', phone: '9876511122', password: 'secret12' };

/** Put one test worth ₹500+ from Lifeline Pathology in the cart, the way the app stores it. */
async function cartWithBigTest(page, request) {
  const { items } = await (await request.get(`${API}/labs?limit=50`)).json();
  const slug = items.find((l) => l.name === 'Lifeline Pathology').slug;
  const { lab, tests } = await (await request.get(`${API}/labs/${slug}`)).json();
  const t = tests.filter((x) => x.price >= 500).sort((a, b) => a.price - b.price)[0];
  const cart = {
    groups: [
      {
        lab: { _id: lab._id, name: lab.name, slug: lab.slug, area: lab.address?.area, city: lab.address?.city, homeCollection: lab.homeCollection, homeCollectionFee: lab.homeCollectionFee, coverTheme: lab.coverTheme },
        items: [{ _id: t._id, name: t.name, price: t.price, mrp: t.mrp, category: t.category, type: t.type, homeCollection: t.homeCollection }],
      },
    ],
  };
  await page.evaluate((c) => localStorage.setItem('sanjibani.cart', JSON.stringify(c)), cart);
}

test.describe.serial('Invite & earn', () => {
  let inviteLink;

  test('a patient finds the invite button and shares a personal link', async ({ page }) => {
    await login(page, 'patient');
    await page.getByTestId('invite-button').click();
    await expect(page).toHaveURL(/\/invite$/);
    await expect(page.getByRole('heading', { name: 'Invite friends, you both get ₹100 off' })).toBeVisible();

    const link = page.getByTestId('invite-link');
    await expect(link).toHaveValue(/\/register\?ref=[A-Z2-9]{8}$/);
    inviteLink = await link.inputValue();
    const code = inviteLink.split('ref=')[1];
    await expect(page.getByTestId('invite-code')).toHaveText(code);

    const wa = await page.getByTestId('invite-whatsapp').getAttribute('href');
    expect(wa).toContain('https://wa.me/?text=');
    expect(decodeURIComponent(wa)).toContain(inviteLink);
    expect(decodeURIComponent(wa)).toContain('₹100 off');

    await page.getByTestId('invite-copy').click();
    await expect(page.getByText('Link copied')).toBeVisible();

    // The same page also invites laboratories.
    await expect(page.getByTestId('lab-invite-link')).toHaveValue(new RegExp(`/register\\?role=lab&ref=${code}$`));

    // Also reachable from the account menu.
    await page.getByTestId('user-menu').click();
    await expect(page.getByRole('menuitem', { name: /Invite & earn/ })).toBeVisible();
  });

  test('a friend signs up through the link and gets a ₹100 coupon at checkout', async ({ page, request }) => {
    await page.goto('/');
    await logout(page);
    await page.goto(new URL(inviteLink).pathname + new URL(inviteLink).search);
    await expect(page.getByTestId('invite-banner')).toContainText('Riya invited you');
    await expect(page.getByTestId('invite-banner')).toContainText('₹100 off');

    await page.getByLabel('Full name').fill(FRIEND.name);
    await page.getByLabel('Email').fill(FRIEND.email);
    await page.getByLabel('Mobile number').fill(FRIEND.phone);
    await page.locator('input[name="password"]').fill(FRIEND.password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).not.toHaveURL(/\/register/);
    await expectEmail(request, FRIEND.email, /^Welcome to SanjiBani$/);

    // The coupon is listed on their invite page…
    await page.goto('/invite');
    const coupon = page.getByTestId('invite-coupon');
    await expect(coupon).toHaveCount(1);
    await expect(coupon).toContainText(/WELCOME[A-Z2-9]{6}/);
    await expect(coupon).toContainText('Ready to use');

    // …and offered as a one-tap chip at checkout.
    await cartWithBigTest(page, request);
    await page.goto('/cart');
    const chip = page.getByTestId('my-coupon-chip');
    await expect(chip).toContainText(/Use WELCOME[A-Z2-9]{6}: ₹100 off/);
    await chip.click();
    await expect(page.getByTestId('coupon-applied')).toBeVisible();
    await expect(page.getByTestId('coupon-discount')).toContainText('100');

    // The inviter sees their friend joined.
    await logout(page);
    await login(page, 'patient');
    await page.goto('/invite');
    await expect(page.getByTestId('invite-joined')).toHaveText('1');
  });

  test('a lab partner shares invites from the dashboard', async ({ page }) => {
    await page.goto('/');
    await logout(page);
    await login(page, 'lab');
    await page.getByRole('link', { name: 'Invite & share' }).first().click();
    await expect(page).toHaveURL(/\/partner\/invite$/);
    await expect(page.getByRole('heading', { name: 'Invite friends, they get ₹100 off' })).toBeVisible();
    await expect(page.getByTestId('invite-link')).toHaveValue(/\/register\?ref=/);
    await expect(page.getByTestId('lab-invite-link')).toHaveValue(/\/register\?role=lab/);
  });

  test('a sample collector can invite from the header', async ({ page }) => {
    await page.goto('/');
    await logout(page);
    await login(page, { email: 'collector1@sanjibani.in', password: 'Collector@123' });
    await page.getByTestId('invite-button').click();
    await expect(page).toHaveURL(/\/invite$/);
    await expect(page.getByTestId('invite-link')).toHaveValue(/\/register\?ref=/);
    await page.getByRole('link', { name: 'Back to dashboard' }).click();
    await expect(page).toHaveURL(/\/collector/);
  });

  test('the admin emails a laboratory an invitation', async ({ page, request }) => {
    await page.goto('/');
    await logout(page);
    await login(page, 'admin');
    await page.getByRole('link', { name: 'Invite labs' }).first().click();
    await expect(page).toHaveURL(/\/admin\/invites$/);
    await expect(page.getByTestId('lab-invite-template')).toContainText('Free listing, no joining fee');

    const form = page.getByTestId('lab-invite-form');
    await form.getByLabel('Lab name').fill('Sunrise Diagnostics');
    await form.getByLabel('Lab email').fill('hello@sunrise-diag.example');
    await form.getByLabel('Contact person').fill('Dr Mitra');
    await form.getByRole('button', { name: 'Send invite' }).click();
    await expect(page.getByText('Invite sent to hello@sunrise-diag.example')).toBeVisible();
    await expectEmail(request, 'hello@sunrise-diag.example', /^Invitation: list Sunrise Diagnostics on SanjiBani$/);

    const row = page.getByTestId('lab-invite-row').filter({ hasText: 'Sunrise Diagnostics' });
    await expect(row).toContainText('Invited');

    // Sending again straight away is blocked.
    await form.getByLabel('Lab name').fill('Sunrise Diagnostics');
    await form.getByLabel('Lab email').fill('hello@sunrise-diag.example');
    await form.getByRole('button', { name: 'Send invite' }).click();
    await expect(form.getByRole('alert')).toContainText('a few minutes ago');
  });

  test('the emailed link opens lab sign-up with the email filled in', async ({ page }) => {
    await page.goto('/');
    await logout(page);
    await page.goto('/register?role=lab&email=hello%40sunrise-diag.example');
    await expect(page.getByRole('heading', { name: 'Register your lab' })).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue('hello@sunrise-diag.example');
  });
});
