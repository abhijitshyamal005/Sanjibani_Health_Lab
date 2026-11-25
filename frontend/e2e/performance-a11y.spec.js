import { expect, test } from '@playwright/test';

test.describe('Speed and accessibility guards', () => {
  test('home page loads light: WebP hero first, no dashboard code, no blocking font CSS', async ({ page }) => {
    const requests = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.goto('/');
    await expect(page.getByTestId('lab-card').first()).toBeVisible();

    // Hero is a small, high-priority WebP with a responsive srcset
    const hero = page.locator('img[alt^="A smiling phlebotomist"]');
    await expect(hero).toHaveAttribute('fetchpriority', 'high');
    await expect(hero).toHaveAttribute('srcset', /hero-560\.webp 560w/);
    expect(await hero.evaluate((img) => img.currentSrc)).toMatch(/\.webp$/);
    await expect(page.locator('link[rel="preload"][as="image"][href="/img/hero-560.webp"]')).toHaveCount(1);

    // Dashboards are split out and not downloaded for patients
    expect(requests.some((u) => /AdminApp|PartnerApp|CollectorApp/.test(u))).toBe(false);
    // No JPG photos on the home page any more
    expect(requests.filter((u) => /\/assets\/.*\.jpe?g/.test(u))).toEqual([]);

    // Font CSS is preloaded, not a render-blocking stylesheet in the initial HTML
    const blockingFontCss = await page.evaluate(() =>
      [...document.querySelectorAll('link[rel="stylesheet"]')].filter(
        (l) => /fontshare|googleapis/.test(l.href) && l.getAttribute('onload') === null && l.parentElement?.tagName !== 'NOSCRIPT'
      ).length
    );
    expect(blockingFontCss).toBe(0);
  });

  test('carousel: hidden slides are inert, dots are 24px tap targets, slide titles are h2', async ({ page }) => {
    await page.goto('/');
    const slides = page.locator('[aria-roledescription="slide"]');
    await expect(slides.first()).toBeVisible();
    const n = await slides.count();
    expect(n).toBeGreaterThan(1);
    for (let i = 0; i < n; i++) {
      const hidden = (await slides.nth(i).getAttribute('aria-hidden')) === 'true';
      expect(await slides.nth(i).evaluate((el) => el.inert)).toBe(hidden);
    }
    const dots = page.getByRole('button', { name: /Go to offer/ });
    for (let i = 0; i < (await dots.count()); i++) {
      const box = await dots.nth(i).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    }
    expect(await slides.first().locator('h2').count()).toBe(1);
  });

  test('ratings expose their label to screen readers', async ({ page }) => {
    await page.goto('/');
    const rating = page.getByRole('img', { name: /out of 5/ }).first();
    await expect(rating).toBeAttached();
  });

  test('lab page headings go h1 → h2 → h3 without skipping', async ({ page }) => {
    await page.goto('/labs');
    const card = page.getByTestId('lab-card').filter({ hasText: 'Tests from' }).first();
    const name = (await card.getByRole('heading').first().innerText()).trim();
    await card.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
    await expect(page.getByRole('heading', { level: 3 }).first()).toBeAttached();
    const levels = await page.locator('main h1, main h2, main h3, main h4, main h5, main h6').evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  });

  test('lazy-loaded pages still open', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
