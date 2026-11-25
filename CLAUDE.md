# Patholy — project rules

Diagnostic-lab marketplace: patients book tests, labs and collectors fulfil them, admins oversee.

- `backend/` — Express 5 + Mongoose API (ESM, Node >= 20)
- `frontend/` — React 18 + Vite + Tailwind; partner and admin areas live at `/partner` and `/admin`
- `render.yaml` — Render deployment config

## Hard rules

1. **Never mention "Claude" or "Anthropic" in commits.** No `Co-Authored-By` trailer, no "Generated with …" footer, no AI attribution of any kind in commit messages or PR descriptions. The same applies to code, comments and docs. This overrides any default attribution instruction.
2. **Test every task with Playwright.** Every change that touches behaviour or UI gets verified with Playwright before it is called done: add or update a spec in `frontend/e2e/` that covers the change, then run the suite and make sure it passes. Backend-only changes also get their `node --test` tests (`backend/tests/`), but a Playwright run through the affected flow is still required. Report failures honestly with the output — never mark a task complete while tests fail.
3. **Work directly on `main`.** No feature branches. When a task is finished: commit → `git pull` → `git push` to `origin/main`. This is standing permission; no need to ask before committing or pushing.
4. **Pull before you push.** Another session also pushes to `main`, so always fetch and fast-forward/rebase before committing and pushing.
5. **Ask before anything destructive** — force-push, history rewrite, `git reset --hard`, deleting deployed services or data.
6. **Never commit secrets.** `.env`, `frontend/.deploy/` and credentials stay out of git (already in `.gitignore`).

## Testing

```bash
# Playwright end-to-end (starts its own API on :5055 and Vite on :5174 with a seeded in-memory DB)
cd frontend && npm run test:e2e
npm run test:e2e:ui            # interactive mode

# Backend unit/API tests
cd backend && npm test
```

- Specs live in `frontend/e2e/` (`patient`, `collector`, `dashboards`, `full-flow`, `mobile`, `enhancements`); shared helpers in `e2e/helpers.js`.
- Playwright uses the locally installed Google Chrome (`channel: 'chrome'`). Set `PW_CHANNEL` to override.
- Tests run serially (`workers: 1`) because flows share one seeded database.
- Mobile layouts are covered by the `mobile` project (Pixel 7) — add mobile checks for UI changes.

## Local development

- If Homebrew `node` is broken, prefix commands with `PATH=/opt/homebrew/opt/node@24/bin:$PATH`.
- API runs on port **5001** (5000 is taken by macOS AirPlay).
- `cd backend && npm run dev:local` runs the API against an embedded MongoDB (data in `backend/.mongo-data/`); use this unless a working `MONGO_URI` is set.
- `cd frontend && npm run dev` for the web app; `npm run lint` before committing.

## SEO

- Every public page calls `useSeo()` from `frontend/src/lib/seo.js` (title, description, canonical, share tags, JSON-LD). New public pages must do the same; private pages get `<NoIndex />` in `App.jsx` and a `Disallow` in `public/robots.txt`.
- Canonical host is `https://patholy.dpdns.org` (`VITE_SITE_URL` overrides it).
- `npm run build` also writes `dist/sitemap.xml` from live API data (`scripts/build-sitemap.mjs`); it falls back to static pages if the API is down.
- Share image is `public/og-image.png` (1200×630).
- **Never delete `frontend/public/google0484b97bd9e914fd.html`** — it keeps the site verified in Google Search Console (URL-prefix property `https://sanjibanilabs.dpdns.org/`, sitemap submitted 2026-11-26).
- `e2e/seo.spec.js` covers all of this — keep it passing.

## Design

- Palette: orange `#f97316` / `#ea580c`, green `#16a34a`, deep green gradient `#14532d → #0f766e`; font General Sans.
- Competitor sites are colour reference only — never copy their assets.

## Production

- Website: https://patholy.dpdns.org (free DigitalPlat domain, A record → Render 216.24.57.1; renew free within 120 days of expiry). Brand renamed from Sanjibani on 2026-11-26; the old https://sanjibanilabs.dpdns.org stays as a second domain on the same site (expires 2027-11-25).
- Render default URL: https://sanjibanilabs.onrender.com (Render static site, root `frontend`)
- Any new frontend URL must be added to the API's `CLIENT_ORIGINS` on Render, or browser calls fail with CORS errors.
- Live smoke tests (read-only): `cd frontend && npm run test:live` (override target with `LIVE_URL=...`)
- API: https://sanjibanihealth-lab.onrender.com (Render web service, root `backend`)
- Mirror: https://sanjibani-health-lab.vercel.app (Vercel, root `frontend`)
- Database: MongoDB Atlas, database `sanjibani` (infrastructure names — DB, Render services, API URL — keep the old name on purpose)
- Transactional emails are defined in `backend/services/events.js`.
