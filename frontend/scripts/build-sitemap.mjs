// Writes dist/sitemap.xml after `vite build`, listing every public lab, city and popular test page.
// Pulls live data from the API; if the API is unreachable the build still succeeds with the static pages.
import { writeFileSync } from 'node:fs';

const SITE = (process.env.VITE_SITE_URL || 'https://patholy.dpdns.org').replace(/\/$/, '');
const API = (process.env.SITEMAP_API_URL || (/^https?:/.test(process.env.VITE_API_URL || '') ? process.env.VITE_API_URL : '') || 'https://sanjibanihealth-lab.onrender.com/api').replace(/\/$/, '');
const OUT = new URL('../dist/sitemap.xml', import.meta.url);
const today = new Date().toISOString().slice(0, 10);

async function get(path, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      // Free-tier API can take ~50s to wake up
      const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(75_000) });
      if (res.ok) return await res.json();
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (i === attempts) throw err;
    }
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const urls = new Map();
const add = (path, priority, changefreq = 'weekly', lastmod = today) => {
  if (!urls.has(path)) urls.set(path, { priority, changefreq, lastmod });
};

add('/', '1.0', 'daily');
add('/labs', '0.9', 'daily');
add('/tests', '0.8', 'daily');
for (const page of ['terms', 'privacy', 'refunds', 'contact']) add(`/legal/${page}`, '0.3', 'yearly');

try {
  const meta = await get('/meta');
  for (const city of meta.cities || []) add(`/labs?city=${encodeURIComponent(city)}`, '0.8', 'weekly');
  for (const c of meta.categories || []) if (c.count > 0) add(`/tests?category=${encodeURIComponent(c.name)}`, '0.7');
  for (const t of meta.popularTests || []) add(`/tests?q=${encodeURIComponent(t.name)}`, '0.7');

  let page = 1;
  let pages = 1;
  do {
    const res = await get(`/labs?limit=50&page=${page}`);
    pages = res.pages || 1;
    for (const lab of res.items || []) add(`/labs/${lab.slug}`, '0.9', 'weekly', (lab.updatedAt || today).slice(0, 10));
    page += 1;
  } while (page <= pages && page <= 50);
} catch (err) {
  console.warn(`[sitemap] API unavailable (${err.message}); writing static pages only.`);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls].map(([path, u]) => `  <url>
    <loc>${esc(SITE + path)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
writeFileSync(OUT, xml);
console.log(`[sitemap] ${urls.size} URLs → dist/sitemap.xml`);
