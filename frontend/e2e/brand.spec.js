import { expect, test } from '@playwright/test';

// The leaf-and-pulse mark: the pulse path is unique to the current logo.
const PULSE = 'M9 36h12l4-9 6 17 4-11 3 3h17';

test.describe('Brand logo', () => {
  test('header and footer show the leaf-and-pulse mark with the Health Lab tagline', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner').getByRole('link', { name: 'Sanjibani home' });
    await expect(header).toBeVisible();
    await expect(header.locator(`path[d="${PULSE}"]`)).toHaveCount(1);
    await expect(header.getByTestId('logo-tagline')).toHaveText(/health lab/i);

    const footer = page.getByRole('contentinfo').getByRole('link', { name: 'Sanjibani home' });
    await expect(footer.locator(`path[d="${PULSE}"]`)).toHaveCount(1);

    // The gradient each mark references must exist, or the tile renders blank.
    const fills = await page.locator('a[aria-label="Sanjibani home"] svg rect').evaluateAll((rects) =>
      rects.map((r) => {
        const id = r.getAttribute('fill').match(/url\(#(.+)\)/)?.[1];
        return Boolean(id && document.getElementById(id));
      })
    );
    expect(fills.length).toBeGreaterThan(1);
    expect(fills.every(Boolean)).toBe(true);
  });

  test('favicon is the new mark', async ({ request }) => {
    const res = await request.get('/favicon.svg');
    expect(res.ok()).toBe(true);
    expect(await res.text()).toContain(PULSE);
  });
});
