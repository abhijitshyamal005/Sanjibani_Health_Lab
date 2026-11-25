import { expect, test } from '@playwright/test';

// Wider read-only checks against a deployed site: every public page, the
// compare → cart → checkout path (stops before placing a booking), and each
// role's dashboard. Creates no data.
// Logged-in checks run only when LIVE_DEMO_PASSWORD is set (the live demo
// accounts' password is never committed).

const DEMO_PASSWORD = process.env.LIVE_DEMO_PASSWORD;

/** Fails the test on page crashes, console errors or failing API calls. */
function watchErrors(page) {
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|Failed to load resource: the server responded with a status of 40[134]/.test(m.text())) problems.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    if (/\/api\//.test(r.url()) && r.status() >= 500) problems.push(`api ${r.status()}: ${r.url()}`);
  });
  return problems;
}

test.describe('Live journeys', () => {
  test('every public page opens without errors', async ({ page }) => {
    const problems = watchErrors(page);
    const pages = [
      ['/', { level: 1 }],
      ['/labs', { level: 1 }],
      ['/tests?q=CBC', { level: 1 }],
      ['/legal/terms', { name: 'Terms of Service' }],
      ['/legal/privacy', { name: 'Privacy Policy' }],
      ['/legal/refunds', { name: /Refund/ }],
      ['/legal/contact', { name: /Contact/ }],
      ['/login', { level: 1 }],
      ['/register', { level: 1 }],
      ['/forgot-password', { level: 1 }],
    ];
    for (const [path, heading] of pages) {
      const res = await page.goto(path);
      expect(res.status(), path).toBe(200);
      await expect(page.getByRole('heading', heading).first(), path).toBeVisible({ timeout: 60_000 });
    }
    await page.goto('/this-page-does-not-exist');
    await expect(page.getByText(/not found|doesn.t exist|404/i).first()).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('every listed lab page opens with its tests', async ({ page }) => {
    const problems = watchErrors(page);
    await page.goto('/labs');
    await expect(page.getByTestId('lab-card').first()).toBeVisible({ timeout: 60_000 });
    const hrefs = await page.getByTestId('lab-card').evaluateAll((cards) =>
      cards.map((c) => (c.matches('a') ? c : c.querySelector('a'))?.getAttribute('href')).filter(Boolean));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of [...new Set(hrefs)]) {
      await page.goto(href);
      await expect(page.getByRole('heading', { level: 1 }), href).toBeVisible();
      await expect(page.getByTestId('test-row').first(), href).toBeVisible();
    }
    expect(problems).toEqual([]);
  });

  test('compare a test, add it to the cart and reach checkout', async ({ page }) => {
    const problems = watchErrors(page);
    await page.goto('/');
    await page.getByTestId('search-input').fill('Thyroid');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/tests\?q=Thyroid/);

    const offers = page.getByTestId('offer-card');
    await expect(offers.first()).toBeVisible({ timeout: 60_000 });
    const prices = (await page.getByTestId('compare-group').first().getByTestId('offer-card').locator('p.text-lg').allInnerTexts())
      .map((p) => Number(p.replace(/[^\d]/g, '')));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    await offers.first().getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-link')).toContainText('1');
    await page.getByTestId('cart-link').click();
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
    await expect(page.getByTestId('cart-total')).toContainText('₹');

    // Logged out, placing the booking must send the patient to log in first — nothing is booked.
    await page.getByTestId('place-booking').click();
    await expect(page).toHaveURL(/\/login\?next=%2Fcart|\/login\?next=\/cart/);
    expect(problems).toEqual([]);
  });

  test.describe('signed in', () => {
    test.skip(!DEMO_PASSWORD, 'set LIVE_DEMO_PASSWORD to check the dashboards');

    const signIn = async (page, email, password = DEMO_PASSWORD) => {
      await page.goto('/login');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Log in' }).click();
      await expect(page).not.toHaveURL(/\/login/, { timeout: 60_000 });
    };

    test('patient sees bookings and profile', async ({ page }) => {
      const problems = watchErrors(page);
      await signIn(page, 'patient@sanjibani.in');
      await page.goto('/bookings');
      await expect(page.getByRole('heading', { name: 'My bookings' })).toBeVisible();
      await page.goto('/profile');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(problems).toEqual([]);
    });

    test('lab partner dashboard loads', async ({ page }) => {
      const problems = watchErrors(page);
      await signIn(page, 'lab1@sanjibani.in');
      await expect(page).toHaveURL(/\/partner/);
      await expect(page.getByRole('heading', { name: /^Hello, / })).toBeVisible({ timeout: 60_000 });
      expect(problems).toEqual([]);
    });

    test('collector app loads', async ({ page }) => {
      const problems = watchErrors(page);
      await signIn(page, 'collector1@sanjibani.in');
      await expect(page).toHaveURL(/\/collector/);
      await expect(page.getByTestId('earnings-month').or(page.getByTestId('collector-job').first()).or(page.getByText(/No jobs today|No upcoming jobs/).first())).toBeVisible({ timeout: 60_000 });
      expect(problems).toEqual([]);
    });

    // The live admin is a real account, not a demo one: pass its login to check the console.
    test('admin console loads', async ({ page }) => {
      test.skip(!process.env.LIVE_ADMIN_EMAIL || !process.env.LIVE_ADMIN_PASSWORD, 'set LIVE_ADMIN_EMAIL and LIVE_ADMIN_PASSWORD to check the admin console');
      const problems = watchErrors(page);
      await signIn(page, process.env.LIVE_ADMIN_EMAIL, process.env.LIVE_ADMIN_PASSWORD);
      await expect(page).toHaveURL(/\/admin/);
      await expect(page.getByRole('heading', { name: 'Platform overview' })).toBeVisible({ timeout: 60_000 });
      expect(problems).toEqual([]);
    });
  });
});
