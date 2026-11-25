import { expect, test } from '@playwright/test';

// Email header photos (built by scripts/build-email-banners.mjs) carry a green text
// panel on the left, so the left side is never a plain empty wall.
for (const name of ['patient', 'lab', 'collector']) {
  test(`email banner ${name}.jpg is 1200x400 with a filled green text panel`, async ({ page }) => {
    await page.goto('/');
    const stats = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      // Average colour of a strip at the far left edge (behind the text block).
      const { data } = ctx.getImageData(10, 20, 30, 360);
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
      const n = data.length / 4;
      // Count bright pixels in the text area: white headline letters.
      const text = ctx.getImageData(64, 120, 480, 120).data;
      let white = 0;
      for (let i = 0; i < text.length; i += 4) if (text[i] > 235 && text[i + 1] > 235 && text[i + 2] > 235) white++;
      return { w: img.naturalWidth, h: img.naturalHeight, r: r / n, g: g / n, b: b / n, white };
    }, `/email/${name}.jpg`);

    expect(stats.w).toBe(1200);
    expect(stats.h).toBe(400);
    expect(stats.g).toBeGreaterThan(stats.r + 30); // deep green panel, not a pale wall
    expect(stats.g).toBeLessThan(160);
    expect(stats.white).toBeGreaterThan(3000); // headline text is present
  });
}
