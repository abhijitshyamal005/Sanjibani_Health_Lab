// Builds the email header banners (public/email/*.jpg) from the plain photos in
// scripts/email-banners/. The text is baked into the image because email clients
// (Gmail, Outlook) can't reliably place HTML text over a picture.
//
//   node scripts/build-email-banners.mjs
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'public', 'email');

export const BANNERS = {
  patient: {
    eyebrow: 'Sanjibani Health Lab',
    title: 'Health checks for<br>the whole family',
    points: ['Trusted labs', 'Home sample collection', 'Reports online'],
  },
  lab: {
    eyebrow: 'Sanjibani Partner Labs',
    title: 'Accurate tests.<br>Reports on time.',
    points: ['Bookings', 'Collectors', 'Reports in one place'],
  },
  collector: {
    eyebrow: 'Sanjibani Home Collection',
    title: 'Care that comes<br>to your door',
    points: ['On time', 'Safe and hygienic', 'Friendly experts'],
  },
};

const page = (img, { eyebrow, title, points }) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@500,600,700&display=block">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:400px;overflow:hidden;font-family:'General Sans',-apple-system,'Segoe UI',Roboto,sans-serif}
  .wrap{position:relative;width:1200px;height:400px;background:url(data:image/jpeg;base64,${img}) center/cover}
  .shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(20,83,45,.96) 0%,rgba(15,118,110,.9) 34%,rgba(15,118,110,.55) 50%,rgba(15,118,110,0) 64%)}
  .text{position:absolute;left:64px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center;color:#fff}
  .eyebrow{display:inline-flex;align-self:flex-start;align-items:center;gap:10px;background:#f97316;color:#fff;font-weight:600;font-size:22px;letter-spacing:.4px;padding:8px 18px;border-radius:999px}
  .eyebrow i{width:9px;height:9px;border-radius:50%;background:#fff}
  h1{margin-top:22px;font-size:60px;line-height:1.08;font-weight:700;letter-spacing:-1px}
  ul{list-style:none;margin-top:24px;display:flex;flex-wrap:wrap;gap:10px 26px}
  li{display:flex;align-items:center;gap:10px;font-size:24px;font-weight:500;color:#ecfdf5}
  li b{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#16a34a;font-size:17px;color:#fff}
</style></head><body><div class="wrap"><div class="shade"></div><div class="text">
  <span class="eyebrow"><i></i>${eyebrow}</span>
  <h1>${title}</h1>
  <ul>${points.map((p) => `<li><b>&#10003;</b>${p}</li>`).join('')}</ul>
</div></div></body></html>`;

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const tab = await browser.newPage({ viewport: { width: 1200, height: 400 } });
for (const [name, copy] of Object.entries(BANNERS)) {
  const img = (await readFile(path.join(here, 'email-banners', `${name}.jpg`))).toString('base64');
  await tab.setContent(page(img, copy), { waitUntil: 'networkidle' });
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: path.join(outDir, `${name}.jpg`), type: 'jpeg', quality: 85 });
  console.log(`email/${name}.jpg`);
}
await browser.close();
