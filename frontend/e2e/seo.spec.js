import { expect, test } from '@playwright/test';

const SITE = 'https://sanjibanilabs.dpdns.org';

const head = (page) =>
  page.evaluate(() => {
    const meta = (sel) => document.head.querySelector(sel)?.getAttribute('content') ?? null;
    const ld = document.getElementById('seo-jsonld');
    return {
      title: document.title,
      description: meta('meta[name="description"]'),
      robots: meta('meta[name="robots"]'),
      canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      ogTitle: meta('meta[property="og:title"]'),
      ogUrl: meta('meta[property="og:url"]'),
      ogImage: meta('meta[property="og:image"]'),
      twitterCard: meta('meta[name="twitter:card"]'),
      jsonLd: ld ? JSON.parse(ld.textContent) : null,
      canonicalCount: document.head.querySelectorAll('link[rel="canonical"]').length,
      descriptionCount: document.head.querySelectorAll('meta[name="description"]').length,
    };
  });

const graphTypes = (ld) => (ld?.['@graph'] || [ld]).map((n) => n?.['@type']);

test.describe('SEO', () => {
  test('robots.txt allows public pages, blocks private ones and points to the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBe(true);
    const body = await res.text();
    expect(body).toContain('Allow: /');
    for (const p of ['/admin', '/partner', '/collector', '/bookings', '/cart']) expect(body).toContain(`Disallow: ${p}`);
    expect(body).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });

  test('share image and icons are served', async ({ request }) => {
    for (const p of ['/og-image.png', '/logo-512.png', '/apple-touch-icon.png']) {
      const res = await request.get(p);
      expect(res.ok(), p).toBe(true);
      expect(res.headers()['content-type']).toContain('image/png');
    }
  });

  test('home page has full meta, canonical and organization data', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('lab-card').first()).toBeVisible();
    const h = await head(page);
    expect(h.title).toContain('Sanjibani');
    expect(h.title).toMatch(/lab tests/i);
    expect(h.description.length).toBeGreaterThan(70);
    expect(h.description.length).toBeLessThanOrEqual(160);
    expect(h.canonical).toBe(`${SITE}/`);
    expect(h.ogUrl).toBe(`${SITE}/`);
    expect(h.ogImage).toBe(`${SITE}/og-image.png`);
    expect(h.twitterCard).toBe('summary_large_image');
    expect(h.robots).toBe('index, follow');
    expect(graphTypes(h.jsonLd)).toEqual(expect.arrayContaining(['Organization', 'WebSite']));
    // No duplicate tags left behind by the static HTML + runtime updates
    expect(h.canonicalCount).toBe(1);
    expect(h.descriptionCount).toBe(1);
  });

  test('lab page gets its own title, canonical and DiagnosticLab data', async ({ page }) => {
    // Other specs may approve a brand-new lab with no tests yet; pick one that lists tests.
    await page.goto('/labs');
    const card = page.getByTestId('lab-card').filter({ hasText: 'Tests from' }).first();
    await expect(card).toBeVisible();
    const name = (await card.getByRole('heading').first().innerText()).trim();
    await card.click();
    await expect(page).toHaveURL(/\/labs\/[a-z0-9-]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
    const slug = new URL(page.url()).pathname.split('/').pop();

    await expect.poll(async () => (await head(page)).title).toContain(name);
    const h = await head(page);
    expect(h.title).toMatch(/test prices/i);
    expect(h.description).toContain(name);
    expect(h.canonical).toBe(`${SITE}/labs/${slug}`);
    expect(h.ogTitle).toBe(h.title);

    const lab = h.jsonLd['@graph'].find((n) => n['@type'] === 'DiagnosticLab');
    expect(lab.name).toBe(name);
    expect(lab.address.addressCountry).toBe('IN');
    expect(lab.address.addressLocality).toBeTruthy();
    expect(lab.hasOfferCatalog.itemListElement.length).toBeGreaterThan(0);
    const offer = lab.hasOfferCatalog.itemListElement[0];
    expect(offer.priceCurrency).toBe('INR');
    expect(typeof offer.price).toBe('number');
    const crumbs = h.jsonLd['@graph'].find((n) => n['@type'] === 'BreadcrumbList');
    expect(crumbs.itemListElement.map((i) => i.name)).toEqual(['Home', 'Labs', name]);
  });

  test('test search page title and canonical carry the test name', async ({ page }) => {
    await page.goto('/tests?q=Lipid%20Profile');
    await expect(page.getByTestId('compare-group').first()).toBeVisible();
    await expect.poll(async () => (await head(page)).title).toMatch(/Lipid Profile test price/);
    const h = await head(page);
    expect(h.description).toMatch(/starting at ₹\d+/);
    expect(h.canonical).toBe(`${SITE}/tests?q=Lipid%20Profile`);
  });

  test('/labs?city= opens that city and keeps a city canonical', async ({ page }) => {
    await page.goto('/labs?city=Kolkata');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('in Kolkata');
    await expect(page).not.toHaveURL(/city=/);
    await expect(page.getByTestId('lab-card').first()).toBeVisible();
    for (const c of await page.getByTestId('lab-card').allInnerTexts()) expect(c).toContain('Kolkata');
    const h = await head(page);
    expect(h.title).toContain('Diagnostic labs in Kolkata');
    expect(h.canonical).toBe(`${SITE}/labs?city=Kolkata`);
  });

  test('legal pages are titled; private pages and 404s are noindex; defaults return on navigation', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect.poll(async () => (await head(page)).title).toBe('Privacy Policy | Sanjibani');
    expect((await head(page)).canonical).toBe(`${SITE}/legal/privacy`);

    await page.goto('/cart');
    await expect.poll(async () => (await head(page)).robots).toBe('noindex, follow');

    await page.goto('/this-page-does-not-exist');
    await expect.poll(async () => (await head(page)).robots).toBe('noindex, follow');

    // Client-side navigation back to an indexable page must undo noindex
    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(async () => (await head(page)).robots).toBe('index, follow');
    expect((await head(page)).canonical).toBe(`${SITE}/`);
  });
});
