import { expect, test } from '@playwright/test';

// Read-only smoke checks against a deployed site. Creates no data.
// Run: LIVE_URL=https://sanjibanilabs.dpdns.org npm run test:live

test.describe('Live site', () => {
  test('home page loads labs from the API without CORS errors', async ({ page }) => {
    const corsErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /CORS|Access-Control-Allow-Origin/i.test(msg.text())) corsErrors.push(msg.text());
    });
    const apiCalls = [];
    page.on('response', (res) => {
      if (/\/api\//.test(res.url())) apiCalls.push(res.status());
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Lab cards come from the API, so seeing them proves the browser can reach it
    await expect(page.getByTestId('lab-card').first()).toBeVisible({ timeout: 60_000 });
    expect(apiCalls.length).toBeGreaterThan(0);
    expect(apiCalls.every((s) => s < 500)).toBe(true);
    expect(corsErrors).toEqual([]);
  });

  test('deep links work (SPA rewrite)', async ({ page }) => {
    const res = await page.goto('/labs');
    expect(res.status()).toBe(200);
    await expect(page.getByTestId('lab-card').first()).toBeVisible({ timeout: 60_000 });
  });

  test('robots.txt, sitemap and share image are served', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.ok()).toBe(true);
    expect(await robots.text()).toContain('Sitemap: https://sanjibanilabs.dpdns.org/sitemap.xml');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBe(true);
    const xml = await sitemap.text();
    expect(xml).toContain('<urlset');
    expect(xml).toMatch(/<loc>https:\/\/sanjibanilabs\.dpdns\.org\/labs\/[a-z0-9-]+<\/loc>/);

    const og = await request.get('/og-image.png');
    expect(og.headers()['content-type']).toContain('image/png');
  });

  test('pages carry canonical and share tags', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://sanjibanilabs.dpdns.org/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.png$/);
    await expect(page.locator('#seo-jsonld')).toHaveCount(1);
  });

  test('login form reaches the API', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByLabel('Password', { exact: true }).fill('wrong-password-123');
    const reply = page.waitForResponse((r) => /\/api\/.*login/.test(r.url()));
    await page.getByRole('button', { name: 'Log in' }).click();
    const res = await reply;
    // 401/400 means the API answered; a CORS block would never produce a response here
    expect([400, 401, 404, 422, 429]).toContain(res.status());
    await expect(page).toHaveURL(/\/login/);
  });
});
